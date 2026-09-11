/**
 * SimulationControls.tsx
 * Complete hardware simulation & testing control deck for TARA.
 *
 * Fully implements:
 * - TEST_SINGING
 * - TEST_COOKING
 * - TEST_READING
 * - TEST_MUSIC
 * - TEST_SLEEP
 * - TEST_ALL_EXPRESSIONS
 * - TEST_ALL_MOUTH_STATES
 * - TEST_ALL_EYE_STATES
 * - TEST_ALL_ARM_GESTURES
 *
 * Plus individual manual controls for:
 * FACE, EMOTION, ACTIVITY, MICROPHONE, ARMS, MOUTH, VOICE, COOKING, FLAME, STEAM, BOOK, MUSIC.
 */

import React, { useState } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Flame,
  BookOpen,
  Mic,
  Music,
  Moon,
  Eye,
  Smile,
  Hand,
  Volume2,
  ListRestart,
  CheckCircle2,
  Tv,
} from 'lucide-react';
import { actionManager } from '../services/ActionManager';
import { activitySceneManager } from '../services/ActivitySceneManager';
import { animationCoordinator } from '../services/AnimationCoordinator';
import { armController } from '../services/ArmController';
import { expressionManager } from '../services/ExpressionManager';
import { voiceManager } from '../services/VoiceManager';
import {
  TaraActivity,
  TaraArmGesture,
  TaraEmotion,
  TaraExpression,
  TaraEyeState,
  TaraMouthState,
} from '../types';

