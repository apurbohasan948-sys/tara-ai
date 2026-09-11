import React, { useEffect, useState } from 'react';
import { gameManager } from '../services/GameManager';
import { GameType, GameDifficulty } from '../types';
import { Trophy, RefreshCw, Zap, Sparkles, Brain, HelpCircle, Gamepad2 } from 'lucide-react';

export const TabGames: React.FC = () => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = gameManager.subscribe(() => setTick((t) => t + 1));
    return unsub;
  }, []);

  const activeGame = gameManager.getActiveGame();

  const selectGame = (g: GameType) => {
    gameManager.setActiveGame(g);
  };

  const ttt = gameManager.ticTacToe;
  const rps = gameManager.rps;
  const mm = gameManager.memoryMatch;
  const gn = gameManager.guessNumber;
  const rg = gameManager.reactionGame;
  const ss = gameManager.simonSays;

  const [guessInput, setGuessInput] = useState('');

  return (
    <div className="space-y-6">
      {/* Header & Game Selector Chips */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-cyan-400" />
              TARA Interactive Companion Games
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Modular lightweight games executed locally on ESP32. TARA reacts expressively to your moves and outcomes!
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300">
              Active Game: {activeGame}
            </span>
          </div>
        </div>

        {/* Game Tabs Selection */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-800">
          {[
            { id: 'TIC_TAC_TOE', label: 'Tic-Tac-Toe', icon: Trophy },
            { id: 'ROCK_PAPER_SCISSORS', label: 'Rock Paper Scissors', icon: Sparkles },
            { id: 'MEMORY_MATCH', label: 'Memory Match', icon: Brain },
            { id: 'GUESS_NUMBER', label: 'Guess the Number', icon: HelpCircle },
            { id: 'REACTION_TAP', label: 'Reaction Tap', icon: Zap },
            { id: 'SIMON_SAYS', label: 'Simon Says', icon: Gamepad2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeGame === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => selectGame(tab.id as GameType)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isSel
                    ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. TIC TAC TOE */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'TIC_TAC_TOE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Tic-Tac-Toe vs TARA</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Player is <span className="text-cyan-400 font-bold">X</span> | TARA is <span className="text-amber-400 font-bold">O</span>
              </p>
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Difficulty:</span>
              {(['EASY', 'NORMAL', 'HARD'] as GameDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => gameManager.setTicTacToeDifficulty(d)}
                  className={`px-2.5 py-1 text-xs rounded border font-mono transition ${
                    ttt.difficulty === d
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => gameManager.resetTicTacToe()}
                className="flex items-center gap-1 ml-2 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restart
              </button>
            </div>
          </div>

          {/* Score Counter */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center font-mono">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">You (X)</div>
              <div className="text-xl font-bold text-cyan-400">{ttt.score.player}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">Draws</div>
              <div className="text-xl font-bold text-slate-400">{ttt.score.draws}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60">
              <div className="text-[10px] text-slate-400 uppercase">TARA (O)</div>
              <div className="text-xl font-bold text-amber-400">{ttt.score.tara}</div>
            </div>
          </div>

          {/* Board */}
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-3 gap-2.5 bg-slate-950 p-3 rounded-xl border border-slate-800 shadow-inner">
              {ttt.board.map((cell, idx) => (
                <button
                  key={idx}
                  onClick={() => gameManager.playTicTacToeMove(idx)}
                  disabled={!!cell || !!ttt.winner || !ttt.playerTurn}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-lg flex items-center justify-center text-3xl sm:text-4xl font-mono font-bold transition ${
                    cell === 'X'
                      ? 'bg-cyan-950/70 border border-cyan-700 text-cyan-400 shadow-sm'
                      : cell === 'O'
                      ? 'bg-amber-950/70 border border-amber-700 text-amber-400 shadow-sm'
                      : ttt.winner || !ttt.playerTurn
                      ? 'bg-slate-900/50 border border-slate-800/60 cursor-not-allowed'
                      : 'bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 cursor-pointer active:scale-95'
                  }`}
                >
                  {cell}
                </button>
              ))}
            </div>

            {/* Game Status Banner */}
            <div className="mt-4 text-center">
              {ttt.winner ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 font-semibold text-sm">
                  {ttt.winner === 'PLAYER' && <span className="text-emerald-400">🎉 Congratulations! You Won!</span>}
                  {ttt.winner === 'TARA' && <span className="text-amber-400">🤖 TARA Won this match!</span>}
                  {ttt.winner === 'DRAW' && <span className="text-slate-300">🤝 It's a Draw!</span>}
                  <button
                    onClick={() => gameManager.resetTicTacToe()}
                    className="ml-2 text-xs text-cyan-400 underline hover:text-cyan-300"
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-mono">
                  {ttt.playerTurn ? (
                    <span className="text-cyan-400">Your turn (Place X)</span>
                  ) : (
                    <span className="text-amber-400 animate-pulse">TARA is thinking...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. ROCK PAPER SCISSORS */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'ROCK_PAPER_SCISSORS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Rock, Paper, Scissors</h3>
              <p className="text-xs text-slate-400 mt-0.5">Quick reflex duel against TARA</p>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-cyan-400">You: {rps.score.player}</span>
              <span className="text-slate-400">Draws: {rps.score.draws}</span>
              <span className="text-amber-400">TARA: {rps.score.tara}</span>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-2 font-mono">YOUR CHOICE</div>
                <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl shadow-inner">
                  {rps.playerChoice === 'ROCK' && '✊'}
                  {rps.playerChoice === 'PAPER' && '✋'}
                  {rps.playerChoice === 'SCISSORS' && '✌️'}
                  {!rps.playerChoice && '❓'}
                </div>
              </div>

              <div className="text-slate-500 font-bold text-xl">VS</div>

              <div className="text-center">
                <div className="text-xs text-slate-400 mb-2 font-mono">TARA'S CHOICE</div>
                <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-4xl shadow-inner">
                  {rps.taraChoice === 'ROCK' && '✊'}
                  {rps.taraChoice === 'PAPER' && '✋'}
                  {rps.taraChoice === 'SCISSORS' && '✌️'}
                  {!rps.taraChoice && '🤖'}
                </div>
              </div>
            </div>

            {/* Outcome Announcement */}
            {rps.winner && (
              <div className="text-sm font-bold font-mono">
                {rps.winner === 'PLAYER' && <span className="text-emerald-400">You win this round! 🏆</span>}
                {rps.winner === 'TARA' && <span className="text-amber-400">TARA wins this round! 🤖</span>}
                {rps.winner === 'DRAW' && <span className="text-slate-400">Draw! Try again.</span>}
              </div>
            )}

            {/* Choice Buttons */}
            <div className="flex gap-4">
              {[
                { id: 'ROCK', label: 'Rock', icon: '✊' },
                { id: 'PAPER', label: 'Paper', icon: '✋' },
                { id: 'SCISSORS', label: 'Scissors', icon: '✌️' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => gameManager.playRPS(c.id as any)}
                  className="flex flex-col items-center gap-1 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition active:scale-95"
                >
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-xs font-semibold text-slate-200">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. MEMORY MATCH */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'MEMORY_MATCH' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Memory Card Match</h3>
              <p className="text-xs text-slate-400 mt-0.5">Find all 4 matching pairs</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-300">
                Matches: <strong className="text-cyan-400">{mm.matchesFound}/4</strong>
              </span>
              <span className="text-xs font-mono text-slate-400">Attempts: {mm.attempts}</span>
              <button
                onClick={() => gameManager.resetMemoryMatch()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
            {mm.cards.map((card, idx) => (
              <button
                key={card.id}
                onClick={() => gameManager.flipMemoryCard(idx)}
                disabled={card.isFlipped || card.isMatched}
                className={`h-24 rounded-xl flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
                  card.isFlipped || card.isMatched
                    ? 'bg-cyan-950/80 border-2 border-cyan-500 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-800 border-2 border-slate-700 hover:border-slate-600 active:scale-95'
                }`}
              >
                {card.isFlipped || card.isMatched ? card.symbol : '❓'}
              </button>
            ))}
          </div>

          {mm.isGameOver && (
            <div className="text-center p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 text-sm font-semibold">
              🎉 Congratulations! You found all pairs in {mm.attempts} attempts!
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. GUESS THE NUMBER */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'GUESS_NUMBER' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Guess the Number (1 to 50)</h3>
              <p className="text-xs text-slate-400 mt-0.5">TARA picked a secret number. Can you deduce it?</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-amber-400">
                Attempts Left: <strong>{gn.attemptsLeft}</strong>
              </span>
              <button
                onClick={() => gameManager.resetGuessNumber()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                New Secret
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const n = parseInt(guessInput, 10);
                if (!isNaN(n)) {
                  gameManager.makeGuessNumber(n);
                  setGuessInput('');
                }
              }}
              className="flex gap-2 w-full"
            >
              <input
                type="number"
                min="1"
                max="50"
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Enter 1-50..."
                disabled={gn.isGameOver}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={gn.isGameOver || !guessInput}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                Guess
              </button>
            </form>

            {/* Feedback Banner */}
            {gn.lastFeedback && (
              <div
                className={`w-full p-3 rounded-lg text-center font-semibold text-sm border ${
                  gn.lastFeedback === 'CORRECT'
                    ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                    : gn.lastFeedback === 'TOO_HIGH'
                    ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                    : gn.lastFeedback === 'TOO_LOW'
                    ? 'bg-sky-950/60 border-sky-700 text-sky-300'
                    : 'bg-rose-950/60 border-rose-700 text-rose-300'
                }`}
              >
                {gn.lastFeedback === 'CORRECT' && '🎉 BINGO! You guessed the exact number!'}
                {gn.lastFeedback === 'TOO_HIGH' && '📉 Too High! Try a lower number.'}
                {gn.lastFeedback === 'TOO_LOW' && '📈 Too Low! Try a higher number.'}
                {gn.lastFeedback === 'GAME_OVER' && `❌ Out of guesses! The secret was ${gn.target}.`}
              </div>
            )}

            {/* Guess History */}
            {gn.history.length > 0 && (
              <div className="w-full space-y-1">
                <div className="text-[11px] font-mono text-slate-400">Previous Guesses:</div>
                <div className="flex flex-wrap gap-1.5">
                  {gn.history.map((h, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-slate-300"
                    >
                      {h.guess} ({h.hint})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 5. REACTION TAP SPEED */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'REACTION_TAP' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Reaction & Tap Speed Test</h3>
              <p className="text-xs text-slate-400 mt-0.5">Click START, wait for GREEN, then tap as fast as possible!</p>
            </div>
            {rg.bestTimeMs && (
              <div className="text-xs font-mono text-emerald-400 font-semibold">
                Best: {rg.bestTimeMs} ms
              </div>
            )}
          </div>

          <div className="flex flex-col items-center">
            {rg.status === 'WAITING' && (
              <button
                onClick={() => gameManager.startReactionTest()}
                className="w-64 h-40 rounded-2xl bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 flex flex-col items-center justify-center gap-2 transition active:scale-95"
              >
                <Zap className="w-8 h-8 text-cyan-400" />
                <span className="font-bold text-slate-200">START TEST</span>
                <span className="text-[11px] text-slate-400">Tap to begin countdown</span>
              </button>
            )}

            {rg.status === 'READY' && (
              <button
                onClick={() => gameManager.handleReactionClick()}
                className="w-64 h-40 rounded-2xl bg-amber-950 border-2 border-amber-600 flex flex-col items-center justify-center gap-2 transition cursor-pointer"
              >
                <span className="font-bold text-amber-300 text-lg animate-pulse">WAIT FOR GREEN...</span>
                <span className="text-[11px] text-amber-400/80">(Don't click yet!)</span>
              </button>
            )}

            {rg.status === 'CLICK_NOW' && (
              <button
                onClick={() => gameManager.handleReactionClick()}
                className="w-64 h-40 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 flex flex-col items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                <span className="font-bold text-white text-2xl">TAP NOW!</span>
              </button>
            )}

            {rg.status === 'TOO_EARLY' && (
              <div className="w-64 h-40 rounded-2xl bg-rose-950 border-2 border-rose-600 flex flex-col items-center justify-center gap-2">
                <span className="font-bold text-rose-300 text-lg">Too Early!</span>
                <button
                  onClick={() => gameManager.startReactionTest()}
                  className="text-xs px-3 py-1.5 rounded bg-rose-900 text-rose-100 hover:bg-rose-800"
                >
                  Try Again
                </button>
              </div>
            )}

            {rg.status === 'FINISHED' && (
              <div className="w-64 h-40 rounded-2xl bg-slate-800 border-2 border-cyan-500 flex flex-col items-center justify-center gap-2">
                <span className="text-xs text-slate-400 font-mono">Reaction Time</span>
                <span className="font-bold text-cyan-400 text-3xl font-mono">{rg.reactionTimeMs} ms</span>
                <button
                  onClick={() => gameManager.startReactionTest()}
                  className="mt-2 text-xs px-3 py-1.5 rounded bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400"
                >
                  Test Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. SIMON SAYS */}
      {/* ------------------------------------------------------------- */}
      {activeGame === 'SIMON_SAYS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-semibold text-slate-100">Simon Says</h3>
              <p className="text-xs text-slate-400 mt-0.5">Watch the color sequence and repeat it accurately</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-cyan-400">Level: {ss.level}</span>
              <span className="text-amber-400">High Score: {ss.highScore}</span>
              <button
                onClick={() => gameManager.startSimonSays()}
                className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Start / Reset
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="grid grid-cols-2 gap-3 w-56 h-56">
              {[
                { id: 0, color: 'bg-rose-500', activeColor: 'bg-rose-300 shadow-rose-500' },
                { id: 1, color: 'bg-blue-500', activeColor: 'bg-blue-300 shadow-blue-500' },
                { id: 2, color: 'bg-emerald-500', activeColor: 'bg-emerald-300 shadow-emerald-500' },
                { id: 3, color: 'bg-amber-500', activeColor: 'bg-amber-300 shadow-amber-500' },
              ].map((btn) => {
                const isActive = ss.activeLight === btn.id;
                return (
                  <button
                    key={btn.id}
                    onClick={() => gameManager.pressSimonColor(btn.id)}
                    disabled={ss.isShowingSequence || ss.isGameOver || ss.sequence.length === 0}
                    className={`rounded-2xl transition-all duration-150 active:scale-95 ${
                      isActive ? `${btn.activeColor} scale-105 shadow-xl` : `${btn.color} opacity-80 hover:opacity-100`
                    }`}
                  />
                );
              })}
            </div>

            {ss.isShowingSequence && (
              <span className="text-xs font-mono text-cyan-400 animate-pulse">TARA is showing sequence...</span>
            )}
            {!ss.isShowingSequence && !ss.isGameOver && ss.sequence.length > 0 && (
              <span className="text-xs font-mono text-emerald-400">Your turn to repeat!</span>
            )}
            {ss.sequence.length === 0 && (
              <button
                onClick={() => gameManager.startSimonSays()}
                className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-sm hover:bg-cyan-400"
              >
                START GAME
              </button>
            )}
            {ss.isGameOver && (
              <div className="text-center">
                <span className="text-rose-400 text-sm font-semibold block">Game Over! Level {ss.level} reached.</span>
                <button
                  onClick={() => gameManager.startSimonSays()}
                  className="mt-2 text-xs px-3 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
