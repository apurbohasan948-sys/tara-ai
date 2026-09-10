import React, { useState } from 'react';
import { RobotState, RobotEmotion } from '../types';
import { Eye, Sliders, CheckCircle2, Tv, Sparkles } from 'lucide-react';

interface TabFaceProps {
  robotState: RobotState;
  onSetState: (state: RobotState) => void;
  onSetEmotion?: (em: RobotEmotion) => void;
}

export const TabFace: React.FC<TabFaceProps> = ({ robotState, onSetState, onSetEmotion }) => {
  const [blinkSpeed, setBlinkSpeed] = useState(3.5); // seconds
  const [eyeWidth, setEyeWidth] = useState(28);
  const [eyeHeight, setEyeHeight] = useState(38);
  const [eyeRadius, setEyeRadius] = useState(9);
  const [notice, setNotice] = useState(false);

  const handleSave = () => {
    setNotice(true);
    setTimeout(() => setNotice(false), 2000);
  };

  const expressions: Array<{ state: RobotState; label: string; desc: string }> = [
    { state: 'IDLE', label: 'Idle / Natural', desc: 'Soft rounded eyes with periodic blinks and saccades' },
    { state: 'HAPPY', label: 'Happy (EMO Arc)', desc: 'Inverted squinting cheerful smiling eye arcs' },
    { state: 'LISTENING', label: 'Listening Mode', desc: 'Focused eyes with active bottom frequency bars' },
    { state: 'THINKING', label: 'Thinking Glances', desc: 'Eyes shifted up-right with orbital constellation' },
    { state: 'SPEAKING', label: 'Speaking Animation', desc: 'Expressive eyes with dynamic undulating mouth wave' },
    { state: 'SURPRISED', label: 'Surprised Shock', desc: 'Tall wide ovals with small inner pupils' },
    { state: 'SAD', label: 'Sad Droop', desc: 'Drooping outer corners with tear shimmer' },
    { state: 'ANGRY', label: 'Angry / Serious', desc: 'Slanted sharp brow lines' },
    { state: 'SLEEPING', label: 'Sleeping / Rest', desc: 'Closed horizontal arcs with floating Zzz' },
    { state: 'CONNECTING', label: 'Connecting Network', desc: 'Pulsing Wi-Fi signal icon' },
    { state: 'ERROR', label: 'System Alert', desc: 'Alert screen with cross icon' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400" />
          Procedural OLED Geometric Face Engine
        </h3>
        <p className="text-[12px] text-slate-400 mb-2">
          Designed specifically for standard 128x64 I2C monochrome/bicolor OLED displays (SSD1306/SH1106).
          Instead of heavy, memory-exhausting bitmap sequences that crash standard ESP32 RAM, TARA uses lightweight procedural mathematics (rounded rectangles, quadratic bezier arcs, and trigonometric wave dynamics).
        </p>
        <div className="flex items-center gap-4 text-xs font-mono text-cyan-400">
          <span>Resolution: 128 x 64</span>
          <span>Buffer: 1024 Bytes (Zero heap pressure)</span>
          <span>Target: 30 FPS</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Expression Gallery */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            Trigger Procedural Expressions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[440px] overflow-y-auto pr-1">
            {expressions.map((item) => (
              <button
                key={item.state}
                onClick={() => onSetState(item.state)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  robotState === item.state
                    ? 'bg-cyan-950/50 border-cyan-500 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950 border-slate-800/80 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      robotState === item.state ? 'text-cyan-400' : 'text-slate-200'
                    }`}
                  >
                    {item.label}
                  </span>
                  {robotState === item.state && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Eye Geometry Customizer */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Eye Proportions & Saccade Tuning
          </h4>

          {notice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Face geometry parameters saved to ESP32!</span>
            </div>
          )}

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                <span>Eye Width</span>
                <span className="font-mono text-cyan-400">{eyeWidth} px</span>
              </div>
              <input
                type="range"
                min="20"
                max="36"
                value={eyeWidth}
                onChange={(e) => setEyeWidth(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                <span>Eye Height</span>
                <span className="font-mono text-cyan-400">{eyeHeight} px</span>
              </div>
              <input
                type="range"
                min="26"
                max="46"
                value={eyeHeight}
                onChange={(e) => setEyeHeight(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                <span>Corner Curvature Radius</span>
                <span className="font-mono text-cyan-400">{eyeRadius} px</span>
              </div>
              <input
                type="range"
                min="4"
                max="16"
                value={eyeRadius}
                onChange={(e) => setEyeRadius(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-slate-300 font-semibold mb-1">
                <span>Natural Blink Period</span>
                <span className="font-mono text-cyan-400">{blinkSpeed} s</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="6.0"
                step="0.5"
                value={blinkSpeed}
                onChange={(e) => setBlinkSpeed(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20 mt-4"
          >
            Apply Face Proportions
          </button>
        </div>
      </div>
    </div>
  );
};
