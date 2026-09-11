/**
 * GameManager.ts
 * Complete Interactive Companion Games Engine for TARA.
 *
 * Supported Games:
 * 1. Tic-Tac-Toe (Interactive 3x3 board vs TARA AI with reaction gestures & facial expressions)
 * 2. Rock Paper Scissors (Animated hand display gestures: fist/rock, open/paper, scissors)
 * 3. Memory Match (12-card matching with procedural geometric shapes, zero stickers)
 * 4. Guess the Number (1-100 hints with pointing gestures higher/lower)
 * 5. Reaction Game (Reflex test measuring milliseconds)
 * 6. Simon Says (Memory sequence of TARA's arm gestures)
 * 7. Companion Trivia (ESP32 and system architecture trivia)
 *
 * All games integrate:
 * - Facial expressions (focused, thinking, celebrating, laughing, surprised)
 * - Display arm gestures (THINKING, CELEBRATE, CLAP, POINT_UP, POINT_LEFT, etc.)
 * - Synchronized voice commentary and mouth animations
 * - Zero stickers or emoji graphics (pure procedural vector and clean UI)
 */

import { TaraArmGesture, TaraEmotion, TaraExpression, TaraGameType } from '../types';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { voiceManager } from './VoiceManager';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What processor powers TARA's physical desktop firmware?",
    options: ["ESP32-S3 Dual Core", "Raspberry Pi Pico", "Arduino Uno R3", "STM32F4"],
    correctIndex: 0,
    explanation: "TARA is engineered specifically for the ESP32-S3 dual-core microcontroller with Wi-Fi & BLE!",
  },
  {
    question: "What resolution does TARA's OLED face display simulate?",
    options: ["128 x 64 pixels", "320 x 240 pixels", "64 x 32 pixels", "800 x 480 pixels"],
    correctIndex: 0,
    explanation: "Standard SSD1306/SH1106 OLED displays are 128x64 monochrome pixels.",
  },
  {
    question: "How are TARA's expressive arms animated?",
    options: ["Display animations inside the screen", "Servo motors on GPIO pins", "Stepper motors", "Hydraulics"],
    correctIndex: 0,
    explanation: "TARA uses pure visual display animation without physical motor wear or servo vibration!",
  },
  {
    question: "How many fingers do TARA's cartoon hands have?",
    options: ["Five clearly visible fingers", "Three mittens", "Four fingers", "Two claws"],
    correctIndex: 0,
    explanation: "TARA's animated hands feature five clearly visible rounded fingers: thumb, index, middle, ring, pinky!",
  },
];

export interface MemoryCard {
  id: number;
  shape: 'star' | 'diamond' | 'circle' | 'triangle' | 'square' | 'heart';
  flipped: boolean;
  matched: boolean;
}

export class GameManager {
  private activeGame: TaraGameType = 'NONE';
  private score: number = 0;
  private listeners: (() => void)[] = [];

  // ==================== TRIVIA ====================
  private currentQuestionIdx: number = 0;

  // ==================== REFLEX ====================
  private reflexWaiting: boolean = false;
  private reflexStartTime: number = 0;
  private lastReactionMs: number = 0;

  // ==================== TIC TAC TOE ====================
  private tttBoard: (string | null)[] = Array(9).fill(null);
  private tttTurn: 'player' | 'tara' = 'player';
  private tttWinner: 'player' | 'tara' | 'draw' | null = null;
  private tttWins: { player: number; tara: number; draws: number } = { player: 0, tara: 0, draws: 0 };

  // ==================== ROCK PAPER SCISSORS ====================
  private rpsPlayerMove: 'rock' | 'paper' | 'scissors' | null = null;
  private rpsTaraMove: 'rock' | 'paper' | 'scissors' | null = null;
  private rpsResult: 'win' | 'loss' | 'tie' | null = null;
  private rpsScore: { player: number; tara: number; ties: number } = { player: 0, tara: 0, ties: 0 };
  private rpsBusy: boolean = false;

