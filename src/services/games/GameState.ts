/**
 * GameState.ts
 * Type definitions and state interfaces for TARA's Direct-Display Game System.
 *
 * Engineered for standard ESP32 memory efficiency:
 * - Fixed-size arrays
 * - Deterministic memory structures
 * - Zero dynamic object leakages
 */

import { TaraArmGesture, TaraEmotion, TaraExpression } from '../../types';

export type GameVoiceState =
  | 'GAME_IDLE'
  | 'GAME_STARTING'
  | 'GAME_ASKING'
  | 'GAME_LISTENING'
  | 'GAME_PROCESSING'
  | 'GAME_INVALID_INPUT'
  | 'GAME_ACTION_ACCEPTED'
  | 'GAME_TURN_TARA'
  | 'GAME_TURN_PLAYER'
  | 'GAME_RESULT'
  | 'GAME_FINISHED';

export type DirectGameType =
  | 'NONE'
  | 'TIC_TAC_TOE'
  | 'ROCK_PAPER_SCISSORS'
  | 'GUESS_NUMBER'
  | 'HIGHER_LOWER'
  | 'MEMORY_MATCH'
  | 'CONNECT_FOUR'
  | 'PATTERN_MEMORY'
  | 'REACTION'
  | 'SIMON_SAYS'
  | 'DICE_GAME'
  | 'QUICK_REACTION';

export type GameTurn = 'player' | 'tara';

export type GameWinner = 'player' | 'tara' | 'draw' | null;

// ==========================================
// PARSED VOICE ACTIONS
// ==========================================
export type ParsedGameAction =
  | { type: 'PLACE_MARK'; position: number } // 1-9 for Tic-Tac-Toe
  | { type: 'RPS_CHOICE'; choice: 'rock' | 'paper' | 'scissors' }
  | { type: 'GUESS_NUMBER'; value: number }
  | { type: 'PREDICT_HIGH_LOW'; prediction: 'higher' | 'lower' }
  | { type: 'SELECT_CARD'; cardIndex: number } // 1-12 for Memory Match
  | { type: 'DROP_COLUMN'; column: number } // 1-7 for Connect Four
  | { type: 'REPEAT_PATTERN'; sequence: number[] }
  | { type: 'REACTION_TRIGGER' }
  | { type: 'SIMON_ACTION'; action: string }
  | { type: 'ROLL_DICE' }
  | { type: 'CONFIRM_YES' }
  | { type: 'CONFIRM_NO' }
  | { type: 'RESTART_GAME' }
  | { type: 'EXIT_GAME' }
  | { type: 'UNKNOWN'; raw: string };

export interface ParseResult {
  valid: boolean;
  action: ParsedGameAction;
  rawInput: string;
  language: 'en' | 'bn' | 'banglish';
  confidence: number;
  reason?: string;
  guidance?: string;
}

// ==========================================
// INDIVIDUAL GAME STATE MODELS
// ==========================================

export interface TicTacToeState {
  board: (string | null)[]; // length 9
  turn: GameTurn;
  winner: GameWinner;
  winningLine: number[] | null;
  wins: { player: number; tara: number; draws: number };
}

export interface RockPaperScissorsState {
  playerChoice: 'rock' | 'paper' | 'scissors' | null;
  taraChoice: 'rock' | 'paper' | 'scissors' | null;
  result: 'win' | 'loss' | 'tie' | null;
  wins: { player: number; tara: number; ties: number };
}

export interface GuessNumberState {
  target: number;
  min: number;
  max: number;
  attempts: number;
  lastGuess: number | null;
  hint: 'too_high' | 'too_low' | 'correct' | null;
  completed: boolean;
  history: { guess: number; hint: 'too_high' | 'too_low' | 'correct' }[];
}

export interface HigherLowerState {
  currentNumber: number;
  nextNumber: number | null;
  prediction: 'higher' | 'lower' | null;
  result: 'correct' | 'wrong' | null;
  streak: number;
  bestStreak: number;
  round: number;
}

export interface DirectMemoryCard {
  id: number;
  symbolIndex: number; // 0 to 5 for 6 pairs = 12 cards
  label: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryMatchState {
  cards: DirectMemoryCard[];
  firstCardId: number | null;
  secondCardId: number | null;
  moves: number;
  matches: number;
  isLocked: boolean;
  completed: boolean;
}

export interface ConnectFourState {
  grid: (string | null)[][]; // 6 rows x 7 columns
  turn: GameTurn;
  winner: GameWinner;
  winningCells: [number, number][] | null;
  wins: { player: number; tara: number; draws: number };
  lastCol: number | null;
}

export interface PatternMemoryState {
  pattern: number[];
  userInput: number[];
  level: number;
  phase: 'SHOWING' | 'WAITING_USER' | 'SUCCESS' | 'FAIL';
  showingIndex: number;
}

export interface ReactionGameState {
  phase: 'WAITING' | 'READY' | 'SIGNAL_ACTIVE' | 'RECORDED' | 'EARLY';
  delayMs: number;
  startTime: number;
  reactionMs: number;
  bestReactionMs: number;
  falseStarts: number;
}

export interface SimonSaysState {
  command: string;
  hasSimonSaid: boolean;
  expectedAction: string;
  round: number;
  score: number;
  status: 'SHOWING_COMMAND' | 'WAITING_INPUT' | 'ROUND_CLEAR' | 'GAME_OVER';
}

export interface DiceGameState {
  playerDice: [number, number];
  taraDice: [number, number];
  playerTotal: number;
  taraTotal: number;
  roundWinner: 'player' | 'tara' | 'tie' | null;
  wins: { player: number; tara: number; ties: number };
  isRolling: boolean;
}

export interface QuickReactionState {
  targetWord: string;
  promptTime: number;
  reactionMs: number;
  score: number;
  stage: 'PREPARE' | 'SIGNAL' | 'RECORDED';
}

// ==========================================
// UNIFIED MASTER GAME STATE
// ==========================================
export interface DirectGameMasterState {
  activeGame: DirectGameType;
  voiceState: GameVoiceState;
  currentTurn: GameTurn;
  playerScore: number;
  taraScore: number;
  gameStatusText: string;
  expectedInputPrompt: string;
  recognizedSpeech: string;
  parsedActionSummary: string;
  lastErrorGuidance: string | null;
  consecutiveErrors: number;
  resultBanner: string | null;

  // Sub-game specific state
  ticTacToe: TicTacToeState;
  rockPaperScissors: RockPaperScissorsState;
  guessNumber: GuessNumberState;
  higherLower: HigherLowerState;
  memoryMatch: MemoryMatchState;
  connectFour: ConnectFourState;
  patternMemory: PatternMemoryState;
  reactionGame: ReactionGameState;
  simonSays: SimonSaysState;
  diceGame: DiceGameState;
  quickReaction: QuickReactionState;

  // Autonomous game invitation
  invitationActive: boolean;
  invitedGame: DirectGameType;
  invitationTimeoutSec: number;
}
