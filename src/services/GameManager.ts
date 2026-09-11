import { GameType, GameDifficulty, RobotEmotion } from '../types';
import { expressionManager } from './ExpressionManager';
import { armController } from './ArmController';
import { activitySceneManager } from './ActivitySceneManager';

export interface TicTacToeState {
  board: (string | null)[]; // 9 cells: 'X' (player), 'O' (TARA), or null
  playerTurn: boolean;
  winner: 'PLAYER' | 'TARA' | 'DRAW' | null;
  difficulty: GameDifficulty;
  score: { player: number; tara: number; draws: number };
}

export interface RockPaperScissorsState {
  playerChoice: 'ROCK' | 'PAPER' | 'SCISSORS' | null;
  taraChoice: 'ROCK' | 'PAPER' | 'SCISSORS' | null;
  winner: 'PLAYER' | 'TARA' | 'DRAW' | null;
  score: { player: number; tara: number; draws: number };
}

export interface MemoryMatchCard {
  id: number;
  symbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryMatchState {
  cards: MemoryMatchCard[];
  flippedIndices: number[];
  matchesFound: number;
  attempts: number;
  isGameOver: boolean;
}

export interface GuessNumberState {
  target: number;
  attemptsLeft: number;
  maxAttempts: number;
  lastFeedback: 'TOO_HIGH' | 'TOO_LOW' | 'CORRECT' | 'GAME_OVER' | null;
  isGameOver: boolean;
  history: { guess: number; hint: string }[];
}

export interface ReactionGameState {
  status: 'WAITING' | 'READY' | 'CLICK_NOW' | 'FINISHED' | 'TOO_EARLY';
  reactionTimeMs: number | null;
  bestTimeMs: number | null;
}

export interface SimonSaysState {
  sequence: number[]; // 0=Red, 1=Blue, 2=Green, 3=Yellow
  playerIndex: number;
  level: number;
  isShowingSequence: boolean;
  activeLight: number | null;
  isGameOver: boolean;
  highScore: number;
}

export class GameManager {
  private activeGame: GameType = 'TIC_TAC_TOE';

  // Game States
  public ticTacToe: TicTacToeState = {
    board: Array(9).fill(null),
    playerTurn: true,
    winner: null,
    difficulty: 'NORMAL',
    score: { player: 0, tara: 0, draws: 0 },
  };

  public rps: RockPaperScissorsState = {
    playerChoice: null,
    taraChoice: null,
    winner: null,
    score: { player: 0, tara: 0, draws: 0 },
  };

  public memoryMatch: MemoryMatchState = this.initMemoryMatch();

  public guessNumber: GuessNumberState = {
    target: Math.floor(Math.random() * 50) + 1,
    attemptsLeft: 7,
    maxAttempts: 7,
    lastFeedback: null,
    isGameOver: false,
    history: [],
  };

  public reactionGame: ReactionGameState = {
    status: 'WAITING',
    reactionTimeMs: null,
    bestTimeMs: null,
  };

  public simonSays: SimonSaysState = {
    sequence: [],
    playerIndex: 0,
    level: 1,
    isShowingSequence: false,
    activeLight: null,
    isGameOver: false,
    highScore: 1,
  };

  private reactionStartTime: number = 0;
  private reactionTimeout: any = null;

  // Listeners for game state updates
  private listeners: (() => void)[] = [];

  constructor() {
    this.resetTicTacToe();
  }

  public getActiveGame(): GameType {
    return this.activeGame;
  }

  public setActiveGame(game: GameType) {
    this.activeGame = game;
    activitySceneManager.logEvent('GAME', `Launched game: ${game}`);
    expressionManager.pushTemporaryExpression('GAME_HAPPY', 2000);
    this.notify();
  }

  /* =========================================================================
   * 1. TIC TAC TOE
   * ========================================================================= */
  public resetTicTacToe() {
    this.ticTacToe.board = Array(9).fill(null);
    this.ticTacToe.playerTurn = true;
    this.ticTacToe.winner = null;
    this.notify();
  }

  public setTicTacToeDifficulty(diff: GameDifficulty) {
    this.ticTacToe.difficulty = diff;
    this.notify();
  }

  public playTicTacToeMove(index: number) {
    if (this.ticTacToe.board[index] || this.ticTacToe.winner || !this.ticTacToe.playerTurn) {
      return;
    }

    // Player move (X)
    this.ticTacToe.board[index] = 'X';
    this.ticTacToe.playerTurn = false;
    activitySceneManager.logEvent('GAME', `Player placed X at position ${index}`);

    const outcome = this.checkTicTacToeWinner(this.ticTacToe.board);
    if (outcome) {
      this.handleTicTacToeOutcome(outcome);
      return;
    }

    // TARA thinking reaction
    expressionManager.pushTemporaryExpression('GAME_THINKING', 1200);
    armController.triggerGesture('ARM_THINK');
    this.notify();

    // AI move with humanized delay
    setTimeout(() => {
      this.taraTicTacToeMove();
    }, 600 + Math.random() * 500);
  }

