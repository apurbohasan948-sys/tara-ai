/**
 * GameEngine.ts
 * Core Direct-Display Game Engine for TARA.
 *
 * Maintains complete local game state, runs the voice state machine,
 * interfaces with real and simulated STT, executes AI opponent logic,
 * and synchronizes face expressions and speech with PersonalityEngine.
 */

import {
  ConnectFourState,
  DiceGameState,
  DirectGameMasterState,
  DirectGameType,
  DirectMemoryCard,
  GameTurn,
  GameVoiceState,
  GuessNumberState,
  HigherLowerState,
  MemoryMatchState,
  ParsedGameAction,
  ParseResult,
  PatternMemoryState,
  QuickReactionState,
  ReactionGameState,
  RockPaperScissorsState,
  SimonSaysState,
  TicTacToeState,
} from './GameState';
import { GameVoiceInputParser } from './GameVoiceInputParser';
import { animationCoordinator } from '../AnimationCoordinator';
import { armController } from '../ArmController';
import { personalityEngine } from '../PersonalityEngine';
import { voiceManager } from '../VoiceManager';
import { TaraArmGesture, TaraExpression } from '../../types';

export class GameEngine {
  private state: DirectGameMasterState;
  private listeners: (() => void)[] = [];

  // Speech Recognition Handle (Web Speech API)
  private speechRec: any = null;
  private isListeningContinuous: boolean = false;
  private reactionTimeout: any = null;
  private invitationInterval: any = null;

  constructor() {
    this.state = this.createInitialMasterState();
    this.initSpeechRecognition();
  }

  // ==========================================
  // INITIAL STATE BUILDER
  // ==========================================
  private createInitialMasterState(): DirectGameMasterState {
    return {
      activeGame: 'NONE',
      voiceState: 'GAME_IDLE',
      currentTurn: 'player',
      playerScore: 0,
      taraScore: 0,
      gameStatusText: 'Ready to play! Say a game name or start.',
      expectedInputPrompt: 'Say a game name',
      recognizedSpeech: '',
      parsedActionSummary: 'None',
      lastErrorGuidance: null,
      consecutiveErrors: 0,
      resultBanner: null,

      ticTacToe: this.createInitialTicTacToeState(),
      rockPaperScissors: this.createInitialRpsState(),
      guessNumber: this.createInitialGuessNumberState(),
      higherLower: this.createInitialHigherLowerState(),
      memoryMatch: this.createInitialMemoryMatchState(),
      connectFour: this.createInitialConnectFourState(),
      patternMemory: this.createInitialPatternMemoryState(),
      reactionGame: this.createInitialReactionGameState(),
      simonSays: this.createInitialSimonSaysState(),
      diceGame: this.createInitialDiceGameState(),
      quickReaction: this.createInitialQuickReactionState(),

      invitationActive: false,
      invitedGame: 'TIC_TAC_TOE',
      invitationTimeoutSec: 10,
    };
  }

  // ==========================================
  // SUBSCRIPTION
  // ==========================================
  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getState(): DirectGameMasterState {
    return this.state;
  }

  public getActiveGame(): DirectGameType {
    return this.state.activeGame;
  }

  public isInvitationActive(): boolean {
    return this.state.invitationActive;
  }

