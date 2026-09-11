/**
 * GameDeck.tsx
 * Comprehensive Interactive Companion Games Deck for TARA.
 *
 * Games:
 * 1. Tic-Tac-Toe (vs TARA AI with live expressive reactions)
 * 2. Rock Paper Scissors (animated 5-finger hand moves: rock fist, paper 5-fingers, scissors)
 * 3. Memory Match (12 cards with geometric shapes, clean vector icons)
 * 4. Guess the Number (1-100 hints with pointing gestures)
 * 5. Speed Reflex Challenge (millisecond timing)
 * 6. Simon Says (gesture memory sequence)
 * 7. Companion Trivia (ESP32 architecture quiz)
 */

import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Zap,
  HelpCircle,
  Grid3X3,
  HandMetal,
  Brain,
  Hash,
  Activity,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { gameManager, MemoryCard } from '../services/GameManager';
import { TaraArmGesture } from '../types';
import { DirectDisplayGameController } from './DirectDisplayGameController';

export const GameDeck: React.FC = () => {
  const [activeGame, setActiveGame] = useState(gameManager.getActiveGame());
  const [score, setScore] = useState(gameManager.getScore());

  // Game-specific local subscriptions
  const [tttBoard, setTttBoard] = useState(gameManager.getTttBoard());
  const [tttTurn, setTttTurn] = useState(gameManager.getTttTurn());
  const [tttWinner, setTttWinner] = useState(gameManager.getTttWinner());
  const [tttWins, setTttWins] = useState(gameManager.getTttWins());

  const [rpsState, setRpsState] = useState(gameManager.getRpsState());

  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(gameManager.getMemoryCards());
  const [memoryStats, setMemoryStats] = useState(gameManager.getMemoryStats());

  const [guessState, setGuessState] = useState(gameManager.getGuessState());
  const [guessInput, setGuessInput] = useState<string>('');

  const [reflexWaiting, setReflexWaiting] = useState(gameManager.isReflexWaiting());
  const [lastReaction, setLastReaction] = useState(gameManager.getLastReactionMs());

  const [simonState, setSimonState] = useState(gameManager.getSimonState());

  useEffect(() => {
    const unsub = gameManager.subscribe(() => {
      setActiveGame(gameManager.getActiveGame());
      setScore(gameManager.getScore());
      setTttBoard(gameManager.getTttBoard());
      setTttTurn(gameManager.getTttTurn());
      setTttWinner(gameManager.getTttWinner());
      setTttWins(gameManager.getTttWins());
      setRpsState(gameManager.getRpsState());
      setMemoryCards([...gameManager.getMemoryCards()]);
      setMemoryStats(gameManager.getMemoryStats());
      setGuessState(gameManager.getGuessState());
      setReflexWaiting(gameManager.isReflexWaiting());
      setLastReaction(gameManager.getLastReactionMs());
      setSimonState(gameManager.getSimonState());
    });
    return () => unsub();
  }, []);

  const trivia = gameManager.getTriviaQuestion();

  // Helper for Memory Card geometric icons (NO stickers / emojis)
  const renderGeometricShape = (shape: MemoryCard['shape']) => {
    switch (shape) {
      case 'star':
        return (
          <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 15,8.5 22,9.3 17,14 18.5,21 12,17.5 5.5,21 7,14 2,9.3 9,8.5" />
          </svg>
        );
      case 'diamond':
        return (
          <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,2 22,12 12,22 2,12" />
          </svg>
        );
      case 'circle':
        return (
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="9" />
          </svg>
        );
      case 'triangle':
        return (
          <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12,3 22,21 2,21" />
          </svg>
        );
      case 'square':
        return (
          <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* DIRECT-DISPLAY OLED GAME SYSTEM */}
      <DirectDisplayGameController />

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-4">
        {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Interactive Companion Games
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                6 Real-Time Games
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Play with TARA — features animated 5-finger hands, live facial reactions, and voice cheering!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-mono text-amber-300">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Score: <strong>{score}</strong> pts</span>
          </div>

          {activeGame !== 'NONE' && (
            <button
              onClick={() => gameManager.closeGame()}
              className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
            >
              Exit Game
            </button>
          )}
        </div>
      </div>

      {/* Game Selector Menu */}
      {activeGame === 'NONE' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* 1. Tic Tac Toe */}
          <div
            onClick={() => gameManager.startTicTacToe()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <Grid3X3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Tic-Tac-Toe
            </div>
            <p className="text-xs text-slate-400">
              Classic 3x3 match vs TARA AI. TARA analyzes moves, reacts, and celebrates victories!
            </p>
          </div>

          {/* 2. Rock Paper Scissors */}
          <div
            onClick={() => gameManager.startRockPaperScissors()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <HandMetal className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Rock Paper Scissors
            </div>
            <p className="text-xs text-slate-400">
              Play with TARA's animated 5-finger hands (fist, 5-finger palm, scissors V-shape).
            </p>
          </div>

          {/* 3. Memory Match */}
          <div
            onClick={() => gameManager.startMemoryMatch()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Memory Match
            </div>
            <p className="text-xs text-slate-400">
              Flip 12 cards to find 6 pairs of geometric symbols. TARA claps on matches!
            </p>
          </div>

          {/* 4. Guess the Number */}
          <div
            onClick={() => gameManager.startGuessNumber()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Hash className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Guess the Number (1-100)
            </div>
            <p className="text-xs text-slate-400">
              TARA thinks of a number and gives clues with voice and pointing gestures.
            </p>
          </div>

          {/* 5. Speed Reflex Challenge */}
          <div
            onClick={() => gameManager.startReflex()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-rose-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Speed Reflex Challenge
            </div>
            <p className="text-xs text-slate-400">
              Wait for TARA to blink with surprise, then tap immediately to measure reaction time.
            </p>
          </div>

          {/* 6. Simon Says */}
          <div
            onClick={() => gameManager.startSimonSays()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
              <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Simon Says (Gesture Memory)
            </div>
            <p className="text-xs text-slate-400">
              Watch TARA's arm gestures carefully, then repeat them in sequence!
            </p>
          </div>

          {/* 7. Trivia */}
          <div
            onClick={() => gameManager.startTrivia()}
            className="p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-teal-500/40 cursor-pointer transition-all flex flex-col gap-2 group"
          >
            <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
              <HelpCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              TARA Hardware Trivia
            </div>
            <p className="text-xs text-slate-400">
              Test your knowledge of ESP32-S3, OLED SSD1306, and visual display kinematics.
            </p>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 1. TIC-TAC-TOE ACTIVE                      */}
      {/* ========================================== */}
      {activeGame === 'TIC_TAC_TOE' && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-4 text-xs">
          <div className="flex justify-between w-full max-w-xs items-center font-mono">
            <span className="font-bold text-cyan-400">TIC-TAC-TOE</span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-emerald-400">You: {tttWins.player}</span>
              <span className="text-purple-400">TARA: {tttWins.tara}</span>
              <span>Ties: {tttWins.draws}</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-medium">
            {tttWinner === 'player' && <span className="text-emerald-400 font-bold">You Won! TARA is clapping!</span>}
            {tttWinner === 'tara' && <span className="text-purple-400 font-bold">TARA Won! Celebrating victory!</span>}
            {tttWinner === 'draw' && <span className="text-amber-400 font-bold">Draw Game! Evenly matched!</span>}
            {!tttWinner && tttTurn === 'player' && <span className="text-cyan-300">Your Turn (X) — Select a square</span>}
            {!tttWinner && tttTurn === 'tara' && <span className="text-purple-300 animate-pulse">TARA is thinking...</span>}
          </div>

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-900 border border-slate-800 w-64 h-64">
            {tttBoard.map((cell, idx) => (
              <button
                key={idx}
                onClick={() => gameManager.playTicTacToeMove(idx)}
                disabled={cell !== null || tttTurn !== 'player' || tttWinner !== null}
                className={`flex items-center justify-center rounded-xl text-2xl font-bold font-mono transition-all ${
                  cell === 'X'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : cell === 'O'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-600 border border-slate-700/60'
                }`}
              >
                {cell}
              </button>
            ))}
          </div>

          {tttWinner && (
            <button
              onClick={() => gameManager.resetTicTacToe()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold font-mono text-xs shadow-lg shadow-cyan-950/40"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Play Again
            </button>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 2. ROCK PAPER SCISSORS ACTIVE              */}
      {/* ========================================== */}
      {activeGame === 'ROCK_PAPER_SCISSORS' && (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-5 text-xs">
          <div className="flex justify-between w-full max-w-sm items-center font-mono">
            <span className="font-bold text-purple-400">ROCK PAPER SCISSORS</span>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="text-emerald-400">You: {rpsState.score.player}</span>
              <span className="text-purple-400">TARA: {rpsState.score.tara}</span>
              <span>Ties: {rpsState.score.ties}</span>
            </div>
          </div>

          {/* Showdown Display */}
          <div className="flex items-center justify-center gap-8 py-3">
            <div className="flex flex-col items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">YOUR MOVE</span>
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold font-mono text-cyan-300 capitalize">
                {rpsState.playerMove || '?'}
              </div>
            </div>

            <div className="text-sm font-bold font-mono text-slate-500">VS</div>

            <div className="flex flex-col items-center gap-2">
              <span className="text-slate-400 font-mono text-[11px]">TARA'S HAND</span>
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold font-mono text-purple-300 capitalize">
                {rpsState.busy ? '...' : rpsState.taraMove || '?'}
              </div>
            </div>
          </div>

          {/* Outcome announcement */}
          {rpsState.result && (
            <div
              className={`text-sm font-bold font-mono px-4 py-1.5 rounded-full ${
                rpsState.result === 'win'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : rpsState.result === 'loss'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {rpsState.result === 'win' && 'YOU WIN THIS ROUND!'}
              {rpsState.result === 'loss' && 'TARA WINS THIS ROUND!'}
              {rpsState.result === 'tie' && "IT'S A TIE!"}
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
            <button
              onClick={() => gameManager.playRockPaperScissors('rock')}
              disabled={rpsState.busy}
              className="p-3 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold font-mono border border-slate-700 transition-all flex flex-col items-center gap-1"
            >
              <span>✊</span>
              <span>ROCK</span>
            </button>
            <button
              onClick={() => gameManager.playRockPaperScissors('paper')}
              disabled={rpsState.busy}
              className="p-3 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold font-mono border border-slate-700 transition-all flex flex-col items-center gap-1"
            >
              <span>✋</span>
              <span>PAPER</span>
            </button>
            <button
              onClick={() => gameManager.playRockPaperScissors('scissors')}
              disabled={rpsState.busy}
              className="p-3 rounded-xl bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white font-bold font-mono border border-slate-700 transition-all flex flex-col items-center gap-1"
            >
              <span>✌️</span>
              <span>SCISSORS</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 3. MEMORY MATCH ACTIVE                     */}
      {/* ========================================== */}
      {activeGame === 'MEMORY_MATCH' && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-4 text-xs">
          <div className="flex justify-between w-full max-w-md items-center font-mono">
            <span className="font-bold text-emerald-400">MEMORY MATCH (NO STICKERS)</span>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Moves: {memoryStats.moves}</span>
              <span className="text-emerald-400">Pairs: {memoryStats.matches} / 6</span>
            </div>
          </div>

          {memoryStats.completed ? (
            <div className="p-6 text-center space-y-3">
              <div className="text-emerald-400 text-lg font-bold">Board Cleared!</div>
              <p className="text-slate-300">TARA is applauding your memory prowess!</p>
              <button
                onClick={() => gameManager.startMemoryMatch()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs"
              >
                Play Another Round
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-w-md w-full">
              {memoryCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => gameManager.flipMemoryCard(card.id)}
                  disabled={card.flipped || card.matched}
                  className={`h-20 rounded-xl flex items-center justify-center border transition-all ${
                    card.matched
                      ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70'
                      : card.flipped
                      ? 'bg-slate-800 border-cyan-500/60 shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 cursor-pointer'
                  }`}
                >
                  {card.flipped || card.matched ? (
                    renderGeometricShape(card.shape)
                  ) : (
                    <span className="font-mono text-slate-600 text-xs">?</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 4. GUESS THE NUMBER ACTIVE                 */}
      {/* ========================================== */}
      {activeGame === 'GUESS_NUMBER' && (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-4 text-xs">
          <div className="flex justify-between w-full max-w-sm items-center font-mono">
            <span className="font-bold text-amber-400">GUESS THE NUMBER</span>
            <span className="text-slate-400">Attempts: {guessState.attempts}</span>
          </div>

          <p className="text-slate-300 text-center max-w-sm">
            I'm thinking of a number from 1 to 100. Enter your guess below!
          </p>

          {!guessState.completed ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(guessInput, 10);
                if (!isNaN(n)) {
                  gameManager.submitGuess(n);
                  setGuessInput('');
                }
              }}
              className="flex items-center gap-2 w-full max-w-xs"
            >
              <input
                type="number"
                min="1"
                max="100"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="1 - 100"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono text-base focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs transition-colors"
              >
                Guess
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-amber-400 text-base font-bold">Solved! Excellent Intuition!</div>
              <button
                onClick={() => gameManager.startGuessNumber()}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs"
              >
                New Secret Number
              </button>
            </div>
          )}

          {/* History */}
          {guessState.history.length > 0 && (
            <div className="w-full max-w-xs space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-mono text-slate-500">Guess History:</span>
              <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                {guessState.history.map((h, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono"
                  >
                    <span className="text-slate-200">Guess: {h.guess}</span>
                    <span
                      className={`font-bold ${
                        h.hint === 'correct'
                          ? 'text-emerald-400'
                          : h.hint === 'higher'
                          ? 'text-cyan-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {h.hint === 'correct' ? 'CORRECT!' : h.hint === 'higher' ? 'HIGHER ↑' : 'LOWER ↓'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 5. REFLEX CHALLENGE ACTIVE                 */}
      {/* ========================================== */}
      {activeGame === 'REACTION' && (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-4 text-center">
          <div className="text-xs font-mono text-slate-400">
            {reflexWaiting ? 'TAP NOW! TARA IS BLINKING WITH SURPRISE!' : 'Wait for TARA to blink...'}
          </div>

          <button
            onClick={() => gameManager.tapReflex()}
            className={`w-40 h-40 rounded-full font-bold text-lg font-mono transition-all transform active:scale-95 shadow-xl ${
              reflexWaiting
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 cursor-pointer ring-4 ring-rose-300'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {reflexWaiting ? 'TAP ME!' : 'WAIT...'}
          </button>

          {lastReaction > 0 && (
            <div className="text-xs font-mono text-rose-300 space-y-1">
              <div>
                Reaction Time: <strong className="text-white text-sm">{lastReaction} ms</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                {lastReaction < 200 ? '⚡ Ultra-Human Reflexes!' : lastReaction < 300 ? '🏎️ Rapid Response!' : '👍 Good Timing!'}
              </div>
              <button
                onClick={() => gameManager.startReflex()}
                className="mt-2 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================== */}
      {/* 6. SIMON SAYS ACTIVE                       */}
      {/* ========================================== */}
      {activeGame === 'SIMON_SAYS' && (
        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center gap-4 text-xs">
          <div className="flex justify-between w-full max-w-sm items-center font-mono">
            <span className="font-bold text-blue-400">SIMON SAYS</span>
            <span className="text-slate-400">Round: {simonState.round}</span>
          </div>

          <div className="text-xs text-slate-300 text-center font-medium">
            {simonState.isPlayingSequence ? (
              <span className="text-cyan-300 animate-pulse font-mono">
                Watch TARA's screen arms demonstrate the sequence...
              </span>
            ) : (
              <span className="text-emerald-400 font-mono">
                Your Turn! Step {simonState.playerStep + 1} of {simonState.sequenceLength}
              </span>
            )}
          </div>

          {/* Gesture buttons */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm">
            {simonState.availableGestures.map((g) => (
              <button
                key={g}
                onClick={() => gameManager.submitSimonMove(g)}
                disabled={simonState.isPlayingSequence}
                className="p-3 rounded-xl bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-slate-200 hover:text-white font-mono text-[11px] font-bold border border-slate-700 transition-all text-center"
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 7. TRIVIA ACTIVE                           */}
      {/* ========================================== */}
      {activeGame === 'TRIVIA' && (
        <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
          <div className="flex justify-between items-center">
            <span className="font-bold text-teal-400">TARA HARDWARE TRIVIA</span>
            <span className="font-mono text-slate-400">Score: {score} pts</span>
          </div>

          <div className="text-sm font-semibold text-white">{trivia.question}</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {trivia.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => gameManager.answerTrivia(idx)}
                className="p-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-teal-500/50 text-left font-medium transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