  private taraTicTacToeMove() {
    const available = this.ticTacToe.board
      .map((val, idx) => (val === null ? idx : null))
      .filter((idx) => idx !== null) as number[];

    if (available.length === 0) {
      this.handleTicTacToeOutcome('DRAW');
      return;
    }

    let move: number;

    if (this.ticTacToe.difficulty === 'EASY') {
      // Pure random
      move = available[Math.floor(Math.random() * available.length)];
    } else if (this.ticTacToe.difficulty === 'NORMAL') {
      // 50% smart, 50% random
      if (Math.random() < 0.5) {
        move = this.findBestTicTacToeMove(this.ticTacToe.board) ?? available[0];
      } else {
        move = available[Math.floor(Math.random() * available.length)];
      }
    } else {
      // HARD (Optimal minimax / blocker)
      move = this.findBestTicTacToeMove(this.ticTacToe.board) ?? available[0];
    }

    this.ticTacToe.board[move] = 'O';
    this.ticTacToe.playerTurn = true;
    activitySceneManager.logEvent('GAME', `TARA placed O at position ${move}`);

    const outcome = this.checkTicTacToeWinner(this.ticTacToe.board);
    if (outcome) {
      this.handleTicTacToeOutcome(outcome);
    } else {
      // Friendly taunt or curious look
      if (Math.random() < 0.3) {
        expressionManager.pushTemporaryExpression('GAME_TAUNT_PLAYFUL', 1500);
      }
      this.notify();
    }
  }

  private findBestTicTacToeMove(board: (string | null)[]): number | null {
    // 1. Can TARA win this move?
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        if (this.checkTicTacToeWinner(board) === 'TARA') {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // 2. Must TARA block player from winning?
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'X';
        if (this.checkTicTacToeWinner(board) === 'PLAYER') {
          board[i] = null;
          return i;
        }
        board[i] = null;
      }
    }
    // 3. Prefer center
    if (!board[4]) return 4;
    // 4. Prefer corners
    const corners = [0, 2, 6, 8].filter((c) => !board[c]);
    if (corners.length > 0) {
      return corners[Math.floor(Math.random() * corners.length)];
    }
    // 5. Fallback available
    const avail = board.map((v, i) => (v === null ? i : null)).filter((i) => i !== null) as number[];
    return avail[0] ?? null;
  }

