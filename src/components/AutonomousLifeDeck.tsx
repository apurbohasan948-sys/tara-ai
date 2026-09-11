/**
 * AutonomousLifeDeck.tsx
 * Complete UI Dashboard, Telemetry & Simulation Control Deck
 * for TARA's Autonomous Life System.
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Gamepad2,
  Heart,
  History,
  Info,
  Mic,
  Moon,
  Music,
  Pause,
  Play,
  Radio,
  RefreshCw,
  Settings,
  Shield,
  Sliders,
  Sparkles,
  StopCircle,
  Tv,
  User,
  Volume2,
  Zap,
} from 'lucide-react';
import { autonomousLifeManager } from '../services/autonomous/AutonomousLifeManager';
import {
  ActivityHistoryItem,
  AutonomousLifeConfig,
  AutonomousPriority,
  AutonomousStatus,
  TaraActivity,
} from '../types';

export const AutonomousLifeDeck: React.FC = () => {
  const [status, setStatus] = useState<AutonomousStatus>(autonomousLifeManager.getStatus());
  const [config, setConfig] = useState<AutonomousLifeConfig>(autonomousLifeManager.getConfig());
  const [history, setHistory] = useState<ActivityHistoryItem[]>(
    autonomousLifeManager.History.getRecent(15)
  );
  const [cooldowns, setCooldowns] = useState(
    autonomousLifeManager.CooldownManager.getAllCooldownStatuses()
  );

  useEffect(() => {
    const unsubLife = autonomousLifeManager.subscribe(() => {
      setStatus(autonomousLifeManager.getStatus());
      setConfig(autonomousLifeManager.getConfig());
      setCooldowns(autonomousLifeManager.CooldownManager.getAllCooldownStatuses());
    });

    const unsubHistory = autonomousLifeManager.History.subscribe(() => {
      setHistory(autonomousLifeManager.History.getRecent(15));
    });

    // Local tick for smooth countdown updates
    const interval = setInterval(() => {
      setStatus(autonomousLifeManager.getStatus());
      setCooldowns(autonomousLifeManager.CooldownManager.getAllCooldownStatuses());
    }, 500);

    return () => {
      unsubLife();
      unsubHistory();
      clearInterval(interval);
    };
  }, []);

  const handleConfigChange = (updates: Partial<AutonomousLifeConfig>) => {
    autonomousLifeManager.saveConfig(updates);
    setConfig(autonomousLifeManager.getConfig());
  };

  const getPriorityBadge = (priority: AutonomousPriority) => {
    switch (priority) {
      case 'SYSTEM_ERROR':
        return { label: 'SYSTEM ERROR', color: 'bg-red-500/20 text-red-300 border-red-500/40' };
      case 'USER_INTERACTION':
        return { label: 'USER INTERACTION (HIGHEST)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'LISTENING':
        return { label: 'LISTENING', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'USER_RESPONSE':
        return { label: 'USER RESPONSE', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'USER_REQUESTED_ACTIVITY':
        return { label: 'USER REQUESTED ACTIVITY', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'AUTONOMOUS_ACTIVITY':
        return { label: 'AUTONOMOUS ACTIVITY', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'REST_IDLE':
      default:
        return { label: 'REST / IDLE FALLBACK', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  const badge = getPriorityBadge(status.currentPriority);

  return (
    <div className="space-y-6">
      {/* Header Banner with Autonomous Life Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-3 rounded-xl border ${config.enabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-100">TARA Autonomous Life Engine</h2>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${config.enabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                {config.enabled ? 'AUTONOMOUS ACTIVE' : 'PAUSED'}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-mono font-bold rounded-full border ${badge.color}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Independent companion behaviors, natural timing loops, personality-driven decision engine, and instant user priority.
            </p>
          </div>
        </div>

        {/* Global Autonomous Master Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleConfigChange({ enabled: !config.enabled })}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 ${
              config.enabled
                ? 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
                : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30'
            }`}
          >
            {config.enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {config.enabled ? 'Disable Autonomous Mode' : 'Enable Autonomous Mode'}
          </button>
        </div>
      </div>

      {/* Grid: Live Execution State + Next Candidate Decision */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Execution State */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Current Activity
              </span>
              <span className={`px-2 py-0.5 text-[11px] font-mono rounded-full ${status.executionState === 'RUNNING' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                {status.executionState}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold">
                {status.currentActivity === 'READING' && <BookOpen className="w-6 h-6" />}
                {status.currentActivity === 'COOKING' && <Flame className="w-6 h-6 text-amber-400" />}
                {status.currentActivity === 'SINGING' && <Mic className="w-6 h-6 text-pink-400" />}
                {status.currentActivity === 'MUSIC' && <Music className="w-6 h-6 text-indigo-400" />}
                {status.currentActivity === 'GAMING' && <Gamepad2 className="w-6 h-6 text-emerald-400" />}
                {status.currentActivity === 'SLEEPING' && <Moon className="w-6 h-6 text-blue-400" />}
                {status.currentActivity === 'THINKING' && <Sparkles className="w-6 h-6 text-purple-400" />}
                {status.currentActivity === 'OBSERVING' && <Compass className="w-6 h-6 text-teal-400" />}
                {status.currentActivity === 'CHECKING_TIME' && <Clock className="w-6 h-6 text-amber-300" />}
                {status.currentActivity === 'IDLE' && <Activity className="w-6 h-6 text-slate-400" />}
                {!['READING', 'COOKING', 'SINGING', 'MUSIC', 'GAMING', 'SLEEPING', 'THINKING', 'OBSERVING', 'CHECKING_TIME', 'IDLE'].includes(status.currentActivity) && (
                  <Sparkles className="w-6 h-6 text-cyan-400" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100 font-mono">{status.currentActivity}</h3>
                <p className="text-xs text-slate-400">
                  Previous: <span className="text-slate-300 font-mono">{status.previousActivity}</span>
                </p>
              </div>
            </div>

            {/* Progress Bar & Timers */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Duration: {status.activityDurationSec}s</span>
                <span>Remaining: {status.remainingDurationSec}s</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      (status.activityDurationSec /
                        Math.max(1, status.activityDurationSec + status.remainingDurationSec)) *
                        100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-mono block">Selection Reason:</span>
              <p className="text-cyan-300 font-medium mt-0.5">{status.selectionReason || 'Autonomous rest/idle state'}</p>
            </div>
          </div>

          <button
            onClick={() => autonomousLifeManager.stopActivity()}
            disabled={status.currentActivity === 'IDLE'}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <StopCircle className="w-4 h-4 text-red-400" />
            Stop Current Activity
          </button>
        </div>

        {/* Card 2: Next Candidate Decision Deck */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Autonomous Selector Engine
              </span>
              <span className="px-2 py-0.5 text-[11px] font-mono rounded-full bg-purple-500/20 text-purple-300">
                Asia/Dhaka Aware
              </span>
            </div>

            <div className="mt-3">
              <div className="text-xs text-slate-400 mb-1">Upcoming Candidate:</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-purple-300 font-mono">
                  {status.nextCandidate ? status.nextCandidate.activity : 'EVALUATING...'}
                </span>
                {status.nextCandidate && (
                  <span className="px-2 py-0.5 text-xs rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-mono">
                    Score: {status.nextCandidate.score}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Candidate rationale:{' '}
                <span className="text-slate-300">{status.nextCandidate?.reason || 'Continuous evaluation'}</span>
              </p>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Time In Idle:</span>
                <span className="font-mono text-cyan-300 font-bold">{status.idleDurationSec}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Mood:</span>
                <span className="font-mono text-amber-300 font-semibold">{status.personalityMood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Human Detected:</span>
                <span className="font-mono text-emerald-300 font-semibold">
                  {status.userPresent ? 'Yes (Present)' : 'No (Solitary)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last User Touch:</span>
                <span className="font-mono text-slate-300">{status.lastUserInteractionSecAgo}s ago</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => autonomousLifeManager.simulateUserInteraction()}
              className="flex-1 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition-all flex items-center justify-center gap-1.5"
            >
              <User className="w-3.5 h-3.5" />
              Simulate User (Interrupt)
            </button>
            <button
              onClick={() => autonomousLifeManager.simulatePresence(!status.userPresent)}
              className="py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold border border-cyan-500/40 transition-all flex items-center justify-center gap-1"
            >
              <Radio className="w-3.5 h-3.5" />
              Toggle Radar
            </button>
          </div>
        </div>

        {/* Card 3: Priority Hierarchy Visualizer */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
                Strict Priority Hierarchy
              </span>
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Autonomous tasks instantly yield whenever a user interacts.
            </p>

            <div className="mt-3 space-y-1.5 text-xs font-mono">
              {[
                { p: 'SYSTEM_ERROR', label: '1. SYSTEM ERROR' },
                { p: 'USER_INTERACTION', label: '2. USER INTERACTION' },
                { p: 'LISTENING', label: '3. LISTENING' },
                { p: 'USER_RESPONSE', label: '4. USER RESPONSE' },
                { p: 'USER_REQUESTED_ACTIVITY', label: '5. USER REQUESTED ACTIVITY' },
                { p: 'AUTONOMOUS_ACTIVITY', label: '6. AUTONOMOUS ACTIVITY' },
                { p: 'REST_IDLE', label: '7. REST / IDLE' },
              ].map((item) => {
                const isCurrent = status.currentPriority === item.p;
                return (
                  <div
                    key={item.p}
                    className={`px-3 py-1.5 rounded-lg border transition-all flex items-center justify-between ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold shadow-sm'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isCurrent && <span className="text-[10px] bg-cyan-400 text-slate-950 px-1.5 py-0.2 rounded font-bold">CURRENT</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Force Controls (Requirement 22) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Simulation Mode: Force Autonomous Activities
            </h3>
          </div>
          <span className="text-xs text-slate-400">Instantly test transition, visuals & props</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {[
            { act: 'READING' as TaraActivity, label: 'Force Reading', icon: BookOpen },
            { act: 'COOKING' as TaraActivity, label: 'Force Cooking', icon: Flame },
            { act: 'SINGING' as TaraActivity, label: 'Force Singing', icon: Mic },
            { act: 'MUSIC' as TaraActivity, label: 'Force Music', icon: Music },
            { act: 'THINKING' as TaraActivity, label: 'Force Thinking', icon: Sparkles },
            { act: 'GAMING' as TaraActivity, label: 'Force Gaming', icon: Gamepad2 },
            { act: 'OBSERVING' as TaraActivity, label: 'Force Observing', icon: Compass },
            { act: 'RELAXING' as TaraActivity, label: 'Force Relaxing', icon: Heart },
            { act: 'DANCING' as TaraActivity, label: 'Force Dancing', icon: Activity },
            { act: 'LEARNING' as TaraActivity, label: 'Force Learning', icon: Zap },
            { act: 'CHECKING_TIME' as TaraActivity, label: 'Force Check Time', icon: Clock },
            { act: 'SLEEPING' as TaraActivity, label: 'Force Sleeping', icon: Moon },
          ].map((btn) => {
            const Icon = btn.icon;
            const isCurrent = status.currentActivity === btn.act;
            return (
              <button
                key={btn.act}
                onClick={() => autonomousLifeManager.forceActivity(btn.act, 35)}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center">{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Cooldown Monitor & Config Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Cooldown Monitor */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                Activity Cooldown Monitor
              </h3>
            </div>
            <button
              onClick={() => autonomousLifeManager.CooldownManager.reset()}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
            >
              <RefreshCw className="w-3 h-3" /> Reset Cooldowns
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            {cooldowns.map((cd) => (
              <div
                key={cd.activity}
                className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                  cd.onCooldown
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
                }`}
              >
                <span className="font-mono font-medium truncate">{cd.activity}</span>
                <span className="text-[11px] font-mono mt-1">
                  {cd.onCooldown ? `Cooldown: ${cd.remainingSec}s` : 'Ready'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AutonomousLifeConfig Settings */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
                Autonomous Timing & Rules Config
              </h3>
            </div>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
                <span>Idle Wait Range:</span>
                <span>{config.minIdleTime}s - {config.maxIdleTime}s</span>
              </div>
              <input
                type="range"
                min="5"
                max="90"
                value={config.minIdleTime}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  handleConfigChange({ minIdleTime: val, maxIdleTime: Math.max(val + 10, config.maxIdleTime) });
                }}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-300 font-mono mb-1">
                <span>Activity Duration Range:</span>
                <span>{config.minActivityDuration}s - {config.maxActivityDuration}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                value={config.maxActivityDuration}
                onChange={(e) => handleConfigChange({ maxActivityDuration: Number(e.target.value) })}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Sleep Schedule Start</label>
                <input
                  type="time"
                  value={config.sleepStart}
                  onChange={(e) => handleConfigChange({ sleepStart: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Sleep Schedule End</label>
                <input
                  type="time"
                  value={config.sleepEnd}
                  onChange={(e) => handleConfigChange({ sleepEnd: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="block text-slate-400 mb-2">Allowed Activities:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'allowReading' as const, label: 'Reading' },
                  { key: 'allowMusic' as const, label: 'Music' },
                  { key: 'allowSinging' as const, label: 'Singing' },
                  { key: 'allowCooking' as const, label: 'Cooking' },
                  { key: 'allowGames' as const, label: 'Games' },
                  { key: 'allowDancing' as const, label: 'Dancing' },
                  { key: 'allowThinking' as const, label: 'Thinking' },
                  { key: 'allowObserving' as const, label: 'Observing' },
                  { key: 'allowRelaxing' as const, label: 'Relaxing' },
                  { key: 'allowLearning' as const, label: 'Learning' },
                ].map((act) => (
                  <label key={act.key} className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={config[act.key]}
                      onChange={(e) => handleConfigChange({ [act.key]: e.target.checked })}
                      className="rounded accent-cyan-400"
                    />
                    <span>{act.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity History Log (Requirement 20) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              Autonomous Activity History (Recent 15)
            </h3>
          </div>
          <button
            onClick={() => autonomousLifeManager.History.clear()}
            className="text-xs text-slate-400 hover:text-slate-200 font-mono"
          >
            Clear Log
          </button>
        </div>

        {history.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl">
            No autonomous activities logged yet. TARA will naturally populate this as it lives!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-2">Activity</th>
                  <th className="pb-2">Start Time</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Mood</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="text-slate-300">
                    <td className="py-2.5 font-bold text-cyan-300">{item.activity}</td>
                    <td className="py-2.5 text-slate-400">{new Date(item.startTime).toLocaleTimeString()}</td>
                    <td className="py-2.5">{item.durationSec}s</td>
                    <td className="py-2.5 text-amber-300">{item.personalityState}</td>
                    <td className="py-2.5 text-slate-400 max-w-xs truncate">{item.reason}</td>
                    <td className="py-2.5">
                      {item.interrupted ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                          Interrupted ({item.interruptedBy || 'user'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">
                          Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
