import React, { useState, useEffect } from 'react';
import {
  RobotState,
  RobotEmotion,
  RobotActivity,
  RobotActionName,
  ArmGesture,
} from '../types';
import { taraBehaviorManager } from '../services/TaraBehaviorManager';
import { actionManager } from '../services/ActionManager';
import { activityManager } from '../services/ActivityManager';
import { armController } from '../services/ArmController';
import { presenceManager } from '../services/PresenceManager';
import { voiceManager } from '../services/VoiceManager';
import { emotionEngine } from '../services/EmotionEngine';
import {
  Cpu,
  Mic,
  Sparkles,
  Volume2,
  Smile,
  Frown,
  AlertCircle,
  Moon,
  BookOpen,
  Music,
  Utensils,
  Hand,
  RotateCcw,
  UserCheck,
  UserX,
  Send,
  Zap,
  Radio,
} from 'lucide-react';

interface SimulationControlsProps {
  currentState: RobotState;
  currentEmotion: RobotEmotion;
  currentActivity?: RobotActivity;
  onStateChange: (state: RobotState, emotion?: RobotEmotion) => void;
  onActivityChange?: (act: RobotActivity) => void;
  onSimulateSpeech?: (text: string) => void;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  currentState,
  currentEmotion,
  currentActivity = 'IDLE',
  onStateChange,
  onActivityChange,
  onSimulateSpeech,
}) => {
  const [speechInput, setSpeechInput] = useState('');
  const [activeAction, setActiveAction] = useState<RobotActionName | null>(null);
  const [actionProgress, setActionProgress] = useState<{ elapsed: number; total: number }>({
    elapsed: 0,
    total: 0,
  });
  const [activeGesture, setActiveGesture] = useState<ArmGesture>('IDLE');

  useEffect(() => {
    const unsubAction = actionManager.subscribe((action, elapsed, total) => {
      setActiveAction(action);
      setActionProgress({ elapsed, total });
    });

    const unsubArm = armController.subscribe((s) => {
      setActiveGesture(s.activeGesture);
    });

    return () => {
      unsubAction();
      unsubArm();
    };
  }, []);

  const dispatchContext = {
    setState: (st: RobotState) => onStateChange(st),
    setEmotion: (em: RobotEmotion) => onStateChange(currentState, em),
    setActivity: (act: RobotActivity) => onActivityChange?.(act),
  };

  // 15 Exact Buttons Mandated by Requirements:
  // Detect Person, Person Left, Listen, Think, Speak, Happy, Sad, Surprised, Sleep, Read, Sing, Cook, Play Music, Wave, Reset
  const handleDetectPerson = () => {
    presenceManager.triggerPersonDetected(45);
    taraBehaviorManager.triggerGreeting(dispatchContext);
  };

  const handlePersonLeft = () => {
    presenceManager.triggerPersonLeft();
  };

  const handleListen = () => {
    onStateChange('LISTENING', 'CURIOUS');
    emotionEngine.setEmotion('CURIOUS');
    voiceManager.startListening((text) => {
      taraBehaviorManager.handleIntent(text, dispatchContext, 'HAPPY', text);
    });
  };

  const handleThink = () => {
    actionManager.executeAction('ThinkingAction', {
      setState: (st) => onStateChange(st),
      setEmotion: (em) => onStateChange(currentState, em),
    });
  };

  const handleSpeak = () => {
    const sample = "Hello! I am TARA, your expressive desktop AI companion.";
    onStateChange('SPEAKING', 'JOY');
    voiceManager.speak(sample, () => {
      onStateChange('IDLE', 'NEUTRAL');
    });
  };

  const handleHappy = () => {
    onStateChange('HAPPY', 'HAPPY');
    emotionEngine.setEmotion('HAPPY', 0.9);
    armController.executeGesture('HAPPY_MOVE', 2500);
  };

  const handleSad = () => {
    onStateChange('SAD', 'SAD');
    emotionEngine.setEmotion('SAD', 0.9);
    armController.executeGesture('SAD_MOVE', 3000);
  };

  const handleSurprised = () => {
    onStateChange('SURPRISED', 'SURPRISED');
    emotionEngine.setEmotion('SURPRISED', 1.0, 3000, () => {
      onStateChange('IDLE', 'NEUTRAL');
    });
  };

  const handleSleep = () => {
    activityManager.startActivity('SLEEPING', dispatchContext);
  };

  const handleRead = () => {
    activityManager.startActivity('READING', dispatchContext);
  };

  const handleSing = () => {
    activityManager.startActivity('SINGING', dispatchContext);
  };

  const handleCook = () => {
    activityManager.startActivity('COOKING', dispatchContext);
  };

  const handlePlayMusic = () => {
    activityManager.startActivity('LISTENING_MUSIC', dispatchContext);
  };

  const handleWave = () => {
    armController.executeGesture('WAVE', 3000);
    onStateChange('HAPPY', 'HAPPY');
    emotionEngine.setEmotion('HAPPY', 0.8);
  };

  const handleReset = () => {
    taraBehaviorManager.resetToIdle(dispatchContext);
    voiceManager.interrupt();
  };

  const handleSpeechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechInput.trim()) return;

    const userText = speechInput.trim();
    setSpeechInput('');

    // Pipe through real TaraBehaviorManager
    taraBehaviorManager.handleIntent(userText, dispatchContext, undefined, `I understood: "${userText}". Processing now.`);
    if (onSimulateSpeech) {
      onSimulateSpeech(userText);
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/30 dark:border-amber-400/20 rounded-2xl p-5 mb-6 backdrop-blur-sm">
      {/* Simulation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-amber-500/20">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-xs shadow-sm">
            SIM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase">
                TARA Companion Hardware Simulator
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Standard ESP32 Dual-Core
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              FaceEngine • EmotionEngine (14 Emotions) • ActionTimeline • Dual-Servo Arms • Presence Matrix • Voice Pipeline
            </p>
          </div>
        </div>

        {/* Live Subsystem Status Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="bg-white/80 dark:bg-slate-850 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            State: <strong className="text-cyan-600 dark:text-cyan-400">{currentState}</strong>
          </span>
          <span className="bg-white/80 dark:bg-slate-850 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Emotion: <strong className="text-amber-600 dark:text-amber-400">{currentEmotion}</strong>
          </span>
          <span className="bg-white/80 dark:bg-slate-850 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Activity: <strong className="text-emerald-600 dark:text-emerald-400">{currentActivity}</strong>
          </span>
          <span className="bg-white/80 dark:bg-slate-850 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            Arm: <strong className="text-purple-600 dark:text-purple-400">{activeGesture}</strong>
          </span>
        </div>
      </div>

      {/* Action Timeline Live Progress Indicator */}
      {activeAction && (
        <div className="mb-4 bg-slate-900/80 border border-cyan-500/40 rounded-xl p-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-300 mb-1">
            <span className="flex items-center gap-1.5 font-bold">
              <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              ActionTimeline: {activeAction}
            </span>
            <span>
              {actionProgress.elapsed}ms / {actionProgress.total}ms
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-100"
              style={{
                width: `${Math.min(100, (actionProgress.elapsed / Math.max(1, actionProgress.total)) * 100)}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* 15 Mandatory Action & Behavior Buttons */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
          <span>Core Robot Interaction Controls (Unified Hardware Interfaces):</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {/* 1. Detect Person */}
          <button
            type="button"
            onClick={handleDetectPerson}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Detect Person</span>
          </button>

          {/* 2. Person Left */}
          <button
            type="button"
            onClick={handlePersonLeft}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <UserX className="w-3.5 h-3.5 text-slate-400" />
            <span>Person Left</span>
          </button>

          {/* 3. Listen */}
          <button
            type="button"
            onClick={handleListen}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentState === 'LISTENING'
                ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-blue-400" />
            <span>Listen</span>
          </button>

          {/* 4. Think */}
          <button
            type="button"
            onClick={handleThink}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentState === 'THINKING'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Think</span>
          </button>

          {/* 5. Speak */}
          <button
            type="button"
            onClick={handleSpeak}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentState === 'SPEAKING'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Speak</span>
          </button>

          {/* 6. Happy */}
          <button
            type="button"
            onClick={handleHappy}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentEmotion === 'HAPPY'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Smile className="w-3.5 h-3.5 text-amber-400" />
            <span>Happy</span>
          </button>

          {/* 7. Sad */}
          <button
            type="button"
            onClick={handleSad}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentEmotion === 'SAD'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Frown className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sad</span>
          </button>

          {/* 8. Surprised */}
          <button
            type="button"
            onClick={handleSurprised}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentEmotion === 'SURPRISED'
                ? 'bg-cyan-600 text-white border-cyan-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Surprised</span>
          </button>

          {/* 9. Sleep */}
          <button
            type="button"
            onClick={handleSleep}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentState === 'SLEEPING'
                ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-slate-400" />
            <span>Sleep</span>
          </button>

          {/* 10. Read */}
          <button
            type="button"
            onClick={handleRead}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentActivity === 'READING'
                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Read</span>
          </button>

          {/* 11. Sing */}
          <button
            type="button"
            onClick={handleSing}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentActivity === 'SINGING'
                ? 'bg-pink-600 text-white border-pink-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span>Sing</span>
          </button>

          {/* 12. Cook */}
          <button
            type="button"
            onClick={handleCook}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentActivity === 'COOKING'
                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Utensils className="w-3.5 h-3.5 text-orange-400" />
            <span>Cook</span>
          </button>

          {/* 13. Play Music */}
          <button
            type="button"
            onClick={handlePlayMusic}
            className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
              currentActivity === 'LISTENING_MUSIC'
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span>Play Music</span>
          </button>

          {/* 14. Wave */}
          <button
            type="button"
            onClick={handleWave}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm transition-all"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>Wave</span>
          </button>

          {/* 15. Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Voice / Natural Language Injection Form */}
      <form onSubmit={handleSpeechSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Mic className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={speechInput}
            onChange={(e) => setSpeechInput(e.target.value)}
            placeholder="Simulate speech to TARA (e.g. 'Read a book', 'Let\'s cook', 'Sing a song', 'Play music')"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="submit"
          disabled={!speechInput.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Dispatch to BehaviorManager</span>
        </button>
      </form>
    </div>
  );
};
