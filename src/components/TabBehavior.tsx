import React, { useState, useEffect } from 'react';
import {
  RobotEmotion,
  RobotState,
  RobotActivity,
  RobotActionName,
  ArmGesture,
  AutonomyConfig,
} from '../types';
import { emotionEngine } from '../services/EmotionEngine';
import { ActionManager, actionManager } from '../services/ActionManager';
import { activityManager } from '../services/ActivityManager';
import { autonomyManager } from '../services/AutonomyManager';
import { armController } from '../services/ArmController';
import { taraBehaviorManager } from '../services/TaraBehaviorManager';
import { ArmVisualizer } from './ArmVisualizer';
import { PresenceRadar } from './PresenceRadar';
import { MusicPlayerDeck } from './MusicPlayerDeck';
import {
  Sparkles,
  Zap,
  Activity,
  Layers,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Settings,
  HelpCircle,
} from 'lucide-react';

interface TabBehaviorProps {
  robotState: RobotState;
  emotion: RobotEmotion;
  activity?: RobotActivity;
  onSetState: (st: RobotState) => void;
  onSetEmotion: (em: RobotEmotion) => void;
  onSetActivity?: (act: RobotActivity) => void;
}

export const TabBehavior: React.FC<TabBehaviorProps> = ({
  robotState,
  emotion,
  activity = 'IDLE',
  onSetState,
  onSetEmotion,
  onSetActivity,
}) => {
  const [autonomyConfig, setAutonomyConfig] = useState<AutonomyConfig>(
    autonomyManager.getConfig()
  );
  const [selectedActionPreview, setSelectedActionPreview] =
    useState<RobotActionName>('GreetingAction');
  const [intensity, setIntensity] = useState<number>(0.85);

  const all14Emotions: RobotEmotion[] = [
    'NEUTRAL',
    'HAPPY',
    'EXCITED',
    'CURIOUS',
    'CONFUSED',
    'SURPRISED',
    'SAD',
    'ANGRY',
    'SLEEPY',
    'LOVE',
    'PLAYFUL',
    'WORRIED',
    'PROUD',
    'BORED',
  ];

  const dispatchContext = {
    setState: onSetState,
    setEmotion: onSetEmotion,
    setActivity: (act: RobotActivity) => onSetActivity?.(act),
  };

  const handleSelectEmotion = (em: RobotEmotion) => {
    onSetEmotion(em);
    emotionEngine.setEmotion(em, intensity);
  };

  const handleExecuteAction = (actionName: RobotActionName) => {
    actionManager.executeAction(actionName, {
      setState: onSetState,
      setEmotion: onSetEmotion,
    });
  };

  const handleStartActivity = (act: RobotActivity) => {
    activityManager.startActivity(act, dispatchContext);
  };

  return (
    <div className="space-y-6">
      {/* High-Level Behavior Flow Architecture Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              TARA Behavior & Action Architecture
            </h3>
          </div>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800/60">
            Decoupled Modular Pipeline
          </span>
        </div>

        {/* Pipeline Diagram */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            User Input (Voice / Sim)
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span>
            Brain (LLM Intent)
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-cyan-500/50 text-cyan-300 font-bold shadow-sm shadow-cyan-500/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            BehaviorManager
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-amber-500/50 text-amber-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            ActionManager
          </div>
          <span className="text-slate-600">→</span>
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-emerald-500/50 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Face + Voice + Arms + Audio
          </div>
        </div>
      </div>

      {/* 14 Emotion Engine Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                14-Emotion Engine Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Parametric facial expressions, eye shapes, pupil dilation, mouth curves, and voice modulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">Intensity:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-24 accent-pink-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-xs font-mono text-pink-400 w-8 text-right font-bold">
              {Math.round(intensity * 100)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {all14Emotions.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => handleSelectEmotion(em)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                emotion === em
                  ? 'bg-pink-600/30 border-pink-500 text-white shadow-md shadow-pink-500/20'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white'
              }`}
            >
              <div className="text-xs font-bold font-mono truncate">{em}</div>
              <div className="text-[10px] text-slate-400 mt-1 capitalize truncate">
                {emotionEngine.getProfile(em).eyeShape.replace('_', ' ')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Hardware Simulation Subsystems Grid: Arms, Presence, Music */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ArmVisualizer />
        <PresenceRadar />
      </div>

      <MusicPlayerDeck />

      {/* ActionTimeline & Modular Actions Studio */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                ActionManager & ActionTimeline Studio
              </h3>
              <p className="text-xs text-slate-400">
                Modular time-stamped multi-subsystem choreography with conflict prevention
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleExecuteAction(selectedActionPreview)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Execute {selectedActionPreview}</span>
          </button>
        </div>

        {/* Action Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {(Object.keys(ActionManager.TIMELINES) as RobotActionName[]).map((actName) => (
            <button
              key={actName}
              type="button"
              onClick={() => setSelectedActionPreview(actName)}
              className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                selectedActionPreview === actName
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {actName}
            </button>
          ))}
        </div>

        {/* Timeline Steps Preview */}
        {ActionManager.TIMELINES[selectedActionPreview] && (
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3 pb-2 border-b border-slate-800">
              <span>Total Duration: <strong>{ActionManager.TIMELINES[selectedActionPreview].durationMs}ms</strong></span>
              <span>Subsystems: Face, Voice, Arms, Audio</span>
            </div>
            <div className="space-y-2">
              {ActionManager.TIMELINES[selectedActionPreview].steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 text-xs font-mono p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  <span className="w-16 text-amber-400 font-bold">+{step.offsetMs}ms</span>
                  <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-cyan-300 border border-slate-700 w-16 text-center">
                    {step.subsystem}
                  </span>
                  <span className="text-white font-semibold">{step.action}:</span>
                  <span className="text-slate-400 truncate flex-1">
                    {typeof step.payload === 'string' ? step.payload : JSON.stringify(step.payload)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Autonomy Manager Settings */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Natural Autonomy & Idle Behavior
              </h3>
              <p className="text-xs text-slate-400">
                Spontaneous companion behaviors, glance animations, stretch gestures, and quiet hours
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-mono text-slate-300">Autonomy Active:</span>
            <input
              type="checkbox"
              checked={autonomyConfig.enabled}
              onChange={(e) => {
                const updated = { ...autonomyConfig, enabled: e.target.checked };
                setAutonomyConfig(updated);
                autonomyManager.updateConfig(updated);
              }}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-xs font-semibold text-white mb-1">Idle Behavior Interval</div>
            <p className="text-[11px] text-slate-400 mb-2">How often TARA performs harmless micro-behaviors</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="15"
                max="120"
                step="5"
                value={autonomyConfig.idleFrequencySeconds}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...autonomyConfig, idleFrequencySeconds: val };
                  setAutonomyConfig(updated);
                  autonomyManager.updateConfig(updated);
                }}
                className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-emerald-400 font-bold w-12 text-right">
                {autonomyConfig.idleFrequencySeconds}s
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-xs font-semibold text-white mb-1">Greeting Cooldown</div>
            <p className="text-[11px] text-slate-400 mb-2">Minimum delay between repeated autonomous greetings</p>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={autonomyConfig.greetingCooldownMinutes}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const updated = { ...autonomyConfig, greetingCooldownMinutes: val };
                  setAutonomyConfig(updated);
                  autonomyManager.updateConfig(updated);
                }}
                className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-emerald-400 font-bold w-12 text-right">
                {autonomyConfig.greetingCooldownMinutes}m
              </span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
            <div className="text-xs font-semibold text-white mb-1">Voice & Quiet Hours</div>
            <p className="text-[11px] text-slate-400 mb-2">Prevent spoken idle chatter during rest periods</p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">Spoken Thoughts:</span>
              <input
                type="checkbox"
                checked={autonomyConfig.voiceEnabled}
                onChange={(e) => {
                  const updated = { ...autonomyConfig, voiceEnabled: e.target.checked };
                  setAutonomyConfig(updated);
                  autonomyManager.updateConfig(updated);
                }}
                className="accent-emerald-500 w-4 h-4 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Implementation & Hardware Readiness Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-800">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Architecture Readiness & Hardware Requirements Matrix
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">Subsystem</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Standard ESP32 Role</th>
                <th className="py-2 px-3">Physical Hardware Requirement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">FaceEngine (14 Emotions)</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">IMPLEMENTED</span></td>
                <td className="py-2.5 px-3">I2C SSD1306 / SH1106 OLED 128x64</td>
                <td className="py-2.5 px-3">OLED display via GPIO 21 (SDA), 22 (SCL)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">ActionManager & Timelines</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">IMPLEMENTED</span></td>
                <td className="py-2.5 px-3">Non-blocking timed event dispatcher</td>
                <td className="py-2.5 px-3">None (runs on core Xtensa LX6 firmware)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Dual-Servo ArmController</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">HARDWARE-REQUIRED</span></td>
                <td className="py-2.5 px-3">LEDC PWM Servo Driver (50Hz)</td>
                <td className="py-2.5 px-3">Optional SG90/MG90S servos on GPIO 18, 19</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">PresenceManager (Radar/PIR)</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">HARDWARE-REQUIRED</span></td>
                <td className="py-2.5 px-3">GPIO Digital Interrupt or I2C ToF</td>
                <td className="py-2.5 px-3">HC-SR501 PIR, HC-SR04, or VL53L0X ToF</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">Voice Pipeline & Chunking</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">IMPLEMENTED</span></td>
                <td className="py-2.5 px-3">I2S DAC / MAX98357A & INMP441</td>
                <td className="py-2.5 px-3">I2S mic & speaker (or Web Audio in simulation)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-white">MusicController Abstraction</td>
                <td className="py-2.5 px-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">IMPLEMENTED</span></td>
                <td className="py-2.5 px-3">Synthesizer / Tone buzzer / Cloud relay</td>
                <td className="py-2.5 px-3">Speaker / I2S or phone audio bridge</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