  // ==================== MEMORY MATCH ====================
  private memoryCards: MemoryCard[] = [];
  private flippedCardIds: number[] = [];
  private memoryMoves: number = 0;
  private memoryMatches: number = 0;
  private memoryCompleted: boolean = false;

  // ==================== GUESS THE NUMBER ====================
  private guessTarget: number = 50;
  private guessAttempts: number = 0;
  private guessHistory: { guess: number; hint: 'higher' | 'lower' | 'correct' }[] = [];
  private guessCompleted: boolean = false;

  // ==================== SIMON SAYS ====================
  private simonSequence: TaraArmGesture[] = [];
  private simonPlayerStep: number = 0;
  private simonRound: number = 1;
  private simonPlayingSequence: boolean = false;
  private simonAvailableGestures: TaraArmGesture[] = [
    'WAVE',
    'POINT_LEFT',
    'POINT_RIGHT',
    'POINT_UP',
    'THUMBS_UP',
    'CLAP',
  ];

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getActiveGame(): TaraGameType {
    return this.activeGame;
  }

  public getScore(): number {
    return this.score;
  }

  public closeGame() {
    this.activeGame = 'NONE';
    animationCoordinator.setExpression('happy');
    armController.setGesture('IDLE');
    this.notify();
  }

  // ==========================================
  // 1. TIC TAC TOE
  // ==========================================
  public startTicTacToe() {
    this.activeGame = 'TIC_TAC_TOE';
    this.resetTicTacToe();
    animationCoordinator.setExpression('playful');
    armController.setGesture('GREETING');
    voiceManager.speak("Tic-Tac-Toe! You are X and I am O. Your move first!", 'playful');
    this.notify();
  }

  public resetTicTacToe() {
    this.tttBoard = Array(9).fill(null);
    this.tttTurn = 'player';
    this.tttWinner = null;
    this.notify();
  }

  public getTttBoard() {
    return this.tttBoard;
  }

  public getTttTurn() {
    return this.tttTurn;
  }

  public getTttWinner() {
    return this.tttWinner;
  }

  public getTttWins() {
    return this.tttWins;
  }

  public playTicTacToeMove(index: number) {
    if (this.activeGame !== 'TIC_TAC_TOE' || this.tttWinner || this.tttBoard[index] !== null || this.tttTurn !== 'player') {
      return;
    }

    // Player move (X)
    const newBoard = [...this.tttBoard];
    newBoard[index] = 'X';
    this.tttBoard = newBoard;

    // Check if player won
    if (this.checkTttWinner(newBoard, 'X')) {
      this.tttWinner = 'player';
      this.tttWins.player++;
      this.score += 50;
      animationCoordinator.setExpression('amazed');
      armController.setGesture('CLAP');
      voiceManager.speak("You got three in a row! Masterful play!", 'excited');
      this.notify();
      return;
    }

    // Check draw
    if (newBoard.every((cell) => cell !== null)) {
      this.tttWinner = 'draw';
      this.tttWins.draws++;
      animationCoordinator.setExpression('curious');
      armController.setGesture('THINKING');
      voiceManager.speak("It's a cat's game draw! Well played.", 'happy');
      this.notify();
      return;
    }

    // TARA's turn (O)
    this.tttTurn = 'tara';
    animationCoordinator.setExpression('thinking');
    armController.setGesture('THINKING');
    this.notify();

    setTimeout(() => {
      if (this.activeGame !== 'TIC_TAC_TOE') return;
      this.makeTaraTttMove();
    }, 600);
  }

