/**
 * OledSimulator.tsx
 * Stable Desktop Companion OLED Display Hardware Frame.
 *
 * GUARANTEED DESIGN:
 * - Outer face chassis and canvas position REMAIN FIXED AT ALL TIMES.
 * - Zero head rotation, zero tilting, zero whole-body shaking.
 * - Layered procedural rendering on standard OLED aspect ratio.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  Tv,
  Palette,
  Sliders,
  CheckCircle2,
  Activity,
  Shield,
  Layers,
} from 'lucide-react';
import { faceEngine, FaceEngineOptions } from '../services/FaceEngine';
import { animationCoordinator } from '../services/AnimationCoordinator';

export const OledSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [palette, setPalette] = useState<FaceEngineOptions['palette']>('cyan');
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showArms, setShowArms] = useState<boolean>(true);
  const [fps, setFps] = useState<number>(30);
  const [scale, setScale] = useState<number>(1.75); // zoom scale

  useEffect(() => {
    if (canvasRef.current) {
      faceEngine.attach(canvasRef.current, {
        width: 320,
        height: 160,
        palette,
        showScanlines,
        showArms,
      });
    }

    return () => {
      faceEngine.stop();
    };
  }, []);

  useEffect(() => {
    faceEngine.setOptions({
      palette,
      showScanlines,
      showArms,
    });
  }, [palette, showScanlines, showArms]);

  return (
    <div className="flex flex-col items-center">
      {/* Physical Desktop Robot Chassis (Fixed, Stable & Vibration-Free) */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-950 border-2 border-slate-700/80 shadow-2xl shadow-black/80 flex flex-col items-center max-w-full">
        {/* Chassis Top Acoustic Mesh & Status LED */}
        <div className="w-full flex items-center justify-between pb-3 px-2 border-b border-slate-700/40 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
            <span className="text-slate-300 font-semibold">TARA DISPLAY UNIT</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400/90 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" />
              STABLE CHASSIS
            </span>
            <span>128×64 OLED CORE</span>
          </div>
        </div>

        {/* OLED Screen Bezel */}
        <div className="relative mt-4 p-3.5 rounded-2xl bg-black border-4 border-slate-900 shadow-inner flex flex-col items-center">
          {/* Bezel inner glare accent */}
          <div className="relative rounded-xl overflow-hidden bg-[#02070d] border border-cyan-950/60 shadow-[0_0_30px_rgba(0,0,0,0.9)]">
            <canvas
              ref={canvasRef}
              width={320}
              height={160}
              style={{
                width: `${320 * scale}px`,
                height: `${160 * scale}px`,
                maxWidth: '100%',
                display: 'block',
                imageRendering: 'pixelated',
              }}
            />
          </div>

          {/* Under-screen Subtle Companion Logo */}
          <div className="mt-2.5 flex items-center justify-between w-full px-1 text-[10px] font-mono text-slate-500">
            <span>MODEL: TARA-S3</span>
            <span className="text-cyan-500/80 font-bold tracking-wider">T A R A</span>
            <span>ZERO SERVO WEAR</span>
          </div>
        </div>

        {/* Desktop Companion Tabletop Stand & Feet */}
        <div className="w-44 h-4 mt-2 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 rounded-b-xl border-t border-slate-600/50 shadow-md flex justify-around items-center px-4">
          <div className="w-6 h-1 bg-slate-500 rounded-full" />
          <div className="w-6 h-1 bg-slate-500 rounded-full" />
        </div>
      </div>

      {/* Screen & Palette Quick Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 bg-slate-900/80 backdrop-blur p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
        <span className="text-slate-400 font-medium flex items-center gap-1.5 px-1">
          <Palette className="w-3.5 h-3.5 text-cyan-400" />
          OLED Phosphor:
        </span>
        <button
          onClick={() => setPalette('cyan')}
          className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
            palette === 'cyan'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Cyan Neon
        </button>
        <button
          onClick={() => setPalette('amber')}
          className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
            palette === 'amber'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Amber Warm
        </button>
        <button
          onClick={() => setPalette('white')}
          className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
            palette === 'white'
              ? 'bg-slate-200/20 text-white border border-slate-400/50'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          True White
        </button>
        <button
          onClick={() => setPalette('green')}
          className={`px-2.5 py-1 rounded font-mono font-medium transition-all ${
            palette === 'green'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Matrix Green
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Scanlines Toggle */}
        <button
          onClick={() => setShowScanlines(!showScanlines)}
          className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
            showScanlines ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Tv className="w-3 h-3" />
          Scanlines {showScanlines ? 'ON' : 'OFF'}
        </button>

        {/* Standalone Hands Toggle */}
        <button
          onClick={() => setShowArms(!showArms)}
          className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
            showArms ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <Layers className="w-3 h-3" />
          Animated Hands {showArms ? 'ON' : 'OFF'}
        </button>

        {/* Zoom Scale */}
        <div className="flex items-center gap-1 pl-1">
          <button
            onClick={() => setScale(scale === 1.75 ? 1.25 : scale === 1.25 ? 2.0 : 1.75)}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center gap-1"
            title="Toggle Display Scale"
          >
            <Maximize2 className="w-3 h-3" />
            <span>{Math.round(scale * 100)}%</span>
          </button>
        </div>
      </div>
    </div>
  );
};
