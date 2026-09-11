import React, { useEffect, useState } from 'react';
import { ArmState, ArmGesture } from '../types';
import { armController } from '../services/ArmController';
import { ShieldCheck, Cpu } from 'lucide-react';

export const ArmVisualizer: React.FC = () => {
  const [armState, setArmState] = useState<ArmState>(armController.getState());

  useEffect(() => {
    return armController.subscribe((s) => setArmState(s));
  }, []);

  const triggerGesture = (gesture: ArmGesture) => {
    armController.executeGesture(gesture);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Dual-Servo Arm & Hand Subsystem
          </h4>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
            <ShieldCheck className="w-3 h-3" /> Safe Limits (-80°..+90°)
          </span>
          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {armState.hardwareAttached ? 'Hardware Attached' : 'Detached (No Errors)'}
          </span>
        </div>
      </div>

      {/* Arm Schematic Visualizer */}
      <div className="relative h-28 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden mb-3">
        {/* Robot Torso Center */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center p-2 shadow-inner">
          <Cpu className="w-5 h-5 text-cyan-400 mb-1" />
          <span className="text-[9px] font-mono text-slate-300 font-bold">TORSO</span>
          <span className="text-[8px] font-mono text-cyan-400">{armState.activeGesture}</span>
        </div>

        {/* Left Arm Servo Linkage */}
        <div className="absolute left-[calc(50%-75px)] top-1/2 -translate-y-1/2 flex items-center">
          {/* Shoulder Servo Joint */}
          <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950 shadow-md"></div>
          {/* Arm Beam rotated by angle */}
          <div
            className="w-14 h-3 bg-gradient-to-l from-slate-600 to-cyan-600 rounded-full origin-right transition-transform duration-200 shadow"
            style={{
              transform: `rotate(${-armState.leftAngle}deg)`,
            }}
          >
            {/* Hand */}
            <div className="absolute left-0 -top-1 w-3 h-5 bg-cyan-400 rounded-sm shadow-sm flex items-center justify-center text-[7px] text-slate-950 font-bold">
              {armState.leftHand === 'OPEN' ? '✋' : armState.leftHand === 'FIST' ? '✊' : '☝'}
            </div>
          </div>
        </div>

        {/* Right Arm Servo Linkage */}
        <div className="absolute right-[calc(50%-75px)] top-1/2 -translate-y-1/2 flex items-center flex-row-reverse">
          {/* Shoulder Servo Joint */}
          <div className="w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950 shadow-md"></div>
          {/* Arm Beam rotated by angle */}
          <div
            className="w-14 h-3 bg-gradient-to-r from-slate-600 to-cyan-600 rounded-full origin-left transition-transform duration-200 shadow"
            style={{
              transform: `rotate(${armState.rightAngle}deg)`,
            }}
          >
            {/* Hand */}
            <div className="absolute right-0 -top-1 w-3 h-5 bg-cyan-400 rounded-sm shadow-sm flex items-center justify-center text-[7px] text-slate-950 font-bold">
              {armState.rightHand === 'OPEN' ? '✋' : armState.rightHand === 'THUMBS_UP' ? '👍' : '☝'}
            </div>
          </div>
        </div>

        {/* Live Angles Badge */}
        <div className="absolute bottom-1.5 left-2 text-[10px] font-mono text-slate-400">
          Left: <span className="text-cyan-400 font-bold">{Math.round(armState.leftAngle)}°</span>
        </div>
        <div className="absolute bottom-1.5 right-2 text-[10px] font-mono text-slate-400">
          Right: <span className="text-cyan-400 font-bold">{Math.round(armState.rightAngle)}°</span>
        </div>
      </div>

      {/* Quick Arm Gestures */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(['WAVE', 'POINT', 'THUMBS_UP', 'HAPPY_MOVE', 'COOKING', 'SINGING', 'IDLE'] as ArmGesture[]).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => triggerGesture(g)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
              armState.activeGesture === g
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm shadow-cyan-500/30'
                : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-750 hover:text-white'
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
};