  private makeTaraTttMove() {
    const board = [...this.tttBoard];
    const bestMove = this.calculateBestTttMove(board);

    if (bestMove !== -1) {
      board[bestMove] = 'O';
      this.tttBoard = board;

      if (this.checkTttWinner(board, 'O')) {
        this.tttWinner = 'tara';
        this.tttWins.tara++;
        animationCoordinator.setExpression('celebrating');
        armController.setGesture('CELEBRATE');
        voiceManager.speak("Haha, three in a row! TARA scores a victory!", 'excited');
      } else if (board.every((cell) => cell !== null)) {
        this.tttWinner = 'draw';
        this.tttWins.draws++;
        animationCoordinator.setExpression('happy');
        armController.setGesture('GREETING');
        voiceManager.speak("A tie! Evenly matched minds.", 'happy');
      } else {
        this.tttTurn = 'player';
        animationCoordinator.setExpression('playful');
        armController.setGesture('POINT_RIGHT');
      }
    }

    this.notify();
  }

  private checkTttWinner(board: (string | null)[], player: string): boolean {
    const winLines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    return winLines.some(([a, b, c]) => board[a] === player && board[b] === player && board[c] === player);
  }

  private calculateBestTttMove(board: (string | null)[]): number {
    // 1. Can TARA win this move?
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'O';
        if (this.checkTttWinner(board, 'O')) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // 2. Must TARA block Player?
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = 'X';
        if (this.checkTttWinner(board, 'X')) {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // 3. Take center if available
    if (board[4] === null) return 4;
    // 4. Take available corners
    const corners = [0, 2, 6, 8].filter((idx) => board[idx] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
    // 5. Take any empty cell
    const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
    return empty.length > 0 ? empty[Math.floor(Math.random() * empty.length)] : -1;
  }

  // ==========================================
  // 2. ROCK PAPER SCISSORS
  // ==========================================
  public startRockPaperScissors() {
    this.activeGame = 'ROCK_PAPER_SCISSORS';
    this.rpsPlayerMove = null;
    this.rpsTaraMove = null;
    this.rpsResult = null;
    this.rpsBusy = false;
    animationCoordinator.setExpression('excited');
    armController.setGesture('OPEN_HAND');
    voiceManager.speak("Rock, Paper, Scissors! Choose your move, and I'll show mine!", 'excited');
    this.notify();
  }

  public getRpsState() {
    return {
      playerMove: this.rpsPlayerMove,
      taraMove: this.rpsTaraMove,
      result: this.rpsResult,
      score: this.rpsScore,
      busy: this.rpsBusy,
    };
  }

  public playRockPaperScissors(playerMove: 'rock' | 'paper' | 'scissors') {
    if (this.activeGame !== 'ROCK_PAPER_SCISSORS' || this.rpsBusy) return;

    this.rpsBusy = true;
    this.rpsPlayerMove = playerMove;
    this.rpsTaraMove = null;
    this.rpsResult = null;

    // Countdown with voice and fist pump gesture
    animationCoordinator.setExpression('focused');
    armController.setGesture('CLOSE_HAND');
    voiceManager.speak("Rock... Paper... Scissors... Shoot!", 'curious');
    this.notify();

    setTimeout(() => {
      if (this.activeGame !== 'ROCK_PAPER_SCISSORS') return;

      const moves: ('rock' | 'paper' | 'scissors')[] = ['rock', 'paper', 'scissors'];
      const taraMove = moves[Math.floor(Math.random() * moves.length)];
      this.rpsTaraMove = taraMove;

      // Show TARA's hand gesture corresponding to move
      if (taraMove === 'rock') {
        armController.setGesture('CLOSE_HAND'); // Fist
      } else if (taraMove === 'paper') {
        armController.setGesture('OPEN_HAND'); // Open 5 fingers
      } else {
        armController.setGesture('POINT_UP'); // Scissors
      }

      // Determine outcome
      if (playerMove === taraMove) {
        this.rpsResult = 'tie';
        this.rpsScore.ties++;
        animationCoordinator.setExpression('teasing');
        voiceManager.speak(`We both chose ${playerMove}! Great minds think alike. It's a tie!`, 'playful');
      } else if (
        (playerMove === 'rock' && taraMove === 'scissors') ||
        (playerMove === 'paper' && taraMove === 'rock') ||
        (playerMove === 'scissors' && taraMove === 'paper')
      ) {
        this.rpsResult = 'win';
        this.rpsScore.player++;
        this.score += 30;
        animationCoordinator.setExpression('amazed');
        voiceManager.speak(`Your ${playerMove} beats my ${taraMove}! You win this round!`, 'happy');
      } else {
        this.rpsResult = 'loss';
        this.rpsScore.tara++;
        animationCoordinator.setExpression('celebrating');
        voiceManager.speak(`My ${taraMove} beats your ${playerMove}! Point for TARA!`, 'excited');
      }

      this.rpsBusy = false;
      this.notify();
    }, 1200);
  }

  // ==========================================
  // 3. MEMORY MATCH
  // ==========================================
  public startMemoryMatch() {
    this.activeGame = 'MEMORY_MATCH';
    this.initMemoryDeck();
    animationCoordinator.setExpression('curious');
    armController.setGesture('POINT_UP');
    voiceManager.speak("Memory Match! Find all six matching pairs of geometric symbols!", 'curious');
    this.notify();
  }

  public getMemoryCards() {
    return this.memoryCards;
  }

  public getMemoryStats() {
    return {
      moves: this.memoryMoves,
      matches: this.memoryMatches,
      completed: this.memoryCompleted,
    };
  }

  private initMemoryDeck() {
    const shapes: MemoryCard['shape'][] = ['star', 'diamond', 'circle', 'triangle', 'square', 'heart'];
    const deck: MemoryCard[] = [];
    let id = 0;

    shapes.forEach((s) => {
      deck.push({ id: id++, shape: s, flipped: false, matched: false });
      deck.push({ id: id++, shape: s, flipped: false, matched: false });
    });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.memoryCards = deck;
    this.flippedCardIds = [];
    this.memoryMoves = 0;
    this.memoryMatches = 0;
    this.memoryCompleted = false;
  }

  public flipMemoryCard(cardId: number) {
    if (this.activeGame !== 'MEMORY_MATCH' || this.flippedCardIds.length >= 2) return;

    const card = this.memoryCards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;

    card.flipped = true;
    this.flippedCardIds.push(cardId);
    this.notify();

    if (this.flippedCardIds.length === 2) {
      this.memoryMoves++;
      const [idA, idB] = this.flippedCardIds;
      const cardA = this.memoryCards.find((c) => c.id === idA)!;
      const cardB = this.memoryCards.find((c) => c.id === idB)!;

      if (cardA.shape === cardB.shape) {
        // Matched!
        cardA.matched = true;
        cardB.matched = true;
        this.memoryMatches++;
        this.flippedCardIds = [];
        this.score += 40;

        if (this.memoryMatches === 6) {
          this.memoryCompleted = true;
          animationCoordinator.setExpression('celebrating');
          armController.setGesture('CELEBRATE');
          voiceManager.speak(`Splendid! All six pairs matched in ${this.memoryMoves} moves!`, 'excited');
        } else {
          animationCoordinator.setExpression('excited');
          armController.setGesture('CLAP');
          voiceManager.speak(`Match found! Clean pair of ${cardA.shape}s!`, 'happy');
        }
        this.notify();
      } else {
        // Mismatch
        animationCoordinator.setExpression('thinking');
        setTimeout(() => {
          cardA.flipped = false;
          cardB.flipped = false;
          this.flippedCardIds = [];
          this.notify();
        }, 900);
      }
    }
  }

  // ==========================================
  // 4. GUESS THE NUMBER
  // ==========================================
  public startGuessNumber() {
    this.activeGame = 'GUESS_NUMBER';
    this.guessTarget = Math.floor(Math.random() * 100) + 1;
    this.guessAttempts = 0;
    this.guessHistory = [];
    this.guessCompleted = false;
    animationCoordinator.setExpression('curious');
    armController.setGesture('THINKING');
    voiceManager.speak("I'm thinking of a secret number between 1 and 100. Take your best guess!", 'curious');
    this.notify();
  }

  public getGuessState() {
    return {
      attempts: this.guessAttempts,
      history: this.guessHistory,
      completed: this.guessCompleted,
    };
  }

  public submitGuess(val: number) {
    if (this.activeGame !== 'GUESS_NUMBER' || this.guessCompleted || isNaN(val) || val < 1 || val > 100) {
      return;
    }

    this.guessAttempts++;
    let hint: 'higher' | 'lower' | 'correct';

    if (val === this.guessTarget) {
      hint = 'correct';
      this.guessCompleted = true;
      this.score += Math.max(10, 100 - this.guessAttempts * 10);
      animationCoordinator.setExpression('celebrating');
      armController.setGesture('CELEBRATE');
      voiceManager.speak(`Bingo! The secret number was ${this.guessTarget}! You solved it in ${this.guessAttempts} guesses!`, 'excited');
    } else if (val < this.guessTarget) {
      hint = 'higher';
      animationCoordinator.setExpression('focused');
      armController.setGesture('POINT_UP');
      voiceManager.speak(`Higher than ${val}! Aim upward!`, 'playful');
    } else {
      hint = 'lower';
      animationCoordinator.setExpression('teasing');
      armController.setGesture('POINT_LEFT');
      voiceManager.speak(`Lower than ${val}! Bring it down!`, 'playful');
    }

    this.guessHistory.unshift({ guess: val, hint });
    this.notify();
  }

  // ==========================================
  // 5. REACTION SPEED GAME
  // ==========================================
  public startReflex() {
    this.activeGame = 'REACTION';
    this.reflexWaiting = false;
    animationCoordinator.setExpression('focused');
    armController.setGesture('PLAYING');
    voiceManager.speak("Speed Reflex Challenge! Wait for me to flash with surprise, then tap immediately!", 'curious');

    const delay = 2000 + Math.random() * 3000;
    setTimeout(() => {
      if (this.activeGame === 'REACTION') {
        this.reflexWaiting = true;
        this.reflexStartTime = performance.now();
        animationCoordinator.setExpression('surprised');
        armController.setGesture('POINT_UP');
        this.notify();
      }
    }, delay);

    this.notify();
  }

  public isReflexWaiting(): boolean {
    return this.reflexWaiting;
  }

  public getLastReactionMs(): number {
    return this.lastReactionMs;
  }

  public tapReflex(): number {
    if (!this.reflexWaiting) {
      voiceManager.speak("Too early! You jumped the gun!", 'playful');
      this.activeGame = 'NONE';
      this.notify();
      return -1;
    }

    this.lastReactionMs = Math.round(performance.now() - this.reflexStartTime);
    this.reflexWaiting = false;
    this.score += Math.max(10, Math.round(1000 - this.lastReactionMs));
    animationCoordinator.setExpression('amazed');
    armController.setGesture('CLAP');
    voiceManager.speak(`Lightning fast! Your reaction time was ${this.lastReactionMs} milliseconds!`, 'excited');
    this.notify();
    return this.lastReactionMs;
  }

  // ==========================================
  // 6. SIMON SAYS
  // ==========================================
  public startSimonSays() {
    this.activeGame = 'SIMON_SAYS';
    this.simonRound = 1;
    this.simonSequence = [];
    this.simonPlayerStep = 0;
    this.simonPlayingSequence = false;
    animationCoordinator.setExpression('playful');
    armController.setGesture('GREETING');
    voiceManager.speak("Simon Says! Watch my arm gestures closely, then repeat them in order!", 'excited');
    this.nextSimonRound();
  }

  public getSimonState() {
    return {
      round: this.simonRound,
      sequenceLength: this.simonSequence.length,
      playerStep: this.simonPlayerStep,
      isPlayingSequence: this.simonPlayingSequence,
      availableGestures: this.simonAvailableGestures,
    };
  }

  private nextSimonRound() {
    // Add one gesture to sequence
    const nextGesture = this.simonAvailableGestures[Math.floor(Math.random() * this.simonAvailableGestures.length)];
    this.simonSequence.push(nextGesture);
    this.simonPlayerStep = 0;
    this.simonPlayingSequence = true;
    this.notify();

    // Play through sequence
    let step = 0;
    const playNext = () => {
      if (this.activeGame !== 'SIMON_SAYS') return;

      if (step < this.simonSequence.length) {
        const g = this.simonSequence[step];
        armController.setGesture(g);
        animationCoordinator.setExpression('focused');
        step++;
        setTimeout(playNext, 900);
      } else {
        armController.setGesture('IDLE');
        animationCoordinator.setExpression('playful');
        this.simonPlayingSequence = false;
        voiceManager.speak("Your turn! Repeat the pattern!", 'curious');
        this.notify();
      }
    };

    setTimeout(playNext, 800);
  }

  public submitSimonMove(gesture: TaraArmGesture) {
    if (this.activeGame !== 'SIMON_SAYS' || this.simonPlayingSequence) return;

    // Show gesture immediately on display
    armController.setGesture(gesture);

    if (gesture === this.simonSequence[this.simonPlayerStep]) {
      this.simonPlayerStep++;

      if (this.simonPlayerStep >= this.simonSequence.length) {
        // Round completed!
        this.score += 25 * this.simonRound;
        this.simonRound++;
        animationCoordinator.setExpression('celebrating');
        voiceManager.speak(`Correct! Round ${this.simonRound - 1} clear! Next sequence coming up!`, 'excited');
        this.notify();

        setTimeout(() => {
          if (this.activeGame === 'SIMON_SAYS') {
            this.nextSimonRound();
          }
        }, 1200);
      } else {
        this.notify();
      }
    } else {
      // Mistake
      animationCoordinator.setExpression('confused');
      armController.setGesture('THINKING');
      voiceManager.speak(`Oops! That wasn't the right gesture. You reached Round ${this.simonRound}! Good effort!`, 'sad');
      this.activeGame = 'NONE';
      this.notify();
    }
  }

  // ==========================================
  // 7. TRIVIA
  // ==========================================
  public startTrivia() {
    this.activeGame = 'TRIVIA';
    this.currentQuestionIdx = 0;
    animationCoordinator.setExpression('excited');
    armController.setGesture('RAISE_HAND');
    voiceManager.speak("Let's play Companion Trivia! Question number one...", 'excited');
    this.notify();
  }

  public getTriviaQuestion(): TriviaQuestion {
    return TRIVIA_QUESTIONS[this.currentQuestionIdx % TRIVIA_QUESTIONS.length];
  }

  public answerTrivia(optionIdx: number): boolean {
    const q = this.getTriviaQuestion();
    const correct = optionIdx === q.correctIndex;

    if (correct) {
      this.score += 100;
      animationCoordinator.setExpression('celebrating');
      armController.setGesture('CELEBRATE');
      voiceManager.speak(`Bingo! Correct! ${q.explanation}`, 'excited');
    } else {
      animationCoordinator.setExpression('confused');
      armController.setGesture('THINKING');
      voiceManager.speak(`Aww, close! The answer was ${q.options[q.correctIndex]}.`, 'sad');
    }

    setTimeout(() => {
      this.currentQuestionIdx++;
      if (this.currentQuestionIdx >= TRIVIA_QUESTIONS.length) {
        voiceManager.speak(`Game over! You scored ${this.score} points! High five!`, 'excited');
        this.activeGame = 'NONE';
        armController.setGesture('THUMBS_UP');
      }
      this.notify();
    }, 3000);

    this.notify();
    return correct;
  }
}

export const gameManager = new GameManager();