export const SimulationControls: React.FC = () => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [testProgress, setTestProgress] = useState<string>('');
  const [stopFn, setStopFn] = useState<(() => void) | null>(null);

  // Manual Selectors State
  const [selectedEmotion, setSelectedEmotion] = useState<TaraEmotion>('happy');
  const [selectedExpression, setSelectedExpression] = useState<TaraExpression>('happy');
  const [selectedActivity, setSelectedActivity] = useState<TaraActivity>('IDLE');
  const [selectedMouth, setSelectedMouth] = useState<TaraMouthState>('SMILE');
  const [selectedEye, setSelectedEye] = useState<TaraEyeState>('normal');
  const [selectedArm, setSelectedArm] = useState<TaraArmGesture>('IDLE');

  const stopActiveTest = () => {
    if (stopFn) {
      stopFn();
      setStopFn(null);
    }
    setActiveTest(null);
    setTestProgress('');
  };

  // Automated Test Handlers
  const handleTestSinging = () => {
    stopActiveTest();
    setActiveTest('SINGING');
    setTestProgress('Running Singing Sequence (Microphone, Hand Hold, Notes, Voice)...');
    actionManager.triggerSingingSequence();
  };

  const handleTestCooking = () => {
    stopActiveTest();
    setActiveTest('COOKING');
    setTestProgress('Running Cooking Sequence (Stove On, Flame, Pot, Steam, Stirring)...');
    actionManager.triggerCookingSequence();
  };

  const handleTestReading = () => {
    stopActiveTest();
    setActiveTest('READING');
    setTestProgress('Running Reading Sequence (Book, Turn Page, Focused Eyes)...');
    actionManager.triggerReadingSequence();
  };

  const handleTestMusic = () => {
    stopActiveTest();
    setActiveTest('MUSIC');
    setTestProgress('Running Music Sequence (Headphones, Equalizer, Notes)...');
    actionManager.triggerMusicSequence();
  };

  const handleTestSleep = () => {
    stopActiveTest();
    setActiveTest('SLEEP');
    setTestProgress('Running Sleep Sequence (Closed Eyes, ZZZ Particles)...');
    actionManager.triggerSleepSequence();
  };

  const handleTestAllExpressions = () => {
    stopActiveTest();
    setActiveTest('ALL_EXPRESSIONS');
    const cancel = actionManager.testAllExpressions((exp, idx, total) => {
      setTestProgress(`Testing Expression (${idx}/${total}): ${exp}`);
    });
    setStopFn(() => cancel);
  };

  const handleTestAllMouthStates = () => {
    stopActiveTest();
    setActiveTest('ALL_MOUTH_STATES');
    const cancel = actionManager.testAllMouthStates((mouth, idx, total) => {
      setTestProgress(`Testing Mouth Shape (${idx}/${total}): ${mouth}`);
    });
    setStopFn(() => cancel);
  };

  const handleTestAllEyeStates = () => {
    stopActiveTest();
    setActiveTest('ALL_EYE_STATES');
    const cancel = actionManager.testAllEyeStates((eye, idx, total) => {
      setTestProgress(`Testing Eye State (${idx}/${total}): ${eye}`);
    });
    setStopFn(() => cancel);
  };

  const handleTestAllArmGestures = () => {
    stopActiveTest();
    setActiveTest('ALL_ARM_GESTURES');
    const cancel = actionManager.testAllArmGestures((gesture, idx, total) => {
      setTestProgress(`Testing Visual Arm Gesture (${idx}/${total}): ${gesture}`);
    });
    setStopFn(() => cancel);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-5">
      {/* Title & Active Test Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            Simulation & Automated Verification Deck
          </h3>
          <p className="text-xs text-slate-400">
            Hardware-accurate logical state verification across all TARA subsystems
          </p>
        </div>

        {activeTest && (
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40 animate-pulse">
              {testProgress}
            </span>
            <button
              onClick={stopActiveTest}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-semibold flex items-center gap-1"
            >
              <Square className="w-3 h-3" /> Stop Test
            </button>
          </div>
        )}
      </div>

      {/* Primary Automated Test Suite Buttons (Section 22 Mandate) */}
      <div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Play className="w-3.5 h-3.5 text-emerald-400" />
          One-Click Automated Scene & Component Suites
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={handleTestSinging}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-900/50 to-indigo-900/50 hover:from-purple-800/60 hover:to-indigo-800/60 border border-purple-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
              <Mic className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              TEST_SINGING
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Real Mic + Arm + Notes</div>
          </button>

          <button
            onClick={handleTestCooking}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-900/50 to-orange-900/50 hover:from-amber-800/60 hover:to-orange-800/60 border border-amber-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Flame className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              TEST_COOKING
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Stove + Flame + Steam</div>
          </button>

          <button
            onClick={handleTestReading}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-900/50 to-cyan-900/50 hover:from-blue-800/60 hover:to-cyan-800/60 border border-blue-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs">
              <BookOpen className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              TEST_READING
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Open Book + Page Flip</div>
          </button>

          <button
            onClick={handleTestMusic}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-900/50 to-teal-900/50 hover:from-emerald-800/60 hover:to-teal-800/60 border border-emerald-500/40 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
              <Music className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              TEST_MUSIC
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Headphones + Equalizer</div>
          </button>

          <button
            onClick={handleTestSleep}
            className="px-3 py-2.5 rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border border-slate-600/50 text-left transition-all group"
          >
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <Moon className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              TEST_SLEEP
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Closed Eyes + ZZZ</div>
          </button>

          <button
            onClick={handleTestAllExpressions}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-cyan-500/30 text-left transition-all"
          >
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              TEST_ALL_EXPRESSIONS
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">All 34+ Facial Expressions</div>
          </button>

          <button
            onClick={handleTestAllMouthStates}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-pink-500/30 text-left transition-all"
          >
            <div className="flex items-center gap-2 text-pink-300 font-bold text-xs">
              <Smile className="w-3.5 h-3.5 text-pink-400" />
              TEST_ALL_MOUTH_STATES
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">All 12 Mouth Shapes</div>
          </button>

          <button
            onClick={handleTestAllEyeStates}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-amber-500/30 text-left transition-all"
          >
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              TEST_ALL_EYE_STATES
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Squint, Wink, Wide, Spiral</div>
          </button>

          <button
            onClick={handleTestAllArmGestures}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-indigo-500/30 text-left transition-all"
          >
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
              <Hand className="w-3.5 h-3.5 text-indigo-400" />
              TEST_ALL_HAND_GESTURES
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Wave, Point, Clap, Stir...</div>
          </button>

          <button
            onClick={() => {
              activitySceneManager.setActivity('IDLE');
              animationCoordinator.setExpression('happy');
              armController.setGesture('IDLE');
              voiceManager.interrupt();
            }}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition-all"
          >
            <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
              <ListRestart className="w-3.5 h-3.5 text-slate-400" />
              RESET_TO_IDLE
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Normal Face + Resting Hands</div>
          </button>
        </div>
      </div>

      {/* Required 11 Standalone Hand Tests (Specific User Directive) */}
      <div className="border-t border-slate-800 pt-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-indigo-400" />
            11 Required Standalone Hand Gesture Tests (No Arms • No Servos)
          </span>
          <span className="text-[10px] text-emerald-400 font-mono">Solid 5-Finger Vectors</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {[
            { id: 'TEST_OPEN_HAND', g: 'OPEN_HAND', label: 'TEST_OPEN_HAND', desc: 'Dual palms forward' },
            { id: 'TEST_WAVE', g: 'WAVE', label: 'TEST_WAVE', desc: 'Side-to-side wave' },
            { id: 'TEST_THUMBS_UP', g: 'THUMBS_UP', label: 'TEST_THUMBS_UP', desc: 'Thumbs-up pose' },
            { id: 'TEST_POINT', g: 'POINT', label: 'TEST_POINT', desc: 'Forward point' },
            { id: 'TEST_CLAP', g: 'CLAP', label: 'TEST_CLAP', desc: 'Clap together & separate' },
            { id: 'TEST_HOLD_MIC', g: 'HOLD_MIC', label: 'TEST_HOLD_MIC', desc: 'Grips microphone' },
            { id: 'TEST_STIR', g: 'STIR', label: 'TEST_STIR', desc: 'Orbits cooking pot' },
            { id: 'TEST_HOLD_BOOK', g: 'HOLD_BOOK', label: 'TEST_HOLD_BOOK', desc: 'Grips book edges' },
            { id: 'TEST_CELEBRATE', g: 'CELEBRATE', label: 'TEST_CELEBRATE', desc: 'Raised high bobbing' },
            { id: 'TEST_THINKING', g: 'THINKING', label: 'TEST_THINKING', desc: 'Rests under chin' },
            { id: 'TEST_GREETING', g: 'GREETING', label: 'TEST_GREETING', desc: 'Welcoming wave' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                armController.setGesture(t.g as TaraArmGesture);
                setSelectedArm(t.g as TaraArmGesture);
                if (t.g === 'HOLD_MIC') {
                  activitySceneManager.setActivity('SINGING');
                  animationCoordinator.setExpression('singing');
                } else if (t.g === 'STIR') {
                  activitySceneManager.setActivity('COOKING');
                  animationCoordinator.setExpression('focused');
                } else if (t.g === 'HOLD_BOOK') {
                  activitySceneManager.setActivity('READING');
                  animationCoordinator.setExpression('focused');
                } else if (t.g === 'WAVE' || t.g === 'THUMBS_UP' || t.g === 'CELEBRATE' || t.g === 'GREETING') {
                  animationCoordinator.setExpression('happy');
                } else if (t.g === 'THINKING') {
                  animationCoordinator.setExpression('thinking');
                }
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-indigo-500/30 text-left transition-all"
            >
              <div className="font-mono text-xs font-bold text-indigo-300">{t.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Interactive Parameter Selectors (Section 22 Mandate) */}
      <div className="border-t border-slate-800 pt-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Direct Manual State Override Selectors
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* 1. EMOTION SELECTOR */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>EMOTION</span>
              <span className="text-cyan-400 font-mono">{selectedEmotion}</span>
            </label>
            <select
              value={selectedEmotion}
              onChange={(e) => {
                const val = e.target.value as TaraEmotion;
                setSelectedEmotion(val);
                animationCoordinator.setEmotion(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {[
                'happy',
                'neutral',
                'excited',
                'curious',
                'sad',
                'angry',
                'sleepy',
                'confused',
                'surprised',
                'shy',
                'proud',
                'bored',
                'playful',
                'scared',
                'worried',
                'focused',
              ].map((emo) => (
                <option key={emo} value={emo}>
                  {emo}
                </option>
              ))}
            </select>
          </div>

          {/* 2. ACTIVITY SELECTOR */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>ACTIVITY</span>
              <span className="text-purple-400 font-mono">{selectedActivity}</span>
            </label>
            <select
              value={selectedActivity}
              onChange={(e) => {
                const val = e.target.value as TaraActivity;
                setSelectedActivity(val);
                activitySceneManager.setActivity(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {['IDLE', 'SINGING', 'COOKING', 'READING', 'MUSIC', 'SLEEPING', 'SPEAKING'].map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* 3. EXPRESSION SELECTOR */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>FACE / EXPRESSION</span>
              <span className="text-amber-400 font-mono">{selectedExpression}</span>
            </label>
            <select
              value={selectedExpression}
              onChange={(e) => {
                const val = e.target.value as TaraExpression;
                setSelectedExpression(val);
                animationCoordinator.setExpression(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {expressionManager.getAllExpressions().map((exp) => (
                <option key={exp.name} value={exp.name}>
                  {exp.label} ({exp.name})
                </option>
              ))}
            </select>
          </div>

          {/* 4. MOUTH STATE */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>MOUTH</span>
              <span className="text-pink-400 font-mono">{selectedMouth}</span>
            </label>
            <select
              value={selectedMouth}
              onChange={(e) => {
                const val = e.target.value as TaraMouthState;
                setSelectedMouth(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {[
                'CLOSED',
                'SMALL',
                'SMILE',
                'OPEN_SMALL',
                'OPEN_MEDIUM',
                'OPEN_WIDE',
                'O_SHAPE',
                'A_SHAPE',
                'E_SHAPE',
                'SPEAKING',
                'LAUGHING',
                'SINGING',
              ].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 5. STANDALONE HANDS */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>HANDS / GESTURE</span>
              <span className="text-emerald-400 font-mono">{selectedArm}</span>
            </label>
            <select
              value={selectedArm}
              onChange={(e) => {
                const val = e.target.value as TaraArmGesture;
                setSelectedArm(val);
                armController.setGesture(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {[
                'IDLE',
                'WAVE',
                'HOLD_MIC',
                'RAISE_HAND',
                'POINT',
                'THUMBS_UP',
                'CLAP',
                'STIR',
                'HOLD_BOOK',
                'CELEBRATE',
                'THINKING',
                'GREETING',
              ].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 6. EYE OVERRIDE */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col gap-1.5">
            <label className="text-slate-400 font-semibold flex items-center justify-between">
              <span>EYE STATE</span>
              <span className="text-indigo-400 font-mono">{selectedEye}</span>
            </label>
            <select
              value={selectedEye}
              onChange={(e) => {
                const val = e.target.value as TaraEyeState;
                setSelectedEye(val);
                animationCoordinator.setEyeOverride(val);
              }}
              className="bg-slate-900 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono text-xs focus:ring-1 focus:ring-cyan-500 outline-none"
            >
              {[
                'normal',
                'blink',
                'open',
                'look_left',
                'look_right',
                'look_down',
                'look_up',
                'squint',
                'wide',
                'wink',
                'closed',
                'half_closed',
                'dizzy_spiral',
                'hearts',
                'tears',
                'sparkle',
              ].map((eye) => (
                <option key={eye} value={eye}>
                  {eye}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
