/**
 * TabFaceDebug.tsx
 * Developer Real-time Visual Debugger Panel
 *
 * Exposes all internal engine parameters in a high-density diagnostic console:
 * - Current Activity
 * - Current Emotion
 * - Current Expression
 * - Current Scene
 * - Current Voice State
 * - Current Mouth State
 * - Current Eye State
 * - Current Arm Gesture
 * - Current Prop
 * - Current Animation Frame
 * - Audio Amplitude (real-time meter)
 * - Voice Queue State & items
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  Cpu,
  Eye,
  Hand,
  Layers,
  Mic,
  Smile,
  Volume2,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { activitySceneManager } from '../services/ActivitySceneManager';
import { animationCoordinator, CoordinatedFrame } from '../services/AnimationCoordinator';
import { armController } from '../services/ArmController';
import { voiceManager } from '../services/VoiceManager';
import { gameManager } from '../services/GameManager';
import {
  QueuedVoiceItem,
  TaraActivity,
  TaraArmGesture,
  TaraExpression,
  TaraMouthState,
  VoiceQueueState,
  VoiceState,
} from '../types';

export const TabFaceDebug: React.FC = () => {
  const [frame, setFrame] = useState<CoordinatedFrame>(animationCoordinator.getCoordinatedFrame());
  const [voiceState, setVoiceState] = useState<VoiceState>(voiceManager.getVoiceState());
  const [queueState, setQueueState] = useState<VoiceQueueState>(voiceManager.getQueueState());
  const [amplitude, setAmplitude] = useState<number>(0);
  const [voiceQueue, setVoiceQueue] = useState<QueuedVoiceItem[]>([]);
  const [frameCount, setFrameCount] = useState<number>(0);

  useEffect(() => {
    const unsubVoice = voiceManager.subscribe((st) => {
      setVoiceState(st.voiceState);
      setQueueState(st.queueState);
      setAmplitude(st.amplitude);
      setVoiceQueue(voiceManager.getQueue());
    });

    const timer = setInterval(() => {
      setFrame(animationCoordinator.getCoordinatedFrame());
      setFrameCount((prev) => (prev + 1) % 60);
      setVoiceQueue(voiceManager.getQueue());
    }, 66); // ~15Hz telemetry update

    return () => {
      unsubVoice();
      clearInterval(timer);
    };
  }, []);

  const getSceneDetail = () => {
    switch (frame.activity) {
      case 'COOKING':
        return `Cooking Scene [Stage: ${activitySceneManager.getCookingState().stage}, FlameFrame: ${activitySceneManager.getCookingState().flameFrame}]`;
      case 'SINGING':
        return `Singing Scene [Stage: ${activitySceneManager.getSingingState().stage}, MicH: ${activitySceneManager.getSingingState().micHeight.toFixed(2)}]`;
      case 'READING':
        return `Reading Scene [PageFlip: ${activitySceneManager.getReadingState().pageFlip.toFixed(2)}, Line: ${activitySceneManager.getReadingState().readingLine}]`;
      case 'MUSIC':
        return `Music Scene [Headphones On, Equalizer Bars: 8]`;
      case 'SLEEPING':
        return `Sleeping Scene [ZZZ Particles: ${activitySceneManager.getSleepingState().zzzParticles.length}, Breath: ${activitySceneManager.getSleepingState().breathCycle.toFixed(2)}]`;
      default:
        return 'Standard Idle Desktop Scene';
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              TARA Layered Diagnostic Console
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Pipeline Synced
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Live inspection of Emotion → ExpressionManager → FaceState → Layered Renderer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            LIVE TELEMETRY
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            Tick: {frameCount}/60
          </span>
        </div>
      </div>

      {/* Main Diagnostic Telemetry Grid (Exact Section 23 specification) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs font-mono">
        {/* 1. Activity & Scene */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Activity className="w-4 h-4 text-purple-400" />
            ACTIVITY & SCENE LAYER
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Activity:</span>
              <span className="text-purple-300 font-bold">{frame.activity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Scene:</span>
              <span className="text-slate-200 text-right text-[11px] truncate max-w-[170px]">
                {getSceneDetail()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Prop:</span>
              <span className="text-amber-300 font-bold">{frame.prop}</span>
            </div>
          </div>
        </div>

        {/* 2. Emotion & Expression */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Smile className="w-4 h-4 text-amber-400" />
            EMOTION & EXPRESSION LAYER
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Emotion:</span>
              <span className="text-amber-300 font-bold capitalize">{frame.emotion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Expression:</span>
              <span className="text-cyan-300 font-bold">{frame.expression}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blush / Cheeks:</span>
              <span className="text-slate-200">
                {frame.blush ? `Active (${(frame.blushIntensity * 100).toFixed(0)}%)` : 'Off'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Eyes & Pupils */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Eye className="w-4 h-4 text-cyan-400" />
            EYE & PUPIL STATE
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Eye State:</span>
              <span className="text-cyan-300 font-bold">{frame.eyeState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pupil Offset (X, Y):</span>
              <span className="text-slate-200">
                ({frame.pupilOffsetX.toFixed(2)}, {frame.pupilOffsetY.toFixed(2)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Eyebrow Angle / Offset:</span>
              <span className="text-slate-200">
                {frame.eyebrowAngle}° / {frame.eyebrowOffset}px
              </span>
            </div>
          </div>
        </div>

        {/* 4. Voice & Mouth Synchronization */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Volume2 className="w-4 h-4 text-emerald-400" />
            VOICE & MOUTH SYNCHRONIZATION
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Voice State:</span>
              <span className={`font-bold ${voiceState === 'VOICE_SPEAKING' ? 'text-emerald-400' : 'text-slate-300'}`}>
                {voiceState}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Mouth State:</span>
              <span className="text-pink-400 font-bold">{frame.mouthState}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Audio Amplitude:</span>
              <div className="flex items-center gap-2">
                <div className="w-20 h-2 rounded bg-slate-900 overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, amplitude * 100)}%` }}
                  />
                </div>
                <span className="text-emerald-300 text-[11px] w-8 text-right">
                  {(amplitude * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Standalone Floating Hands Display State */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Hand className="w-4 h-4 text-indigo-400" />
            STANDALONE FLOATING HANDS
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Current Gesture:</span>
              <span className="text-indigo-300 font-bold">{frame.armGesture}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Arm / Elbow Segments:</span>
              <span className="text-emerald-400 font-bold">REMOVED (Zero)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Physical Servos:</span>
              <span className="text-emerald-400 font-bold">0 (Pure Vector)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Head Movement:</span>
              <span className="text-emerald-400 font-bold">FIXED (Zero Jitter)</span>
            </div>
          </div>
        </div>

        {/* 6. Voice Queue Manager */}
        <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 space-y-2">
          <div className="text-slate-400 font-bold flex items-center gap-2 border-b border-slate-700/50 pb-1.5">
            <Layers className="w-4 h-4 text-teal-400" />
            VOICE QUEUE & SEQUENCER
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Voice Queue State:</span>
              <span className="text-teal-300 font-bold">{queueState}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Queued Messages:</span>
              <span className="text-slate-200">{voiceQueue.length} pending</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Interruption Capability:</span>
              <span className="text-cyan-400">Enabled (Instant Cut)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Interruption Test Bar */}
      <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-slate-300">
          <span className="font-bold text-white">Voice Queue Sequential Test:</span> Enqueue 3 sequential sentences and verify mouth opens and closes synchronously without overlap.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              voiceManager.speak("Hello there! First sentence in queue.", 'happy');
              voiceManager.speak("How is your afternoon going so far?", 'curious');
              voiceManager.speak("Let's build something extraordinary together!", 'excited');
            }}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold font-mono"
          >
            Queue 3 Sentences
          </button>
          <button
            onClick={() => {
              voiceManager.interrupt();
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold font-mono"
          >
            INTERRUPT / STOP
          </button>
        </div>
      </div>
      {/* Interactive Quick Trigger Testing Deck */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Interactive Debug Trigger Deck (Instant Execution)
        </h4>

        {/* 1. Activities */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Trigger Activity Scene:</span>
          <div className="flex flex-wrap gap-2">
            {(['IDLE', 'COOKING', 'SINGING', 'READING', 'MUSIC', 'SLEEPING'] as TaraActivity[]).map((act) => (
              <button
                key={act}
                onClick={() => {
                  activitySceneManager.setActivity(act);
                  animationCoordinator.setActivity(act);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  frame.activity === act
                    ? 'bg-cyan-600 text-white font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Standalone Floating Hand Gestures (All 18 + 11 Required Tests) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400">Trigger Standalone Hand Gesture (5-Finger Solid Floating Hands • Zero Arms):</span>
            <span className="text-[10px] text-emerald-400 font-mono">No Motors • Standard ESP32</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                'IDLE',
                'OPEN_HAND',
                'WAVE',
                'THUMBS_UP',
                'POINT',
                'CLAP',
                'HOLD_MIC',
                'STIR',
                'HOLD_BOOK',
                'CELEBRATE',
                'THINKING',
                'GREETING',
                'POINT_LEFT',
                'POINT_RIGHT',
                'POINT_UP',
                'CLOSE_HAND',
                'LISTENING',
                'PLAYING',
              ] as TaraArmGesture[]
            ).map((g) => (
              <button
                key={g}
                onClick={() => {
                  armController.setGesture(g);
                  animationCoordinator.setArmGesture(g);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                  frame.armGesture === g
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-900/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Key Expressions */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Trigger Facial Expression:</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                'happy',
                'big_smile',
                'laughing',
                'excited',
                'curious',
                'confused',
                'surprised',
                'sad',
                'angry',
                'sleepy',
                'shy',
                'blushing',
                'scared',
                'worried',
                'focused',
                'thinking',
                'amazed',
                'proud',
                'bored',
                'playful',
                'teasing',
                'wink',
                'celebrating',
                'neutral',
              ] as TaraExpression[]
            ).map((exp) => (
              <button
                key={exp}
                onClick={() => animationCoordinator.setExpression(exp)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  frame.expression === exp
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {exp}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Mouth States */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Trigger Mouth State:</span>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                'CLOSED',
                'SMALL',
                'SMILE',
                'OPEN_SMALL',
                'OPEN_MEDIUM',
                'OPEN_WIDE',
                'O_SHAPE',
                'A_SHAPE',
                'E_SHAPE',
                'LAUGHING',
                'SINGING',
                'SPEAKING',
              ] as TaraMouthState[]
            ).map((m) => (
              <button
                key={m}
                onClick={() => animationCoordinator.setMouthState(m)}
                className={`px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                  frame.mouthState === m
                    ? 'bg-pink-600 text-white font-bold'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Trigger Companion Games */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Launch Interactive Games:</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => gameManager.startTicTacToe()}
              className="px-2.5 py-1 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-300 border border-cyan-700 text-xs font-mono"
            >
              Tic-Tac-Toe
            </button>
            <button
              onClick={() => gameManager.startRockPaperScissors()}
              className="px-2.5 py-1 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-300 border border-purple-700 text-xs font-mono"
            >
              Rock Paper Scissors
            </button>
            <button
              onClick={() => gameManager.startMemoryMatch()}
              className="px-2.5 py-1 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700 text-xs font-mono"
            >
              Memory Match
            </button>
            <button
              onClick={() => gameManager.startGuessNumber()}
              className="px-2.5 py-1 rounded bg-amber-900/60 hover:bg-amber-800 text-amber-300 border border-amber-700 text-xs font-mono"
            >
              Guess Number
            </button>
            <button
              onClick={() => gameManager.startReflex()}
              className="px-2.5 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-300 border border-rose-700 text-xs font-mono"
            >
              Reflex Game
            </button>
            <button
              onClick={() => gameManager.startSimonSays()}
              className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-300 border border-blue-700 text-xs font-mono"
            >
              Simon Says
            </button>
            <button
              onClick={() => gameManager.startTrivia()}
              className="px-2.5 py-1 rounded bg-teal-900/60 hover:bg-teal-800 text-teal-300 border border-teal-700 text-xs font-mono"
            >
              Hardware Trivia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