  private checkTicTacToeWinner(b: (string | null)[]): 'PLAYER' | 'TARA' | 'DRAW' | null {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
      [0, 4, 8], [2, 4, 6],             // Diags
    ];
    for (const [a, bIdx, c] of lines) {
      if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
        return b[a] === 'X' ? 'PLAYER' : 'TARA';
      }
    }
    if (b.every((cell) => cell !== null)) {
      return 'DRAW';
    }
    return null;
  }

  private handleTicTacToeOutcome(outcome: 'PLAYER' | 'TARA' | 'DRAW') {
    this.ticTacToe.winner = outcome;
    if (outcome === 'TARA') {
      this.ticTacToe.score.tara++;
      expressionManager.pushTemporaryExpression('GAME_CELEBRATE', 3500);
      armController.triggerGesture('ARM_CELEBRATE');
      activitySceneManager.logEvent('GAME', 'TARA won the Tic-Tac-Toe match!');
    } else if (outcome === 'PLAYER') {
      this.ticTacToe.score.player++;
      expressionManager.pushTemporaryExpression('GAME_SAD', 3000);
      armController.triggerGesture('ARM_SAD_MOVE');
      activitySceneManager.logEvent('GAME', 'Player won the match! TARA is disappointed.');
    } else {
      this.ticTacToe.score.draws++;
      expressionManager.pushTemporaryExpression('GAME_CONFUSED', 2500);
      activitySceneManager.logEvent('GAME', 'Match ended in a DRAW.');
    }
    this.notify();
  }

  /* =========================================================================
   * 2. ROCK PAPER SCISSORS
   * ========================================================================= */
  public playRPS(choice: 'ROCK' | 'PAPER' | 'SCISSORS') {
    this.rps.playerChoice = choice;
    const choices: ('ROCK' | 'PAPER' | 'SCISSORS')[] = ['ROCK', 'PAPER', 'SCISSORS'];
    const tara = choices[Math.floor(Math.random() * 3)];
    this.rps.taraChoice = tara;

    if (choice === tara) {
      this.rps.winner = 'DRAW';
      this.rps.score.draws++;
      expressionManager.pushTemporaryExpression('GAME_CONFUSED', 2000);
    } else if (
      (choice === 'ROCK' && tara === 'SCISSORS') ||
      (choice === 'PAPER' && tara === 'ROCK') ||
      (choice === 'SCISSORS' && tara === 'PAPER')
    ) {
      this.rps.winner = 'PLAYER';
      this.rps.score.player++;
      expressionManager.pushTemporaryExpression('GAME_SURPRISED', 2500);
      armController.triggerGesture('ARM_SAD_MOVE');
    } else {
      this.rps.winner = 'TARA';
      this.rps.score.tara++;
      expressionManager.pushTemporaryExpression('GAME_CELEBRATE', 3000);
      armController.triggerGesture('ARM_CELEBRATE');
    }
    activitySceneManager.logEvent('GAME', `RPS: Player(${choice}) vs TARA(${tara}) -> Winner: ${this.rps.winner}`);
    this.notify();
  }

  /* =========================================================================
   * 3. MEMORY MATCH
   * ========================================================================= */
  private initMemoryMatch(): MemoryMatchState {
    const symbols = ['⭐', '🤖', '⚡', '❤️'];
    const deck = [...symbols, ...symbols]
      .sort(() => Math.random() - 0.5)
      .map((sym, idx) => ({
        id: idx,
        symbol: sym,
        isFlipped: false,
        isMatched: false,
      }));
    return {
      cards: deck,
      flippedIndices: [],
      matchesFound: 0,
      attempts: 0,
      isGameOver: false,
    };
  }

  public resetMemoryMatch() {
    this.memoryMatch = this.initMemoryMatch();
    this.notify();
  }

  public flipMemoryCard(index: number) {
    const card = this.memoryMatch.cards[index];
    if (!card || card.isFlipped || card.isMatched || this.memoryMatch.flippedIndices.length >= 2) {
      return;
    }

    card.isFlipped = true;
    this.memoryMatch.flippedIndices.push(index);

    if (this.memoryMatch.flippedIndices.length === 2) {
      this.memoryMatch.attempts++;
      const [idx1, idx2] = this.memoryMatch.flippedIndices;
      const card1 = this.memoryMatch.cards[idx1];
      const card2 = this.memoryMatch.cards[idx2];

      if (card1.symbol === card2.symbol) {
        // MATCH!
        card1.isMatched = true;
        card2.isMatched = true;
        this.memoryMatch.matchesFound++;
        this.memoryMatch.flippedIndices = [];
        expressionManager.pushTemporaryExpression('GAME_HAPPY', 2000);
        activitySceneManager.logEvent('GAME', `Memory Match: Found pair ${card1.symbol}!`);

        if (this.memoryMatch.matchesFound === 4) {
          this.memoryMatch.isGameOver = true;
          expressionManager.pushTemporaryExpression('GAME_CELEBRATE', 3500);
          armController.triggerGesture('ARM_CELEBRATE');
        }
      } else {
        // MISMATCH
        expressionManager.pushTemporaryExpression('GAME_THINKING', 1200);
        setTimeout(() => {
          card1.isFlipped = false;
          card2.isFlipped = false;
          this.memoryMatch.flippedIndices = [];
          this.notify();
        }, 1000);
      }
    }
    this.notify();
  }

  /* =========================================================================
   * 4. GUESS THE NUMBER (1-50)
   * ========================================================================= */
  public resetGuessNumber() {
    this.guessNumber = {
      target: Math.floor(Math.random() * 50) + 1,
      attemptsLeft: 7,
      maxAttempts: 7,
      lastFeedback: null,
      isGameOver: false,
      history: [],
    };
    this.notify();
  }

  public makeGuessNumber(guess: number) {
    if (this.guessNumber.isGameOver || guess < 1 || guess > 50) return;

    this.guessNumber.attemptsLeft--;

    if (guess === this.guessNumber.target) {
      this.guessNumber.lastFeedback = 'CORRECT';
      this.guessNumber.isGameOver = true;
      this.guessNumber.history.push({ guess, hint: 'Correct!' });
      expressionManager.pushTemporaryExpression('GAME_CELEBRATE', 3500);
      armController.triggerGesture('ARM_CELEBRATE');
      activitySceneManager.logEvent('GAME', `Guessed number ${guess} correctly!`);
    } else if (guess < this.guessNumber.target) {
      this.guessNumber.lastFeedback = 'TOO_LOW';
      this.guessNumber.history.push({ guess, hint: 'Higher!' });
      expressionManager.pushTemporaryExpression('CURIOUS', 1500);
    } else {
      this.guessNumber.lastFeedback = 'TOO_HIGH';
      this.guessNumber.history.push({ guess, hint: 'Lower!' });
      expressionManager.pushTemporaryExpression('CURIOUS', 1500);
    }

    if (this.guessNumber.attemptsLeft <= 0 && this.guessNumber.lastFeedback !== 'CORRECT') {
      this.guessNumber.isGameOver = true;
      this.guessNumber.lastFeedback = 'GAME_OVER';
      expressionManager.pushTemporaryExpression('GAME_SAD', 3000);
    }

    this.notify();
  }

  /* =========================================================================
   * 5. REACTION / TAP SPEED TEST
   * ========================================================================= */
  public startReactionTest() {
    if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
    this.reactionGame.status = 'READY';
    this.reactionGame.reactionTimeMs = null;
    expressionManager.pushTemporaryExpression('FOCUSED', 2000);
    this.notify();

    const delay = 1500 + Math.random() * 3000;
    this.reactionTimeout = setTimeout(() => {
      this.reactionGame.status = 'CLICK_NOW';
      this.reactionStartTime = performance.now();
      expressionManager.pushTemporaryExpression('SURPRISED', 1500);
      this.notify();
    }, delay);
  }

  public handleReactionClick() {
    if (this.reactionGame.status === 'READY') {
      // Clicked too early!
      if (this.reactionTimeout) clearTimeout(this.reactionTimeout);
      this.reactionGame.status = 'TOO_EARLY';
      expressionManager.pushTemporaryExpression('CONFUSED', 2000);
    } else if (this.reactionGame.status === 'CLICK_NOW') {
      const ms = Math.round(performance.now() - this.reactionStartTime);
      this.reactionGame.reactionTimeMs = ms;
      this.reactionGame.status = 'FINISHED';

      if (!this.reactionGame.bestTimeMs || ms < this.reactionGame.bestTimeMs) {
        this.reactionGame.bestTimeMs = ms;
      }

      if (ms < 280) {
        expressionManager.pushTemporaryExpression('GAME_CELEBRATE', 3000);
        armController.triggerGesture('ARM_THUMBS_UP');
      } else {
        expressionManager.pushTemporaryExpression('GAME_HAPPY', 2000);
      }
      activitySceneManager.logEvent('GAME', `Reaction Tap Time: ${ms} ms`);
    }
    this.notify();
  }

  /* =========================================================================
   * 6. SIMON SAYS
   * ========================================================================= */
  public startSimonSays() {
    this.simonSays.sequence = [Math.floor(Math.random() * 4)];
    this.simonSays.playerIndex = 0;
    this.simonSays.level = 1;
    this.simonSays.isGameOver = false;
    this.playSimonSequence();
  }

  private playSimonSequence() {
    this.simonSays.isShowingSequence = true;
    this.simonSays.playerIndex = 0;
    this.notify();

    let step = 0;
    const interval = setInterval(() => {
      if (step >= this.simonSays.sequence.length) {
        clearInterval(interval);
        this.simonSays.activeLight = null;
        this.simonSays.isShowingSequence = false;
        expressionManager.pushTemporaryExpression('CURIOUS', 1500);
        this.notify();
        return;
      }
      this.simonSays.activeLight = this.simonSays.sequence[step];
      this.notify();

      setTimeout(() => {
        this.simonSays.activeLight = null;
        this.notify();
      }, 350);

      step++;
    }, 650);
  }

  public pressSimonColor(colorIdx: number) {
    if (this.simonSays.isShowingSequence || this.simonSays.isGameOver) return;

    if (colorIdx === this.simonSays.sequence[this.simonSays.playerIndex]) {
      this.simonSays.playerIndex++;
      if (this.simonSays.playerIndex === this.simonSays.sequence.length) {
        // Level complete!
        this.simonSays.level++;
        if (this.simonSays.level > this.simonSays.highScore) {
          this.simonSays.highScore = this.simonSays.level;
        }
        expressionManager.pushTemporaryExpression('GAME_HAPPY', 1500);
        this.simonSays.sequence.push(Math.floor(Math.random() * 4));
        setTimeout(() => this.playSimonSequence(), 1000);
      }
    } else {
      // GAME OVER
      this.simonSays.isGameOver = true;
      expressionManager.pushTemporaryExpression('GAME_SAD', 2500);
      armController.triggerGesture('ARM_SAD_MOVE');
      activitySceneManager.logEvent('GAME', `Simon Says: Game Over at Level ${this.simonSays.level}`);
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    for (const cb of this.listeners) {
      cb();
    }
  }
}

export const gameManager = new GameManager();