  // ==========================================
  // SPEECH RECOGNITION (WEB SPEECH API)
  // ==========================================
  private initSpeechRecognition() {
    if (typeof window !== 'undefined') {
      const SpeechRecClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecClass) {
        try {
          this.speechRec = new SpeechRecClass();
          this.speechRec.continuous = true;
          this.speechRec.interimResults = false;
          this.speechRec.lang = 'en-US';

          this.speechRec.onresult = (event: any) => {
            const results = event.results;
            if (results && results.length > 0) {
              const latest = results[results.length - 1][0].transcript;
              this.handleVoiceInput(latest);
            }
          };

          this.speechRec.onerror = (e: any) => {
            // Ignore non-fatal audio capture pauses
            if (e.error !== 'no-speech') {
              // Graceful log
            }
          };

          this.speechRec.onend = () => {
            if (this.isListeningContinuous && this.state.activeGame !== 'NONE') {
              try {
                this.speechRec.start();
              } catch {}
            }
          };
        } catch {
          this.speechRec = null;
        }
      }
    }
  }

  public startSpeechRecognition(lang: string = 'en-US') {
    if (!this.speechRec) return;
    try {
      this.speechRec.lang = lang;
      this.isListeningContinuous = true;
      this.speechRec.start();
      this.state.voiceState = 'GAME_LISTENING';
      this.notify();
    } catch {}
  }

  public stopSpeechRecognition() {
    this.isListeningContinuous = false;
    if (this.speechRec) {
      try {
        this.speechRec.stop();
      } catch {}
    }
    if (this.state.activeGame !== 'NONE') {
      this.state.voiceState = 'GAME_IDLE';
      this.notify();
    }
  }

  // ==========================================
  // VOICE INPUT HANDLING PIPELINE
  // ==========================================
  /**
   * Primary voice pipeline:
   * User Voice -> STT -> GameVoiceInputParser -> GameEngine -> GameState -> Face / Renderer
   */
  public handleVoiceInput(transcript: string): ParseResult {
    const raw = transcript.trim();
    this.state.recognizedSpeech = raw;
    this.state.voiceState = 'GAME_PROCESSING';
    this.notify();

    // Check invitation first
    if (this.state.invitationActive) {
      const isYes = /\b(yes|yeah|sure|ok|play|হ্যাঁ|হাঁ|খেলব|khelbo|hyan)\b/i.test(raw);
      const isNo = /\b(no|nope|না|থাক|na)\b/i.test(raw);

      if (isYes) {
        this.acceptInvitation();
        return { valid: true, action: { type: 'CONFIRM_YES' }, rawInput: raw, language: 'en', confidence: 1 };
      } else if (isNo) {
        this.dismissInvitation();
        return { valid: true, action: { type: 'CONFIRM_NO' }, rawInput: raw, language: 'en', confidence: 1 };
      }
    }

    // Parse input against active game rules
    const result = GameVoiceInputParser.parseInput(raw, this.state.activeGame);
    this.state.parsedActionSummary = JSON.stringify(result.action);

    if (result.valid) {
      this.state.consecutiveErrors = 0;
      this.state.lastErrorGuidance = null;
      this.state.voiceState = 'GAME_ACTION_ACCEPTED';
      this.executeAction(result.action);
    } else {
      // Invalid input handling
      this.state.consecutiveErrors++;
      this.state.voiceState = 'GAME_INVALID_INPUT';
      this.state.lastErrorGuidance = result.guidance || "I didn't understand. Please say that again.";
      animationCoordinator.setExpression('confused');

      // Voice prompt guidance if errors repeat
      if (this.state.consecutiveErrors <= 2) {
        voiceManager.speak(result.guidance || "I didn't understand. Could you repeat that?", 'curious');
      } else {
        voiceManager.speak(
          `Let's try again! You can say a valid move or say "Exit" to leave.`,
          'playful'
        );
      }

      setTimeout(() => {
        if (this.state.activeGame !== 'NONE' && !this.state.resultBanner) {
          this.state.voiceState = 'GAME_LISTENING';
          this.notify();
        }
      }, 1800);
    }

    this.notify();
    return result;
  }

  /**
   * Simulated voice input helper: runs through the EXACT same voice parsing pipeline.
   */
  public processSimulatedVoice(text: string): ParseResult {
    return this.handleVoiceInput(text);
  }

  // ==========================================
  // ACTION DISPATCHER
  // ==========================================
  private executeAction(action: ParsedGameAction) {
    // Meta controls
    if (action.type === 'RESTART_GAME') {
      this.restartGame();
      return;
    }
    if (action.type === 'EXIT_GAME') {
      this.exitGame();
      return;
    }

    switch (this.state.activeGame) {
      case 'TIC_TAC_TOE':
        if (action.type === 'PLACE_MARK') {
          this.playTicTacToe(action.position);
        }
        break;

      case 'ROCK_PAPER_SCISSORS':
        if (action.type === 'RPS_CHOICE') {
          this.playRockPaperScissors(action.choice);
        }
        break;

      case 'GUESS_NUMBER':
        if (action.type === 'GUESS_NUMBER') {
          this.playGuessNumber(action.value);
        }
        break;

      case 'HIGHER_LOWER':
        if (action.type === 'PREDICT_HIGH_LOW') {
          this.playHigherLower(action.prediction);
        }
        break;

      case 'MEMORY_MATCH':
        if (action.type === 'SELECT_CARD') {
          this.playMemoryMatch(action.cardIndex);
        }
        break;

      case 'CONNECT_FOUR':
        if (action.type === 'DROP_COLUMN') {
          this.playConnectFour(action.column);
        }
        break;

      case 'PATTERN_MEMORY':
        if (action.type === 'REPEAT_PATTERN') {
          this.playPatternMemory(action.sequence);
        }
        break;

      case 'REACTION':
      case 'QUICK_REACTION':
        if (action.type === 'REACTION_TRIGGER') {
          this.recordReaction();
        }
        break;

      case 'SIMON_SAYS':
        if (action.type === 'SIMON_ACTION') {
          this.playSimonSays(action.action);
        }
        break;

      case 'DICE_GAME':
        if (action.type === 'ROLL_DICE') {
          this.rollDice();
        }
        break;

      default:
        break;
    }
  }

  // ==========================================
  // GAME SELECTION & LIFECYCLE
  // ==========================================
  public startGame(game: DirectGameType) {
    this.state.activeGame = game;
    this.state.voiceState = 'GAME_STARTING';
    this.state.resultBanner = null;
    this.state.lastErrorGuidance = null;
    this.state.consecutiveErrors = 0;
    this.state.invitationActive = false;

    // Reset sub-game states
    switch (game) {
      case 'TIC_TAC_TOE':
        this.state.ticTacToe = this.createInitialTicTacToeState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say a position from 1 to 9 (e.g. "five" or "পাঁচ")';
        this.state.gameStatusText = 'YOUR TURN (SAY 1-9)';
        animationCoordinator.setExpression('playful');
        armController.setGesture('GREETING');
        voiceManager.speak("Tic-Tac-Toe! You are X, I am O. Say a number from 1 to 9 for your move!", 'excited');
        break;

      case 'ROCK_PAPER_SCISSORS':
        this.state.rockPaperScissors = this.createInitialRpsState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say "rock", "paper", or "scissors"';
        this.state.gameStatusText = 'CHOOSE ROCK, PAPER, OR SCISSORS';
        animationCoordinator.setExpression('excited');
        armController.setGesture('PLAYING');
        voiceManager.speak("Rock, Paper, Scissors! Say your choice into the mic!", 'excited');
        break;

      case 'GUESS_NUMBER':
        this.state.guessNumber = this.createInitialGuessNumberState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say any number between 1 and 100';
        this.state.gameStatusText = 'GUESS A NUMBER (1 - 100)';
        animationCoordinator.setExpression('curious');
        voiceManager.speak("I've picked a secret number between 1 and 100. Make your first guess!", 'playful');
        break;

      case 'HIGHER_LOWER':
        this.state.higherLower = this.createInitialHigherLowerState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say "higher" or "lower"';
        this.state.gameStatusText = 'WILL NEXT NUMBER BE HIGHER OR LOWER?';
        animationCoordinator.setExpression('curious');
        voiceManager.speak(`The number is ${this.state.higherLower.currentNumber}. Will the next one be higher or lower?`, 'curious');
        break;

      case 'MEMORY_MATCH':
        this.state.memoryMatch = this.createInitialMemoryMatchState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say two card numbers (1 - 12)';
        this.state.gameStatusText = 'SELECT A CARD (SAY 1-12)';
        animationCoordinator.setExpression('focused');
        voiceManager.speak("Memory Match! Choose two cards by saying their numbers from 1 to 12.", 'happy');
        break;

      case 'CONNECT_FOUR':
        this.state.connectFour = this.createInitialConnectFourState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say a column from 1 to 7';
        this.state.gameStatusText = 'YOUR TURN (SAY COLUMN 1-7)';
        animationCoordinator.setExpression('playful');
        voiceManager.speak("Connect Four! Say a column from 1 to 7 to drop your disc!", 'excited');
        break;

      case 'PATTERN_MEMORY':
        this.state.patternMemory = this.createInitialPatternMemoryState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Repeat the numbers in order';
        this.state.gameStatusText = 'MEMORIZE THE PATTERN';
        this.playPatternSequence();
        break;

      case 'REACTION':
      case 'QUICK_REACTION':
        this.state.reactionGame = this.createInitialReactionGameState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say "GO" or "NOW" when green circle appears';
        this.state.gameStatusText = 'WAIT FOR SIGNAL...';
        this.startReactionCountdown();
        break;

      case 'SIMON_SAYS':
        this.state.simonSays = this.createInitialSimonSaysState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Listen for "Simon Says"';
        this.state.gameStatusText = 'SIMON SAYS LISTENING';
        this.generateSimonCommand();
        break;

      case 'DICE_GAME':
        this.state.diceGame = this.createInitialDiceGameState();
        this.state.currentTurn = 'player';
        this.state.expectedInputPrompt = 'Say "roll" or "ডাইস ফেলো"';
        this.state.gameStatusText = 'SAY "ROLL" TO THROW DICE';
        animationCoordinator.setExpression('excited');
        voiceManager.speak("Dice Duel! Say 'Roll' to cast your dice against mine!", 'excited');
        break;

      default:
        break;
    }

    setTimeout(() => {
      if (this.state.activeGame !== 'NONE' && this.state.voiceState === 'GAME_STARTING') {
        this.state.voiceState = 'GAME_LISTENING';
        this.notify();
      }
    }, 1200);

    this.notify();
  }

  public restartGame() {
    if (this.state.activeGame !== 'NONE') {
      voiceManager.speak("Restarting the game! Fresh board ready.", 'playful');
      this.startGame(this.state.activeGame);
    }
  }

  public exitGame() {
    this.state.activeGame = 'NONE';
    this.state.voiceState = 'GAME_IDLE';
    this.state.resultBanner = null;
    this.state.invitationActive = false;
    animationCoordinator.setExpression('happy');
    armController.setGesture('IDLE');
    voiceManager.speak("Good game! I'm back to companion mode.", 'happy');
    this.notify();
  }

  // ==========================================
  // 1. TIC TAC TOE ENGINE
  // ==========================================
  private createInitialTicTacToeState(): TicTacToeState {
    return {
      board: Array(9).fill(null),
      turn: 'player',
      winner: null,
      winningLine: null,
      wins: { player: 0, tara: 0, draws: 0 },
    };
  }

  public playTicTacToe(pos: number) {
    const idx = pos - 1;
    const ttt = this.state.ticTacToe;

    if (this.state.currentTurn !== 'player' || ttt.board[idx] !== null || ttt.winner !== null) {
      voiceManager.speak("That position is already taken. Please choose an open square!", 'confused');
      return;
    }

    // Player move (X)
    ttt.board[idx] = 'X';
    this.state.gameStatusText = `YOU PLAYED CELL ${pos}`;

    // Check Player Win
    const winLine = this.checkTttWin(ttt.board, 'X');
    if (winLine) {
      ttt.winner = 'player';
      ttt.winningLine = winLine;
      ttt.wins.player++;
      this.state.playerScore += 50;
      this.state.resultBanner = 'YOU WON! MASTERFUL PLAY!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('amazed');
      armController.setGesture('CLAP');
      voiceManager.speak("Three in a row! You won! Excellent strategy!", 'excited');
      this.notify();
      return;
    }

    // Check Draw
    if (ttt.board.every((c) => c !== null)) {
      ttt.winner = 'draw';
      ttt.wins.draws++;
      this.state.resultBanner = "CAT'S GAME! IT'S A DRAW!";
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('curious');
      voiceManager.speak("A tie! We're evenly matched.", 'happy');
      this.notify();
      return;
    }

    // TARA's turn (O)
    this.state.currentTurn = 'tara';
    this.state.voiceState = 'GAME_TURN_TARA';
    this.state.gameStatusText = 'TARA IS THINKING...';
    animationCoordinator.setExpression('thinking');
    armController.setGesture('THINKING');
    this.notify();

    setTimeout(() => {
      if (this.state.activeGame !== 'TIC_TAC_TOE') return;
      this.executeTaraTicTacToeMove();
    }, 700);
  }

  private executeTaraTicTacToeMove() {
    const ttt = this.state.ticTacToe;
    const bestMove = this.calculateBestTttMove(ttt.board);

    if (bestMove !== -1) {
      ttt.board[bestMove] = 'O';
      this.state.gameStatusText = `TARA PLAYED CELL ${bestMove + 1}`;

      const winLine = this.checkTttWin(ttt.board, 'O');
      if (winLine) {
        ttt.winner = 'tara';
        ttt.winningLine = winLine;
        ttt.wins.tara++;
        this.state.taraScore += 50;
        this.state.resultBanner = 'TARA SCORES A VICTORY!';
        this.state.voiceState = 'GAME_RESULT';
        animationCoordinator.setExpression('celebrating');
        armController.setGesture('CELEBRATE');
        voiceManager.speak("Three in a row! TARA scores a victory! Haha!", 'excited');
      } else if (ttt.board.every((c) => c !== null)) {
        ttt.winner = 'draw';
        ttt.wins.draws++;
        this.state.resultBanner = "IT'S A DRAW!";
        this.state.voiceState = 'GAME_RESULT';
        animationCoordinator.setExpression('happy');
        voiceManager.speak("A cat's game draw! Well played.", 'happy');
      } else {
        this.state.currentTurn = 'player';
        this.state.voiceState = 'GAME_LISTENING';
        this.state.gameStatusText = 'YOUR TURN (SAY 1-9)';
        animationCoordinator.setExpression('playful');
        armController.setGesture('POINT_RIGHT');
      }
    }

    this.notify();
  }

  private checkTttWin(board: (string | null)[], mark: string): number[] | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6],             // Diagonals
    ];

    for (const line of lines) {
      if (line.every((idx) => board[idx] === mark)) {
        return line;
      }
    }
    return null;
  }

  private calculateBestTttMove(board: (string | null)[]): number {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];

    // 1. Win move
    for (const line of lines) {
      const oCount = line.filter((i) => board[i] === 'O').length;
      const nullIdx = line.find((i) => board[i] === null);
      if (oCount === 2 && nullIdx !== undefined) return nullIdx;
    }

    // 2. Block player win
    for (const line of lines) {
      const xCount = line.filter((i) => board[i] === 'X').length;
      const nullIdx = line.find((i) => board[i] === null);
      if (xCount === 2 && nullIdx !== undefined) return nullIdx;
    }

    // 3. Center
    if (board[4] === null) return 4;

    // 4. Corners
    const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // 5. Any open
    const open = board.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);
    return open.length > 0 ? open[Math.floor(Math.random() * open.length)] : -1;
  }

  // ==========================================
  // 2. ROCK PAPER SCISSORS ENGINE
  // ==========================================
  private createInitialRpsState(): RockPaperScissorsState {
    return {
      playerChoice: null,
      taraChoice: null,
      result: null,
      wins: { player: 0, tara: 0, ties: 0 },
    };
  }

  public playRockPaperScissors(choice: 'rock' | 'paper' | 'scissors') {
    const rps = this.state.rockPaperScissors;
    rps.playerChoice = choice;

    const moves: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
    const taraMove = moves[Math.floor(Math.random() * moves.length)];
    rps.taraChoice = taraMove;

    let result: 'win' | 'loss' | 'tie' = 'tie';
    if (choice === taraMove) {
      result = 'tie';
      rps.wins.ties++;
      this.state.resultBanner = "IT'S A TIE!";
      animationCoordinator.setExpression('curious');
      voiceManager.speak(`Tie! We both threw ${choice}!`, 'happy');
    } else if (
      (choice === 'rock' && taraMove === 'scissors') ||
      (choice === 'paper' && taraMove === 'rock') ||
      (choice === 'scissors' && taraMove === 'paper')
    ) {
      result = 'win';
      rps.wins.player++;
      this.state.playerScore += 30;
      this.state.resultBanner = 'YOU WIN THIS ROUND!';
      animationCoordinator.setExpression('amazed');
      armController.setGesture('CLAP');
      voiceManager.speak(`You win! ${choice} beats ${taraMove}! Well done!`, 'excited');
    } else {
      result = 'loss';
      rps.wins.tara++;
      this.state.taraScore += 30;
      this.state.resultBanner = 'TARA WINS THIS ROUND!';
      animationCoordinator.setExpression('playful');
      armController.setGesture('CELEBRATE');
      voiceManager.speak(`Point for me! ${taraMove} beats ${choice}!`, 'playful');
    }

    rps.result = result;
    this.state.voiceState = 'GAME_RESULT';
    this.notify();

    setTimeout(() => {
      if (this.state.activeGame === 'ROCK_PAPER_SCISSORS') {
        this.state.resultBanner = null;
        this.state.voiceState = 'GAME_LISTENING';
        this.state.gameStatusText = 'SAY ROCK, PAPER, OR SCISSORS';
        this.notify();
      }
    }, 2400);
  }

  // ==========================================
  // 3. GUESS THE NUMBER ENGINE
  // ==========================================
  private createInitialGuessNumberState(): GuessNumberState {
    return {
      target: Math.floor(Math.random() * 100) + 1,
      min: 1,
      max: 100,
      attempts: 0,
      lastGuess: null,
      hint: null,
      completed: false,
      history: [],
    };
  }

  public playGuessNumber(guess: number) {
    const gn = this.state.guessNumber;
    gn.attempts++;
    gn.lastGuess = guess;

    if (guess === gn.target) {
      gn.hint = 'correct';
      gn.completed = true;
      this.state.playerScore += Math.max(10, 100 - gn.attempts * 10);
      this.state.resultBanner = `CORRECT! TARGET WAS ${gn.target}!`;
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('celebrating');
      armController.setGesture('CELEBRATE');
      voiceManager.speak(`Bingo! The number was ${gn.target}! Solved in ${gn.attempts} guesses!`, 'excited');
    } else if (guess > gn.target) {
      gn.hint = 'too_high';
      gn.max = Math.min(gn.max, guess - 1);
      gn.history.push({ guess, hint: 'too_high' });
      this.state.gameStatusText = `${guess} IS TOO HIGH! GUESS LOWER`;
      this.state.voiceState = 'GAME_LISTENING';
      animationCoordinator.setExpression('curious');
      armController.setGesture('POINT_UP');
      voiceManager.speak(`${guess} is too high! Try lower!`, 'curious');
    } else {
      gn.hint = 'too_low';
      gn.min = Math.max(gn.min, guess + 1);
      gn.history.push({ guess, hint: 'too_low' });
      this.state.gameStatusText = `${guess} IS TOO LOW! GUESS HIGHER`;
      this.state.voiceState = 'GAME_LISTENING';
      animationCoordinator.setExpression('thinking');
      armController.setGesture('POINT_UP');
      voiceManager.speak(`${guess} is too low! Try higher!`, 'curious');
    }

    this.notify();
  }

  // ==========================================
  // 4. HIGHER OR LOWER ENGINE
  // ==========================================
  private createInitialHigherLowerState(): HigherLowerState {
    return {
      currentNumber: Math.floor(Math.random() * 90) + 5,
      nextNumber: null,
      prediction: null,
      result: null,
      streak: 0,
      bestStreak: 0,
      round: 1,
    };
  }

  public playHigherLower(prediction: 'higher' | 'lower') {
    const hl = this.state.higherLower;
    hl.prediction = prediction;

    let next = Math.floor(Math.random() * 98) + 1;
    if (next === hl.currentNumber) next = next < 50 ? next + 5 : next - 5;
    hl.nextNumber = next;

    const isHigher = next > hl.currentNumber;
    const isCorrect = (prediction === 'higher' && isHigher) || (prediction === 'lower' && !isHigher);

    if (isCorrect) {
      hl.result = 'correct';
      hl.streak++;
      hl.bestStreak = Math.max(hl.bestStreak, hl.streak);
      this.state.playerScore += 20 * hl.streak;
      this.state.gameStatusText = `CORRECT! ${next} IS ${isHigher ? 'HIGHER' : 'LOWER'}`;
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak(`Correct! ${next} is indeed ${isHigher ? 'higher' : 'lower'}! Streak: ${hl.streak}!`, 'excited');
    } else {
      hl.result = 'wrong';
      hl.streak = 0;
      this.state.gameStatusText = `WRONG! ${next} WAS ${isHigher ? 'HIGHER' : 'LOWER'}`;
      animationCoordinator.setExpression('surprised');
      voiceManager.speak(`Aww! The next number was ${next}. Streak reset!`, 'sad');
    }

    this.notify();

    setTimeout(() => {
      if (this.state.activeGame === 'HIGHER_LOWER') {
        hl.currentNumber = next;
        hl.nextNumber = null;
        hl.prediction = null;
        hl.result = null;
        hl.round++;
        this.state.gameStatusText = 'HIGHER OR LOWER?';
        this.state.voiceState = 'GAME_LISTENING';
        this.notify();
      }
    }, 2000);
  }

  // ==========================================
  // 5. MEMORY MATCH ENGINE (12 CARDS)
  // ==========================================
  private createInitialMemoryMatchState(): MemoryMatchState {
    const labels = ['Circle', 'Diamond', 'Triangle', 'Square', 'Plus', 'Heart'];
    const cards: DirectMemoryCard[] = [];

    // 6 pairs = 12 cards
    const pairs = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5].sort(() => Math.random() - 0.5);

    pairs.forEach((sym, i) => {
      cards.push({
        id: i + 1,
        symbolIndex: sym,
        label: labels[sym],
        isFlipped: false,
        isMatched: false,
      });
    });

    return {
      cards,
      firstCardId: null,
      secondCardId: null,
      moves: 0,
      matches: 0,
      isLocked: false,
      completed: false,
    };
  }

  public playMemoryMatch(cardId: number) {
    const mm = this.state.memoryMatch;
    if (mm.isLocked) return;

    const card = mm.cards.find((c) => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped) {
      voiceManager.speak("That card is already flipped or matched. Say another card number!", 'confused');
      return;
    }

    // Flip first card
    if (mm.firstCardId === null) {
      mm.firstCardId = cardId;
      card.isFlipped = true;
      this.state.gameStatusText = `FLIPPED CARD ${cardId}: ${card.label}. PICK SECOND!`;
      voiceManager.speak(`Card ${cardId} is a ${card.label}. Pick your second card!`, 'playful');
      this.notify();
      return;
    }

    // Flip second card
    mm.secondCardId = cardId;
    card.isFlipped = true;
    mm.moves++;
    mm.isLocked = true;

    const firstCard = mm.cards.find((c) => c.id === mm.firstCardId)!;
    const isMatch = firstCard.symbolIndex === card.symbolIndex;

    if (isMatch) {
      firstCard.isMatched = true;
      card.isMatched = true;
      mm.matches++;
      this.state.playerScore += 40;
      this.state.gameStatusText = `MATCH FOUND! ${card.label.toUpperCase()}!`;
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak(`Match found! Pair of ${card.label}s!`, 'excited');

      if (mm.matches >= 6) {
        mm.completed = true;
        this.state.resultBanner = 'ALL 6 PAIRS SOLVED!';
        this.state.voiceState = 'GAME_RESULT';
        voiceManager.speak(`Incredible! You cleared the entire memory grid in ${mm.moves} moves!`, 'excited');
      }

      mm.firstCardId = null;
      mm.secondCardId = null;
      mm.isLocked = false;
      this.notify();
    } else {
      this.state.gameStatusText = `NO MATCH (${firstCard.label} vs ${card.label})`;
      animationCoordinator.setExpression('curious');
      voiceManager.speak(`Not a match! Let's remember those positions.`, 'happy');

      setTimeout(() => {
        firstCard.isFlipped = false;
        card.isFlipped = false;
        mm.firstCardId = null;
        mm.secondCardId = null;
        mm.isLocked = false;
        this.state.gameStatusText = 'PICK YOUR NEXT CARD (1-12)';
        this.notify();
      }, 1800);
    }

    this.notify();
  }

  // ==========================================
  // 6. CONNECT FOUR ENGINE (7 COLS X 6 ROWS)
  // ==========================================
  private createInitialConnectFourState(): ConnectFourState {
    return {
      grid: Array(6).fill(null).map(() => Array(7).fill(null)),
      turn: 'player',
      winner: null,
      winningCells: null,
      wins: { player: 0, tara: 0, draws: 0 },
      lastCol: null,
    };
  }

  public playConnectFour(col: number) {
    const c4 = this.state.connectFour;
    const c = col - 1;

    if (c < 0 || c >= 7 || this.state.currentTurn !== 'player' || c4.winner !== null) return;

    // Drop in lowest available row
    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (c4.grid[r][c] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      voiceManager.speak("Column is completely full! Say another column number!", 'confused');
      return;
    }

    c4.grid[targetRow][c] = 'X';
    c4.lastCol = col;
    this.state.gameStatusText = `YOU DROPPED DISC IN COLUMN ${col}`;

    // Check Player Win
    if (this.checkConnectFourWin(c4.grid, 'X')) {
      c4.winner = 'player';
      c4.wins.player++;
      this.state.playerScore += 80;
      this.state.resultBanner = 'CONNECT 4! YOU WIN!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak("Four in a row! Masterful drop! You win Connect Four!", 'excited');
      this.notify();
      return;
    }

    // TARA's turn
    this.state.currentTurn = 'tara';
    this.state.voiceState = 'GAME_TURN_TARA';
    this.state.gameStatusText = 'TARA CALCULATING DROP...';
    animationCoordinator.setExpression('thinking');
    this.notify();

    setTimeout(() => {
      if (this.state.activeGame !== 'CONNECT_FOUR') return;
      this.executeTaraConnectFourMove();
    }, 700);
  }

  private executeTaraConnectFourMove() {
    const c4 = this.state.connectFour;

    // Pick valid column
    const validCols: number[] = [];
    for (let c = 0; c < 7; c++) {
      if (c4.grid[0][c] === null) validCols.push(c);
    }

    if (validCols.length === 0) {
      c4.winner = 'draw';
      this.state.resultBanner = 'FULL BOARD! DRAW!';
      this.state.voiceState = 'GAME_RESULT';
      this.notify();
      return;
    }

    // Basic AI: center preference or random
    const chosenCol = validCols.includes(3) && Math.random() < 0.6 ? 3 : validCols[Math.floor(Math.random() * validCols.length)];

    let targetRow = -1;
    for (let r = 5; r >= 0; r--) {
      if (c4.grid[r][chosenCol] === null) {
        targetRow = r;
        break;
      }
    }

    c4.grid[targetRow][chosenCol] = 'O';
    c4.lastCol = chosenCol + 1;
    this.state.gameStatusText = `TARA DROPPED IN COLUMN ${chosenCol + 1}`;

    if (this.checkConnectFourWin(c4.grid, 'O')) {
      c4.winner = 'tara';
      c4.wins.tara++;
      this.state.taraScore += 80;
      this.state.resultBanner = 'TARA CONNECTS FOUR!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak("Four in a row! TARA secures the victory!", 'playful');
    } else {
      this.state.currentTurn = 'player';
      this.state.voiceState = 'GAME_LISTENING';
      this.state.gameStatusText = 'YOUR TURN (SAY COLUMN 1-7)';
      animationCoordinator.setExpression('playful');
    }

    this.notify();
  }

  private checkConnectFourWin(grid: (string | null)[][], mark: string): boolean {
    // Horizontal
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c <= 3; c++) {
        if (grid[r][c] === mark && grid[r][c + 1] === mark && grid[r][c + 2] === mark && grid[r][c + 3] === mark) return true;
      }
    }
    // Vertical
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r <= 2; r++) {
        if (grid[r][c] === mark && grid[r + 1][c] === mark && grid[r + 2][c] === mark && grid[r + 3][c] === mark) return true;
      }
    }
    // Diagonal \
    for (let r = 0; r <= 2; r++) {
      for (let c = 0; c <= 3; c++) {
        if (grid[r][c] === mark && grid[r + 1][c + 1] === mark && grid[r + 2][c + 2] === mark && grid[r + 3][c + 3] === mark) return true;
      }
    }
    // Diagonal /
    for (let r = 3; r < 6; r++) {
      for (let c = 0; c <= 3; c++) {
        if (grid[r][c] === mark && grid[r - 1][c + 1] === mark && grid[r - 2][c + 2] === mark && grid[r - 3][c + 3] === mark) return true;
      }
    }
    return false;
  }

  // ==========================================
  // 7. PATTERN MEMORY ENGINE
  // ==========================================
  private createInitialPatternMemoryState(): PatternMemoryState {
    return {
      pattern: [1, 3, 5, 2],
      userInput: [],
      level: 1,
      phase: 'SHOWING',
      showingIndex: 0,
    };
  }

  private playPatternSequence() {
    const pm = this.state.patternMemory;
    pm.phase = 'SHOWING';
    pm.showingIndex = 0;
    pm.userInput = [];
    this.notify();

    let step = 0;
    const interval = setInterval(() => {
      if (this.state.activeGame !== 'PATTERN_MEMORY') {
        clearInterval(interval);
        return;
      }
      pm.showingIndex = step;
      this.notify();
      step++;

      if (step >= pm.pattern.length) {
        clearInterval(interval);
        setTimeout(() => {
          pm.phase = 'WAITING_USER';
          this.state.voiceState = 'GAME_LISTENING';
          this.state.gameStatusText = 'REPEAT THE PATTERN NOW!';
          voiceManager.speak(`Repeat the numbers in order!`, 'curious');
          this.notify();
        }, 1000);
      }
    }, 700);
  }

  public playPatternMemory(input: number[]) {
    const pm = this.state.patternMemory;
    pm.userInput = input;

    const isMatch =
      input.length === pm.pattern.length &&
      input.every((v, i) => v === pm.pattern[i]);

    if (isMatch) {
      pm.phase = 'SUCCESS';
      this.state.playerScore += 50 * pm.level;
      this.state.resultBanner = 'PATTERN MATCHED!';
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak("Spot on! Pattern perfectly remembered!", 'excited');

      setTimeout(() => {
        pm.level++;
        // Generate longer pattern
        const newPattern = Array.from({ length: 3 + pm.level }, () => Math.floor(Math.random() * 9) + 1);
        pm.pattern = newPattern;
        this.playPatternSequence();
      }, 2000);
    } else {
      pm.phase = 'FAIL';
      animationCoordinator.setExpression('confused');
      voiceManager.speak(`Aww, close! The pattern was ${pm.pattern.join(' ')}. Let's try again!`, 'sad');
      setTimeout(() => {
        this.playPatternSequence();
      }, 2000);
    }

    this.notify();
  }

  // ==========================================
  // 8. REACTION / QUICK TAP ENGINE
  // ==========================================
  private createInitialReactionGameState(): ReactionGameState {
    return {
      phase: 'WAITING',
      delayMs: 2000,
      startTime: 0,
      reactionMs: 0,
      bestReactionMs: 0,
      falseStarts: 0,
    };
  }

  private startReactionCountdown() {
    const rg = this.state.reactionGame;
    rg.phase = 'WAITING';
    this.state.voiceState = 'GAME_LISTENING';
    const delay = Math.floor(Math.random() * 2500) + 1800; // 1.8s - 4.3s

    if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
    this.reactionTimeout = setTimeout(() => {
      if (this.state.activeGame === 'REACTION' || this.state.activeGame === 'QUICK_REACTION') {
        rg.phase = 'SIGNAL_ACTIVE';
        rg.startTime = Date.now();
        this.state.gameStatusText = '★ SAY "GO" NOW! ★';
        this.notify();
      }
    }, delay);
  }

  public recordReaction() {
    const rg = this.state.reactionGame;

    if (rg.phase === 'WAITING') {
      // False start
      rg.phase = 'EARLY';
      rg.falseStarts++;
      animationCoordinator.setExpression('confused');
      voiceManager.speak("Too early! Wait for the signal!", 'playful');
      this.notify();

      setTimeout(() => {
        this.startReactionCountdown();
      }, 1500);
      return;
    }

    if (rg.phase === 'SIGNAL_ACTIVE') {
      const ms = Date.now() - rg.startTime;
      rg.reactionMs = ms;
      rg.bestReactionMs = rg.bestReactionMs === 0 ? ms : Math.min(rg.bestReactionMs, ms);
      rg.phase = 'RECORDED';

      this.state.playerScore += Math.max(10, 500 - Math.floor(ms / 2));
      this.state.resultBanner = `REACTION: ${ms} MS!`;
      this.state.voiceState = 'GAME_RESULT';

      if (ms < 300) {
        animationCoordinator.setExpression('amazed');
        voiceManager.speak(`Lightning reflexes! ${ms} milliseconds!`, 'excited');
      } else {
        animationCoordinator.setExpression('happy');
        voiceManager.speak(`Good timing! ${ms} milliseconds.`, 'happy');
      }

      this.notify();

      setTimeout(() => {
        if (this.state.activeGame === 'REACTION' || this.state.activeGame === 'QUICK_REACTION') {
          this.startReactionCountdown();
        }
      }, 2500);
    }
  }

  // ==========================================
  // 9. SIMON SAYS ENGINE
  // ==========================================
  private createInitialSimonSaysState(): SimonSaysState {
    return {
      command: '',
      hasSimonSaid: true,
      expectedAction: 'WAVE',
      round: 1,
      score: 0,
      status: 'SHOWING_COMMAND',
    };
  }

  private generateSimonCommand() {
    const ss = this.state.simonSays;
    const actions: { name: string; gesture: TaraArmGesture }[] = [
      { name: 'wave', gesture: 'WAVE' },
      { name: 'clap', gesture: 'CLAP' },
      { name: 'thumbs up', gesture: 'THUMBS_UP' },
      { name: 'raise hand', gesture: 'RAISE_HAND' },
    ];

    const pick = actions[Math.floor(Math.random() * actions.length)];
    const simonSaid = Math.random() < 0.7; // 70% chance Simon said
    ss.hasSimonSaid = simonSaid;
    ss.expectedAction = pick.name;
    ss.command = simonSaid ? `Simon says: ${pick.name}!` : `Just: ${pick.name}!`;

    armController.setGesture(pick.gesture);
    animationCoordinator.setExpression('playful');
    voiceManager.speak(ss.command, 'excited');

    ss.status = 'WAITING_INPUT';
    this.state.voiceState = 'GAME_LISTENING';
    this.state.gameStatusText = ss.command;
    this.notify();
  }

  public playSimonSays(action: string) {
    const ss = this.state.simonSays;
    const isMatchingAction = action.toLowerCase().includes(ss.expectedAction.toLowerCase());

    if (ss.hasSimonSaid) {
      if (isMatchingAction) {
        ss.score += 25;
        this.state.playerScore += 25;
        ss.round++;
        this.state.resultBanner = 'CORRECT!';
        animationCoordinator.setExpression('celebrating');
        voiceManager.speak("Correct! Simon said it, and you did it!", 'excited');
      } else {
        animationCoordinator.setExpression('confused');
        voiceManager.speak(`Oops! Simon said ${ss.expectedAction}, but you said ${action}!`, 'sad');
      }
    } else {
      // Trick command: Simon didn't say
      animationCoordinator.setExpression('playful');
      voiceManager.speak(`Haha! Caught you! Simon didn't say to ${ss.expectedAction}!`, 'playful');
    }

    this.notify();

    setTimeout(() => {
      if (this.state.activeGame === 'SIMON_SAYS') {
        this.generateSimonCommand();
      }
    }, 2200);
  }

  // ==========================================
  // 10. DICE DUEL ENGINE
  // ==========================================
  private createInitialDiceGameState(): DiceGameState {
    return {
      playerDice: [1, 1],
      taraDice: [1, 1],
      playerTotal: 2,
      taraTotal: 2,
      roundWinner: null,
      wins: { player: 0, tara: 0, ties: 0 },
      isRolling: false,
    };
  }

  public rollDice() {
    const dg = this.state.diceGame;
    dg.isRolling = true;
    this.state.gameStatusText = 'ROLLING THE DICE...';
    animationCoordinator.setExpression('excited');
    this.notify();

    setTimeout(() => {
      const p1 = Math.floor(Math.random() * 6) + 1;
      const p2 = Math.floor(Math.random() * 6) + 1;
      const t1 = Math.floor(Math.random() * 6) + 1;
      const t2 = Math.floor(Math.random() * 6) + 1;

      dg.playerDice = [p1, p2];
      dg.taraDice = [t1, t2];
      dg.playerTotal = p1 + p2;
      dg.taraTotal = t1 + t2;
      dg.isRolling = false;

      if (dg.playerTotal > dg.taraTotal) {
        dg.roundWinner = 'player';
        dg.wins.player++;
        this.state.playerScore += 30;
        this.state.resultBanner = `YOU WIN WITH ${dg.playerTotal}!`;
        animationCoordinator.setExpression('celebrating');
        voiceManager.speak(`You rolled ${dg.playerTotal}, I rolled ${dg.taraTotal}. You win!`, 'excited');
      } else if (dg.taraTotal > dg.playerTotal) {
        dg.roundWinner = 'tara';
        dg.wins.tara++;
        this.state.taraScore += 30;
        this.state.resultBanner = `TARA WINS WITH ${dg.taraTotal}!`;
        animationCoordinator.setExpression('playful');
        voiceManager.speak(`I rolled ${dg.taraTotal}, you rolled ${dg.playerTotal}. Point for me!`, 'playful');
      } else {
        dg.roundWinner = 'tie';
        dg.wins.ties++;
        this.state.resultBanner = `TIE AT ${dg.playerTotal}!`;
        animationCoordinator.setExpression('curious');
        voiceManager.speak(`Double tie! We both rolled ${dg.playerTotal}!`, 'happy');
      }

      this.state.voiceState = 'GAME_RESULT';
      this.notify();

      setTimeout(() => {
        if (this.state.activeGame === 'DICE_GAME') {
          this.state.resultBanner = null;
          this.state.voiceState = 'GAME_LISTENING';
          this.state.gameStatusText = 'SAY "ROLL" TO THROW AGAIN';
          this.notify();
        }
      }, 2500);
    }, 600);
  }

  // ==========================================
  // 11. QUICK REACTION INITIAL STATE
  // ==========================================
  private createInitialQuickReactionState(): QuickReactionState {
    return {
      targetWord: 'GO',
      promptTime: 0,
      reactionMs: 0,
      score: 0,
      stage: 'PREPARE',
    };
  }

  // ==========================================
  // AUTONOMOUS GAME INVITATION
  // ==========================================
  public startInvitation(game?: DirectGameType) {
    if (this.state.activeGame !== 'NONE' || this.state.invitationActive) return;

    const available: DirectGameType[] = [
      'TIC_TAC_TOE',
      'ROCK_PAPER_SCISSORS',
      'GUESS_NUMBER',
      'HIGHER_LOWER',
      'CONNECT_FOUR',
      'DICE_GAME',
    ];
    this.state.invitedGame = game || available[Math.floor(Math.random() * available.length)];
    this.state.invitationActive = true;
    this.state.invitationTimeoutSec = 10;

    animationCoordinator.setExpression('curious');
    voiceManager.speak(`I feel like playing a game! Want to play ${this.getGameDisplayName(this.state.invitedGame)}? Say yes or no!`, 'playful');
    this.notify();

    if (this.invitationInterval) clearInterval(this.invitationInterval);
    this.invitationInterval = setInterval(() => {
      this.state.invitationTimeoutSec--;
      if (this.state.invitationTimeoutSec <= 0) {
        this.dismissInvitation();
      }
      this.notify();
    }, 1000);
  }

  public acceptInvitation() {
    if (this.invitationInterval) clearInterval(this.invitationInterval);
    this.state.invitationActive = false;
    this.startGame(this.state.invitedGame);
  }

  public dismissInvitation() {
    if (this.invitationInterval) clearInterval(this.invitationInterval);
    this.state.invitationActive = false;
    animationCoordinator.setExpression('happy');
    voiceManager.speak("No problem! We can play later.", 'happy');
    this.notify();
  }

  private getGameDisplayName(game: DirectGameType): string {
    switch (game) {
      case 'TIC_TAC_TOE': return 'Tic-Tac-Toe';
      case 'ROCK_PAPER_SCISSORS': return 'Rock Paper Scissors';
      case 'GUESS_NUMBER': return 'Guess the Number';
      case 'HIGHER_LOWER': return 'Higher or Lower';
      case 'CONNECT_FOUR': return 'Connect Four';
      case 'DICE_GAME': return 'Dice Duel';
      case 'MEMORY_MATCH': return 'Memory Match';
      default: return 'a game';
    }
  }

  // ==========================================
  // DEVELOPER FORCE CONTROLS (SIMULATION MODE)
  // ==========================================
  public forceValidMove() {
    switch (this.state.activeGame) {
      case 'TIC_TAC_TOE': {
        const empty = this.state.ticTacToe.board.map((v, i) => (v === null ? i + 1 : null)).filter(Boolean) as number[];
        if (empty.length > 0) this.handleVoiceInput(String(empty[0]));
        break;
      }
      case 'ROCK_PAPER_SCISSORS':
        this.handleVoiceInput('rock');
        break;
      case 'GUESS_NUMBER':
        this.handleVoiceInput(String(this.state.guessNumber.target));
        break;
      case 'HIGHER_LOWER':
        this.handleVoiceInput('higher');
        break;
      case 'CONNECT_FOUR':
        this.handleVoiceInput('column 4');
        break;
      case 'DICE_GAME':
        this.handleVoiceInput('roll');
        break;
      case 'REACTION':
      case 'QUICK_REACTION':
        this.handleVoiceInput('GO');
        break;
      default:
        break;
    }
  }

  public forceInvalidMove() {
    this.handleVoiceInput('banana spaceship 999');
  }

  public forceWin() {
    if (this.state.activeGame === 'TIC_TAC_TOE') {
      const ttt = this.state.ticTacToe;
      ttt.board[0] = 'X';
      ttt.board[1] = 'X';
      ttt.board[2] = 'X';
      ttt.winner = 'player';
      ttt.winningLine = [0, 1, 2];
      ttt.wins.player++;
      this.state.playerScore += 50;
      this.state.resultBanner = 'FORCED WIN: YOU WON!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('celebrating');
      voiceManager.speak("Victory verified!", 'excited');
      this.notify();
    } else {
      this.state.playerScore += 50;
      this.state.resultBanner = 'FORCED WIN!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('celebrating');
      this.notify();
    }
  }

  public forceLoss() {
    if (this.state.activeGame === 'TIC_TAC_TOE') {
      const ttt = this.state.ticTacToe;
      ttt.board[0] = 'O';
      ttt.board[1] = 'O';
      ttt.board[2] = 'O';
      ttt.winner = 'tara';
      ttt.winningLine = [0, 1, 2];
      ttt.wins.tara++;
      this.state.taraScore += 50;
      this.state.resultBanner = 'FORCED LOSS: TARA WON!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('playful');
      voiceManager.speak("TARA takes the round!", 'playful');
      this.notify();
    } else {
      this.state.taraScore += 50;
      this.state.resultBanner = 'FORCED LOSS!';
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('playful');
      this.notify();
    }
  }

  public forceDraw() {
    if (this.state.activeGame === 'TIC_TAC_TOE') {
      const ttt = this.state.ticTacToe;
      ttt.board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
      ttt.winner = 'draw';
      ttt.winningLine = null;
      ttt.wins.draws++;
      this.state.resultBanner = "FORCED DRAW! CAT'S GAME!";
      this.state.voiceState = 'GAME_RESULT';
      animationCoordinator.setExpression('curious');
      voiceManager.speak("It's a draw!", 'happy');
      this.notify();
    }
  }
}

export const gameEngine = new GameEngine();
