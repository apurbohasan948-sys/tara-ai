/**
 * PresenceRadar.tsx
 * Simulated 24GHz mmWave Human Radar / PIR Distance Sensing Widget
 */

import React, { useEffect, useState } from 'react';
import { Radio, Users, Eye, Sliders } from 'lucide-react';
import { presenceManager } from '../services/PresenceManager';
import { PresenceState } from '../types';

export const PresenceRadar: React.FC = () => {
  const [presence, setPresence] = useState<PresenceState>(presenceManager.getState());

  useEffect(() => {
    const unsub = presenceManager.subscribe((st) => setPresence(st));
    return () => unsub();
  }, []);

  const handleDistanceChange = (dist: number) => {
    presenceManager.setPresence(dist <= 150, dist, dist <= 150 ? 0.7 : 0.0);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Human Presence Detection (mmWave / PIR)
            </h3>
            <p className="text-xs text-slate-400">
              Auto-wakes TARA from deep sleep when someone approaches the desk
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-mono font-semibold flex items-center gap-1.5 ${
              presence.detected
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                presence.detected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            {presence.detected ? 'HUMAN DETECTED' : 'ZONE EMPTY'}
          </span>
        </div>
      </div>

      {/* Radar Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Radar Graphic Canvas */}
        <div className="relative h-44 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Radar Circles */}
          <div className="absolute w-36 h-36 rounded-full border border-cyan-500/20" />
          <div className="absolute w-24 h-24 rounded-full border border-cyan-500/30" />
          <div className="absolute w-12 h-12 rounded-full border border-cyan-500/40" />

          {/* Sweep Hand */}
          <div className="absolute w-20 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 origin-left animate-spin" />

          {/* Target Blip */}
          {presence.detected && (
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-ping"
              style={{
                top: `${45 - (presence.distanceCm / 150) * 25}%`,
                left: `${50 + ((presence.distanceCm % 40) - 20)}%`,
              }}
            />
          )}

          {/* Center Sensor */}
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] z-10" />
          <span className="absolute bottom-2 text-[10px] font-mono text-slate-500">
            TARA 24GHz RADAR FOV: 120°
          </span>
        </div>

        {/* Distance Controls & Status */}
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center text-slate-300">
            <span className="font-semibold">Simulated Distance:</span>
            <span className="font-mono text-cyan-300 font-bold">{presence.distanceCm} cm</span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            value={presence.distanceCm}
            onChange={(e) => handleDistanceChange(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
          />

          <div className="flex gap-2">
            <button
              onClick={() => handleDistanceChange(40)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex-1 font-mono"
            >
              Near (40cm)
            </button>
            <button
              onClick={() => handleDistanceChange(90)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex-1 font-mono"
            >
              Mid (90cm)
            </button>
            <button
              onClick={() => handleDistanceChange(180)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 flex-1 font-mono"
            >
              Away (180cm)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
