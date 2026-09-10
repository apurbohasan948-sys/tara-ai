import React, { useEffect, useRef, useState } from 'react';
import { RobotState, RobotEmotion } from '../types';
import { Eye, Zap, Volume2, Sparkles, AlertTriangle, Wifi, Moon, Smile } from 'lucide-react';

interface OledSimulatorProps {
  state: RobotState;
  emotion: RobotEmotion;
  onStateChange?: (state: RobotState) => void;
  interactiveCursor?: boolean;
}

export const OledSimulator: React.FC<OledSimulatorProps> = ({
  state,
  emotion,
  onStateChange,
  interactiveCursor = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saccadeX, setSaccadeX] = useState(0);
  const [saccadeY, setSaccadeY] = useState(0);
  const [blinkProgress, setBlinkProgress] = useState(0); // 0 = open, 1 = closed
  const [wavePhase, setWavePhase] = useState(0);
  const [thinkingAngle, setThinkingAngle] = useState(0);

  // Procedural animation loop
  useEffect(() => {
    let animFrame: number;
    let lastBlink = performance.now();
    let isBlinking = false;
    let blinkDuration = 180;
    let nextBlinkInterval = 3000 + Math.random() * 2500;

    let lastSaccade = performance.now();
    let nextSaccadeInterval = 2000 + Math.random() * 3000;

    const animate = (time: number) => {
      // 1. Blink Engine
      if (state !== 'SLEEPING') {
        if (!isBlinking && time - lastBlink > nextBlinkInterval) {
          isBlinking = true;
          lastBlink = time;
        }

        if (isBlinking) {
          const progress = (time - lastBlink) / blinkDuration;
          if (progress >= 1) {
            isBlinking = false;
            setBlinkProgress(0);
            nextBlinkInterval = 2500 + Math.random() * 3500;
          } else {
            // Triangle wave for smooth blink
            const blinkVal = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
            setBlinkProgress(blinkVal);
          }
        }
      } else {
        setBlinkProgress(1); // Eyes fully closed in sleep
      }

      // 2. Saccade Engine
      if (!interactiveCursor && state === 'IDLE') {
        if (time - lastSaccade > nextSaccadeInterval) {
          lastSaccade = time;
          nextSaccadeInterval = 1500 + Math.random() * 3000;
          const dirs = [
            { x: 0, y: 0 },
            { x: -5, y: 0 },
            { x: 6, y: 0 },
            { x: 0, y: -3 },
            { x: -4, y: 2 },
            { x: 4, y: -2 },
          ];
          const pick = dirs[Math.floor(Math.random() * dirs.length)];
          setSaccadeX(pick.x);
          setSaccadeY(pick.y);
        }
      }

      // 3. Audio Wave / Particle Phase
      setWavePhase((prev) => (prev + 0.15) % (Math.PI * 2));
      setThinkingAngle((prev) => (prev + 0.08) % (Math.PI * 2));

      animFrame = requestAnimationFrame(animate);
    };

    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [state, interactiveCursor]);

  // Handle mouse move over display for real-time glance tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveCursor || state === 'SLEEPING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setSaccadeX(Math.round(nx * 14));
    setSaccadeY(Math.round(ny * 8));
  };

  const handleMouseLeave = () => {
    if (interactiveCursor) {
      setSaccadeX(0);
      setSaccadeY(0);
    }
  };

  // Render to virtual 128x64 OLED canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Standard OLED dimension: 128x64
    const W = 128;
    const H = 64;

    // Clear background (deep OLED black)
    ctx.fillStyle = '#05070d';
    ctx.fillRect(0, 0, W, H);

    // Color definitions (Electric Cyan Monochrome OLED)
    const oledColor = '#00f0ff';
    const oledGlow = '#00a3cc';
    ctx.fillStyle = oledColor;
    ctx.strokeStyle = oledColor;

    const eyeW = 28;
    const eyeH = 38;
    const eyeRadius = 9;
    const eyeCenterY = H / 2 + saccadeY;
    const leftCenterX = 40 + saccadeX;
    const rightCenterX = 88 + saccadeX;

    // Helper: draw rounded rectangle
    const drawEye = (cx: number, cy: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.roundRect(cx - w / 2, cy - h / 2, w, h, r);
      ctx.fill();
    };

    // Helper: draw smiling curved arc
    const drawHappyArc = (cx: number, cy: number) => {
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 15, Math.PI * 1.15, Math.PI * 1.85, false);
      ctx.stroke();
    };

    // Helper: draw sleeping arc
    const drawSleepArc = (cx: number, cy: number) => {
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, 14, Math.PI * 0.15, Math.PI * 0.85, false);
      ctx.stroke();
    };

    // Helper: draw angry brows
    const drawAngryEye = (cx: number, cy: number, isLeft: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(isLeft ? 0.25 : -0.25);
      ctx.beginPath();
      ctx.roundRect(-eyeW / 2, -eyeH / 2, eyeW, eyeH * 0.85, 6);
      ctx.fill();
      ctx.restore();
    };

    switch (state) {
      case 'HAPPY':
        drawHappyArc(leftCenterX, eyeCenterY);
        drawHappyArc(rightCenterX, eyeCenterY);
        // Little cheek blush dots
        ctx.beginPath();
        ctx.arc(leftCenterX - 14, eyeCenterY + 12, 2, 0, Math.PI * 2);
        ctx.arc(rightCenterX + 14, eyeCenterY + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'SLEEPING':
        drawSleepArc(leftCenterX, eyeCenterY);
        drawSleepArc(rightCenterX, eyeCenterY);
        // Floating Zzz
        ctx.font = 'bold 9px monospace';
        const zOffset = Math.sin(wavePhase) * 2;
        ctx.fillText('z', 98, 22 + zOffset);
        ctx.fillText('Z', 108, 14 + zOffset);
        break;

      case 'ANGRY':
        drawAngryEye(leftCenterX, eyeCenterY, true);
        drawAngryEye(rightCenterX, eyeCenterY, false);
        break;

      case 'SAD':
        // Drooping eyes
        ctx.save();
        ctx.translate(leftCenterX, eyeCenterY);
        ctx.rotate(-0.18);
        ctx.beginPath();
        ctx.roundRect(-eyeW / 2, -eyeH / 2, eyeW, eyeH * 0.8, 6);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(rightCenterX, eyeCenterY);
        ctx.rotate(0.18);
        ctx.beginPath();
        ctx.roundRect(-eyeW / 2, -eyeH / 2, eyeW, eyeH * 0.8, 6);
        ctx.fill();
        ctx.restore();
        break;

      case 'SURPRISED':
        // Wide tall rounded ovals
        ctx.beginPath();
        ctx.ellipse(leftCenterX, eyeCenterY, 13, 22, 0, 0, Math.PI * 2);
        ctx.ellipse(rightCenterX, eyeCenterY, 13, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        // Little inner pupil
        ctx.fillStyle = '#05070d';
        ctx.beginPath();
        ctx.arc(leftCenterX + saccadeX * 0.4, eyeCenterY + saccadeY * 0.4, 4, 0, Math.PI * 2);
        ctx.arc(rightCenterX + saccadeX * 0.4, eyeCenterY + saccadeY * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = oledColor;
        break;

      case 'THINKING':
        // Eyes looking up-right
        const thinkCX_L = 40 + 6;
        const thinkCX_R = 88 + 6;
        const thinkCY = H / 2 - 5;
        drawEye(thinkCX_L, thinkCY, eyeW, eyeH * 0.85, eyeRadius);
        drawEye(thinkCX_R, thinkCY, eyeW, eyeH * 0.85, eyeRadius);

        // Orbiting particle thought constellation
        const orbitRadius = 8;
        const ox = 112 + Math.cos(thinkingAngle) * orbitRadius;
        const oy = 18 + Math.sin(thinkingAngle) * orbitRadius;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.arc(112, 18, 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'LISTENING':
        // Focused eyes
        drawEye(leftCenterX, eyeCenterY - 4, eyeW, eyeH * 0.85, eyeRadius);
        drawEye(rightCenterX, eyeCenterY - 4, eyeW, eyeH * 0.85, eyeRadius);

        // Audio frequency wave bars at bottom
        const barCount = 7;
        const barStartX = 42;
        const barGap = 7;
        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.abs(Math.sin(wavePhase + i * 0.8)) * 14 + 3;
          ctx.fillRect(barStartX + i * barGap, 60 - barHeight, 4, barHeight);
        }
        break;

      case 'SPEAKING':
        // Expressive eyes
        drawEye(leftCenterX, eyeCenterY - 5, eyeW, eyeH * 0.85, eyeRadius);
        drawEye(rightCenterX, eyeCenterY - 5, eyeW, eyeH * 0.85, eyeRadius);

        // Dynamic mouth wave
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(46, 54);
        for (let x = 46; x <= 82; x += 4) {
          const my = 54 + Math.sin((x - 46) * 0.3 + wavePhase * 2) * 4;
          ctx.lineTo(x, my);
        }
        ctx.stroke();
        break;

      case 'CONNECTING':
        // Wi-Fi signal icon expanding
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('CONNECTING...', W / 2, 22);
        const pulse = Math.abs(Math.sin(wavePhase)) * 10;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(W / 2, 48, 8 + pulse, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2, 48, 3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'ERROR':
        // Alert triangle & cross
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('SYSTEM ERROR', W / 2, 24);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(56, 36);
        ctx.lineTo(72, 52);
        ctx.moveTo(72, 36);
        ctx.lineTo(56, 52);
        ctx.stroke();
        break;

      case 'IDLE':
      default:
        // Standard eyes with procedural blink
        const currentH = Math.max(3, eyeH * (1 - blinkProgress));
        drawEye(leftCenterX, eyeCenterY, eyeW, currentH, Math.min(eyeRadius, currentH / 2));
        drawEye(rightCenterX, eyeCenterY, eyeW, currentH, Math.min(eyeRadius, currentH / 2));
        break;
    }

    // Draw subtle retro scanline / OLED pixel grid effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < H; y += 2) {
      ctx.fillRect(0, y, W, 1);
    }
  }, [state, emotion, saccadeX, saccadeY, blinkProgress, wavePhase, thinkingAngle]);

  return (
    <div className="flex flex-col items-center">
      {/* Outer Robot Bezel Frame */}
      <div
        className="relative p-4 rounded-2xl bg-gradient-to-b from-[#1c2438] to-[#0d1322] border-2 border-slate-700 shadow-2xl shadow-cyan-950/30 transition-all duration-300"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Top Micro Camera / Light Sensor Dot */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
          <div className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></div>
        </div>

        {/* OLED Screen Bezel */}
        <div className="relative rounded-lg overflow-hidden border-2 border-slate-800 bg-[#05070d] p-1.5 shadow-inner">
          <canvas
            ref={canvasRef}
            width={128}
            height={64}
            className="w-64 h-32 md:w-80 md:h-40 image-rendering-pixelated block rounded"
            style={{ imageRendering: 'pixelated' }}
          />

          {/* Subtly glowing corner indicators */}
          <div className="absolute top-1 left-2 text-[9px] font-mono text-cyan-500/70 tracking-tight">
            I2C: 0x3C
          </div>
          <div className="absolute top-1 right-2 text-[9px] font-mono text-cyan-500/70 tracking-tight">
            128x64 OLED
          </div>
          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400/80 uppercase font-semibold">
            {state}
          </div>
        </div>

        {/* Bottom Hardware Branding */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ESP32 ACTIVE
          </span>
          <span className="text-cyan-400 font-bold tracking-wider">TARA v0.1</span>
          <span>~30 FPS</span>
        </div>
      </div>

      {/* Interactive Expression Quick-Triggers */}
      {onStateChange && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-md">
          {(['IDLE', 'HAPPY', 'LISTENING', 'THINKING', 'SPEAKING', 'SURPRISED', 'SAD', 'SLEEPING'] as RobotState[]).map(
            (st) => (
              <button
                key={st}
                onClick={() => onStateChange(st)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-all ${
                  state === st
                    ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/50'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {st}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
