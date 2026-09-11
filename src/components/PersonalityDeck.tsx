/**
 * PersonalityDeck.tsx
 * TARA Personality, Mood, Shy Behavior, Memory, NTP Time, and Action Monitor.
 */

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Heart,
  Brain,
  Clock,
  Search,
  Activity,
  ShieldCheck,
  RotateCcw,
  Play,
  Volume2,
  Sliders,
  CheckCircle2,
  Smile,
  Zap,
  Info,
} from 'lucide-react';
import { personalityEngine } from '../services/PersonalityEngine';
import { personalityMemory } from '../services/PersonalityMemory';
import { actionManager } from '../services/ActionManager';
import { timeManager } from '../services/TimeManager';
import { informationSearchManager } from '../services/InformationSearchManager';
import {
  CompanionAction,
  PersonalityMemoryItem,
  SearchResult,
  TaraMood,
  TaraPersonalityTraits,
} from '../types';

export const PersonalityDeck: React.FC = () => {
  const [traits, setTraits] = useState<TaraPersonalityTraits>(personalityEngine.getTraits());
  const [mood, setMood] = useState<TaraMood>(personalityEngine.getMood());
  const [isShyActive, setIsShyActive] = useState<boolean>(personalityEngine.getIsShyActive());
  const [shyStage, setShyStage] = useState(personalityEngine.getShyStage());
  const [memories, setMemories] = useState<PersonalityMemoryItem[]>(personalityMemory.getAllItems());
  const [complimentCount, setComplimentCount] = useState(personalityMemory.getComplimentCount());
  const [interactionCount, setInteractionCount] = useState(personalityMemory.getInteractionCount());
  const [currentAction, setCurrentAction] = useState<CompanionAction | null>(actionManager.getCurrentAction());
  const [actionHistory, setActionHistory] = useState<CompanionAction[]>(actionManager.getActionHistory());
  const [formattedTime, setFormattedTime] = useState(timeManager.getFormattedTime());
  const [formattedDate, setFormattedDate] = useState(timeManager.getFormattedDate());
  const [timeConfig, setTimeConfig] = useState(timeManager.getConfig());
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>(informationSearchManager.getRecentSearches());
  const [syncingNtp, setSyncingNtp] = useState(false);
  const [ntpLatency, setNtpLatency] = useState<number | null>(null);

  useEffect(() => {
    const unsubP = personalityEngine.subscribe(() => {
      setTraits(personalityEngine.getTraits());
      setMood(personalityEngine.getMood());
      setIsShyActive(personalityEngine.getIsShyActive());
      setShyStage(personalityEngine.getShyStage());
    });

    const unsubM = personalityMemory.subscribe(() => {
      setMemories(personalityMemory.getAllItems());
      setComplimentCount(personalityMemory.getComplimentCount());
      setInteractionCount(personalityMemory.getInteractionCount());
    });

    const unsubA = actionManager.subscribe(() => {
      setCurrentAction(actionManager.getCurrentAction());
      setActionHistory(actionManager.getActionHistory());
    });

    const unsubT = timeManager.subscribe(() => {
      setFormattedTime(timeManager.getFormattedTime());
      setFormattedDate(timeManager.getFormattedDate());
      setTimeConfig(timeManager.getConfig());
    });

    const unsubS = informationSearchManager.subscribe(() => {
      setRecentSearches(informationSearchManager.getRecentSearches());
    });

    const timer = setInterval(() => {
      setFormattedTime(timeManager.getFormattedTime());
    }, 1000);

    return () => {
      unsubP();
      unsubM();
      unsubA();
      unsubT();
      unsubS();
      clearInterval(timer);
    };
  }, []);

  const handleTriggerShy = () => {
    actionManager.triggerShySequence("You are so cute and smart, TARA!");
  };

  const handleSyncNtp = async () => {
    setSyncingNtp(true);
    const res = await timeManager.syncNTP();
    setSyncingNtp(false);
    setNtpLatency(res.latencyMs);
  };

  const moodsList: TaraMood[] = [
    'cheerful',
    'playful',
    'curious',
    'shy',
    'thoughtful',
    'mischievous',
    'excited',
    'caring',
    'sleepy',
    'focused',
    'clumsy',
  ];

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner: Real Personality & Shy Behavior Engine */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/40">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-white">TARA Personality Engine & Behavior System</h2>
          </div>
          <p className="mt-1 text-xs text-slate-300 max-w-2xl leading-relaxed">
            Autonomous companion personality driving emotional valence, speech style, and expressive reactions.
            Features dedicated <strong>Shy Behavior System</strong> (averted glance, eyelid flutter, deep blush & bashful voice)
            with strictly fixed chassis and zero head/whole-face displacement.
          </p>
        </div>

        <button
          onClick={handleTriggerShy}
          disabled={isShyActive}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
            isShyActive
              ? 'bg-pink-600/30 text-pink-300 border border-pink-500/50 cursor-wait animate-pulse'
              : 'bg-pink-600 hover:bg-pink-500 text-white shadow-lg shadow-pink-900/40 hover:scale-105 active:scale-95'
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
          <span>{isShyActive ? `Shy: ${shyStage}` : 'Trigger Shy Reaction'}</span>
        </button>
      </div>

      {/* Grid: Personality Traits & Mood State */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traits Column */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Core Personality Traits</h3>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
              11 Baseline Traits
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            {Object.entries(traits).map(([key, value]) => {
              const label = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
              return (
                <div key={key} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-sans font-medium">{label}</span>
                    <span className="text-cyan-400 font-bold">{value}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={value}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      personalityEngine.updateTraits({ [key]: val } as any);
                    }}
                    className="accent-cyan-400 w-full h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Mood & Shy Behavior Status */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Smile className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold text-white">Dynamic Mood State</h3>
            </div>
            <span className="text-[11px] font-mono text-pink-400 uppercase bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/30">
              {mood}
            </span>
          </div>

          {/* Mood Selectors */}
          <div className="grid grid-cols-2 gap-2 text-xs font-sans">
            {moodsList.map((m) => (
              <button
                key={m}
                onClick={() => personalityEngine.setMood(m)}
                className={`px-3 py-2 rounded-xl text-left font-medium transition-all capitalize ${
                  mood === m
                    ? 'bg-pink-600 text-white font-bold shadow-sm shadow-pink-900/40'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Shy Behavior Sequence Diagnostics */}
          <div className="mt-2 p-3.5 rounded-xl bg-slate-950 border border-pink-500/30 flex flex-col gap-2 text-xs font-mono">
            <div className="text-pink-300 font-bold flex items-center justify-between">
              <span>SHY REACTION MONITOR</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300">
                {isShyActive ? 'ACTIVE' : 'IDLE'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Current Stage: <strong className="text-pink-400">{shyStage}</strong>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero-Head Movement Compliant: Pure ocular & blush rendering.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: Personality Memory & NTP Time & Unified Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personality Memory Inspector */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Personality Memory</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Anti-Secret Guard
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <div>
              <div className="text-slate-400">Compliments Received</div>
              <div className="text-base font-bold text-pink-400">{complimentCount}</div>
            </div>
            <div>
              <div className="text-slate-400">Total Interactions</div>
              <div className="text-base font-bold text-cyan-400">{interactionCount}</div>
            </div>
            <div>
              <div className="text-slate-400">Secrets Filter</div>
              <div className="text-emerald-400 font-bold">100% SANITIZED</div>
            </div>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {memories.map((m) => (
              <div
                key={m.id}
                className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-sans flex flex-col gap-0.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="uppercase text-purple-400">{m.category}</span>
                  <span>{m.key}</span>
                </div>
                <div className="text-slate-200 font-medium text-xs">{m.value}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => personalityMemory.clearAllMemories()}
            className="text-xs text-slate-400 hover:text-rose-400 transition-colors self-end"
          >
            Reset Memory Cache
          </button>
        </div>

        {/* TimeManager & NTP Synchronization */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">NTP Time & Clock</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              {timeConfig.ntpServer}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
            <div className="text-2xl font-mono font-bold text-cyan-300 tracking-wider">
              {formattedTime}
            </div>
            <div className="text-xs text-slate-400 mt-1">{formattedDate}</div>
            <div className="text-[11px] font-mono text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>NTP Synchronized ({timeConfig.timezone})</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleSyncNtp}
              disabled={syncingNtp}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${syncingNtp ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{syncingNtp ? 'Syncing...' : 'Sync NTP Now'}</span>
            </button>
            {ntpLatency && (
              <span className="text-[11px] font-mono text-slate-400">
                Latency: <strong className="text-cyan-400">{ntpLatency}ms</strong>
              </span>
            )}
          </div>

          {/* Active Timers */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="text-slate-400 text-[11px]">ACTIVE TIMERS ({timeConfig.activeTimers.length})</div>
            {timeConfig.activeTimers.length === 0 ? (
              <div className="text-slate-500 italic text-[11px]">No active timers. Ask "Set a timer for 1 minute" in chat.</div>
            ) : (
              timeConfig.activeTimers.map((t) => (
                <div key={t.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">{t.label}</span>
                  <span className="text-cyan-400 font-bold">{t.remainingSec}s</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unified Action Architecture Status */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Unified Action Architecture</h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Verified Tracker
            </span>
          </div>

          {/* Current Active Action */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">CURRENT ACTION:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentAction ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400'
              }`}>
                {currentAction ? currentAction.status : 'IDLE'}
              </span>
            </div>
            <div className="text-sm font-bold text-white">
              {currentAction ? currentAction.name : 'No active action'}
            </div>
            {currentAction && (
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full transition-all duration-300" style={{ width: `${currentAction.progress}%` }} />
                </div>
                <div className="text-[10px] font-mono text-slate-400">{currentAction.summary}</div>
              </div>
            )}
          </div>

          {/* Action History Log */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div className="text-[11px] font-mono text-slate-400">RECENT DISPATCH LOG ({actionHistory.length})</div>
            {actionHistory.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-mono flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <div className="text-slate-200 font-sans font-medium text-xs truncate">{a.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{a.summary}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${
                  a.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
