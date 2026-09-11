/**
 * DirectDisplayGameController.tsx
 * Comprehensive control and telemetry panel for TARA's Direct-Display Game System.
 *
 * All game graphics render directly on TARA's OLED display.
 * This panel connects the user's real microphone (STT) or simulated voice commands
 * in English, Bangla, and Banglish directly into GameVoiceInputParser and GameEngine.
 */

import React, { useEffect, useState } from 'react';
import {
  Gamepad2,
  Mic,
  MicOff,
  Volume2,
  Tv,
  Play,
  RotateCcw,
  LogOut,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Zap,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import { gameEngine } from '../services/games/GameEngine';
import { DirectGameMasterState, DirectGameType } from '../services/games/GameState';

export const DirectDisplayGameController: React.FC = () => {
  const [gameState, setGameState] = useState<DirectGameMasterState>(gameEngine.getState());
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [simulatedInput, setSimulatedInput] = useState<string>('');
  const [selectedLang, setSelectedLang] = useState<string>('en-US');

  useEffect(() => {
    const unsub = gameEngine.subscribe(() => {
      setGameState({ ...gameEngine.getState() });
    });
    return () => unsub();
  }, []);

  const handleToggleMic = () => {
    if (isMicActive) {
      gameEngine.stopSpeechRecognition();
      setIsMicActive(false);
    } else {
      gameEngine.startSpeechRecognition(selectedLang);
      setIsMicActive(true);
    }
  };

  const handleSimulateVoice = (text: string) => {
    if (!text.trim()) return;
    gameEngine.processSimulatedVoice(text);
    setSimulatedInput('');
  };

  const getGameLabel = (type: DirectGameType): string => {
    switch (type) {
      case 'TIC_TAC_TOE': return 'Tic-Tac-Toe (৩×৩)';
      case 'ROCK_PAPER_SCISSORS': return 'Rock Paper Scissors';
      case 'GUESS_NUMBER': return 'Guess Number (1-100)';
      case 'HIGHER_LOWER': return 'Higher or Lower';
      case 'MEMORY_MATCH': return 'Memory Match (12 Cards)';
      case 'CONNECT_FOUR': return 'Connect Four (7×6)';
      case 'PATTERN_MEMORY': return 'Pattern Memory';
      case 'REACTION': return 'Reflex Reaction Test';
      case 'SIMON_SAYS': return 'Simon Says';
      case 'DICE_GAME': return 'Dice Duel';
      case 'QUICK_REACTION': return 'Quick Voice Reaction';
      default: return 'None (Idle Face)';
    }
  };

  const getVoiceStateBadgeColor = (vs: string) => {
    switch (vs) {
      case 'GAME_LISTENING': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse';
      case 'GAME_PROCESSING': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'GAME_ACTION_ACCEPTED': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'GAME_INVALID_INPUT': return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'GAME_RESULT': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'GAME_STARTING': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 text-slate-100 space-y-6 shadow-xl">
      {/* Top Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">Direct-Display Game Console</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                OLED RUNTIME ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Games render pixel-by-pixel on TARA's screen. Voice control in English, Bangla & Banglish.
            </p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border font-semibold ${getVoiceStateBadgeColor(gameState.voiceState)}`}>
            {gameState.voiceState}
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 font-semibold">
            {getGameLabel(gameState.activeGame)}
          </span>
        </div>
      </div>

      {/* Autonomous Invitation Banner (if active) */}
      {gameState.invitationActive && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3 text-sm">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300">TARA is inviting you to play!</span>
              <p className="text-xs text-slate-300">
                "Want to play {getGameLabel(gameState.invitedGame)}? Say yes or no!" ({gameState.invitationTimeoutSec}s remaining)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => gameEngine.acceptInvitation()}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
            >
              Accept ("Yes")
            </button>
            <button
              onClick={() => gameEngine.dismissInvitation()}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs border border-slate-700 transition-colors"
            >
              Decline ("No")
            </button>
          </div>
        </div>
      )}

      {/* Primary Voice Pipeline Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Real STT & Voice Simulator (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl bg-slate-950/80 border border-slate-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">Voice Control Pipeline</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedLang}
                onChange={(e) => {
                  setSelectedLang(e.target.value);
                  if (isMicActive) {
                    gameEngine.stopSpeechRecognition();
                    gameEngine.startSpeechRecognition(e.target.value);
                  }
                }}
                className="bg-slate-900 text-slate-300 text-[11px] font-mono px-2 py-1 rounded border border-slate-700 focus:outline-none focus:border-cyan-500"
              >
                <option value="en-US">English (en-US)</option>
                <option value="bn-BD">Bangla (বাংলা - bn-BD)</option>
                <option value="en-IN">Banglish / English (en-IN)</option>
              </select>

              <button
                onClick={handleToggleMic}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  isMicActive
                    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50 animate-pulse'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
                }`}
              >
                {isMicActive ? (
                  <>
                    <MicOff className="w-3.5 h-3.5" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5" />
                    <span>Live Mic STT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Voice Input Displays */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Recognized Speech:</div>
              <div className="text-cyan-300 font-semibold truncate mt-0.5">
                {gameState.recognizedSpeech ? `"${gameState.recognizedSpeech}"` : <span className="text-slate-600 italic">None yet</span>}
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <div className="text-[10px] text-slate-500 uppercase">Parsed Game Action:</div>
              <div className="text-emerald-300 font-semibold truncate mt-0.5">
                {gameState.parsedActionSummary || 'None'}
              </div>
            </div>
          </div>

          {/* Display Guidance / Error Warning */}
          {gameState.lastErrorGuidance && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{gameState.lastErrorGuidance}</span>
            </div>
          )}

          {/* Simulated Speech Input for Instant Testing */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] text-slate-400 font-medium flex items-center justify-between">
              <span>Simulate Spoken Input (Runs identical parser):</span>
              <span className="text-cyan-400 text-[10px]">{gameState.expectedInputPrompt}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={simulatedInput}
                onChange={(e) => setSimulatedInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSimulateVoice(simulatedInput)}
                placeholder='e.g. "five", "পাঁচ", "rock", "higher", "roll", "GO"'
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={() => handleSimulateVoice(simulatedInput)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition-colors"
              >
                Send Voice
              </button>
            </div>
          </div>

          {/* Quick Voice Command Chips */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
              Quick Voice Presets (Multilingual):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['five', 'পাঁচ', 'rock', 'পাথর', 'higher', 'lower', 'column 4', 'roll', 'GO', 'restart', 'exit'].map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleSimulateVoice(phrase)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 text-[11px] font-mono border border-slate-700 hover:border-cyan-500/50 transition-colors"
                >
                  "{phrase}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Live Game HUD (5 Cols) */}
        <div className="lg:col-span-5 rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Live Display Status</span>
              <span className="text-[10px] font-mono text-cyan-400">TURN: {gameState.currentTurn.toUpperCase()}</span>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-2 gap-2 my-3">
              <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/20 text-center">
                <div className="text-[10px] text-cyan-400 font-mono">PLAYER SCORE</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">{gameState.playerScore}</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 text-center">
                <div className="text-[10px] text-purple-400 font-mono">TARA SCORE</div>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">{gameState.taraScore}</div>
              </div>
            </div>

            {/* Current Game Display HUD Banner */}
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="text-[10px] text-slate-500 font-mono">ON-SCREEN STATUS TEXT:</div>
              <div className="text-slate-200 font-semibold font-mono mt-1">
                {gameState.resultBanner || gameState.gameStatusText}
              </div>
            </div>
          </div>

          {/* Quick Life & Dev Controls */}
          <div className="pt-2 border-t border-slate-850 flex flex-wrap gap-1.5">
            <button
              onClick={() => gameEngine.startInvitation()}
              className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] font-semibold border border-amber-500/30 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>Ask "Want to play?"</span>
            </button>

            {gameState.activeGame !== 'NONE' && (
              <>
                <button
                  onClick={() => gameEngine.restartGame()}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restart</span>
                </button>
                <button
                  onClick={() => gameEngine.exitGame()}
                  className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-semibold border border-rose-500/30 flex items-center gap-1 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Exit Game</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 11 Direct-Display Games Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 tracking-wider uppercase">
            Select Direct-Display Game (Renders on OLED)
          </span>
          <span className="text-[11px] text-slate-400 font-mono">11 Supported Titles</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {[
            { id: 'TIC_TAC_TOE', name: 'Tic-Tac-Toe', sub: '৩×৩ টিক ট্যাক টো' },
            { id: 'ROCK_PAPER_SCISSORS', name: 'Rock Paper Scissors', sub: 'পাথর কাগজ কাঁচি' },
            { id: 'GUESS_NUMBER', name: 'Guess Number', sub: '১-১০০ সংখ্যা অনুমান' },
            { id: 'HIGHER_LOWER', name: 'Higher or Lower', sub: 'বেশি নাকি কম' },
            { id: 'MEMORY_MATCH', name: 'Memory Match', sub: '১২ কার্ড ম্যাচ' },
            { id: 'CONNECT_FOUR', name: 'Connect Four', sub: '৭×৬ বোর্ড' },
            { id: 'PATTERN_MEMORY', name: 'Pattern Memory', sub: 'প্যাটার্ন মেমোরি' },
            { id: 'REACTION', name: 'Reflex Test', sub: 'রিফ্লেক্স পরীক্ষা' },
            { id: 'SIMON_SAYS', name: 'Simon Says', sub: 'সাইমন সেস' },
            { id: 'DICE_GAME', name: 'Dice Duel', sub: 'ডাইস খেলা' },
            { id: 'QUICK_REACTION', name: 'Quick Voice', sub: 'কুইক ট্যাপ' },
          ].map((item) => {
            const isSelected = gameState.activeGame === item.id;
            return (
              <button
                key={item.id}
                onClick={() => gameEngine.startGame(item.id as DirectGameType)}
                className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-bold leading-tight">{item.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.sub}</div>
                </div>
                <div className="mt-2 text-[9px] font-mono text-cyan-400 flex items-center gap-1">
                  {isSelected ? '● ACTIVE ON OLED' : '▶ LAUNCH ON SCREEN'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Developer Testing Controls (Simulation Mode Verification) */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Developer Controls (Hardware & Simulation Verification)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Zero physical head movement guaranteed</span>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => gameEngine.forceValidMove()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700 hover:border-emerald-500/40 font-mono font-medium transition-colors"
          >
            Force Valid Move
          </button>
          <button
            onClick={() => gameEngine.forceInvalidMove()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-300 border border-slate-700 hover:border-rose-500/40 font-mono font-medium transition-colors"
          >
            Force Invalid Move (Test Confusion Face)
          </button>
          <button
            onClick={() => gameEngine.forceWin()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 font-mono font-medium transition-colors"
          >
            Force Win (Test Celebration & Clapping)
          </button>
          <button
            onClick={() => gameEngine.forceLoss()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 hover:border-purple-500/40 font-mono font-medium transition-colors"
          >
            Force Loss (Test TARA Victory Face)
          </button>
          <button
            onClick={() => gameEngine.forceDraw()}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-500/40 font-mono font-medium transition-colors"
          >
            Force Draw (Test Cat's Game)
          </button>
        </div>
      </div>
    </div>
  );
};
