import React, { useEffect, useRef, useState } from 'react';
import { RobotState, RobotEmotion, RobotActivity, ArmState } from '../types';
import { faceEngine, FaceRenderState } from '../services/FaceEngine';
import { activitySceneManager } from '../services/ActivitySceneManager';
import { armController } from '../services/ArmController';

interface OledSimulatorProps {
  state: RobotState;
  emotion: RobotEmotion;
  activity?: RobotActivity;
  onStateChange?: (state: RobotState) => void;
  interactiveCursor?: boolean;
}

export const OledSimulator: React.FC<OledSimulatorProps> = ({
  state,
  emotion,
  activity = 'IDLE',
  interactiveCursor = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [armState, setArmState] = useState<ArmState>(armController.getState());
  const [showArms, setShowArms] = useState(true);

  // Subscribe to arm servo controller updates
  useEffect(() => {
    const unsub = armController.subscribe((s) => setArmState(s));
    return unsub;
  }, []);

  // Handle mouse move over display for real-time glance tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveCursor || state === 'SLEEPING') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    const gx = Math.round(nx * 20);
    const gy = Math.round(ny * 12);
    faceEngine.setGaze(gx, gy);
  };

  const handleMouseLeave = () => {
    if (interactiveCursor) {
      faceEngine.setGaze(0, 0);
    }
  };

  // Canvas Render Loop at 60 FPS
  useEffect(() => {
    let animFrame: number;

    const render = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 128;
      const H = 64;

      // 1. Clear background (deep OLED true black)
      ctx.fillStyle = '#05070d';
      ctx.fillRect(0, 0, W, H);

      // 2. Compute face geometry from FaceEngine & current props from ActivitySceneManager
      const fs: FaceRenderState = faceEngine.computeRenderState(
        state,
        emotion,
        (activity || 'IDLE') as RobotActivity,
        time
      );

      // Update activity scene timeline
      activitySceneManager.updateTimeline(time);
      const props = activitySceneManager.getProps();

      // Color definitions (Electric Cyan Monochrome OLED)
      const oledColor = '#00f0ff';
      const dimOledColor = 'rgba(0, 240, 255, 0.4)';
      ctx.fillStyle = oledColor;
      ctx.strokeStyle = oledColor;

      // Apply subtle head tilt & bounce
      ctx.save();
      ctx.translate(W / 2, H / 2 + fs.headBounce);
      ctx.rotate(fs.headTilt);
      ctx.translate(-W / 2, -H / 2);

      const eyeCenterY = H / 2 - 4 + fs.gazeY;
      const leftCenterX = 40 + fs.gazeX;
      const rightCenterX = 88 + fs.gazeX;

      // -------------------------------------------------------------
      // Helper drawing routines
      // -------------------------------------------------------------
      const drawEyeRect = (cx: number, cy: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.roundRect(cx - w / 2, cy - h / 2, w, h, Math.max(1, Math.min(r, h / 2)));
        ctx.fill();
      };

      const drawHappyArc = (cx: number, cy: number) => {
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, cy + 3, 13, Math.PI * 1.15, Math.PI * 1.85, false);
        ctx.stroke();
      };

      const drawSleepArc = (cx: number, cy: number) => {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy - 2, 13, Math.PI * 0.15, Math.PI * 0.85, false);
        ctx.stroke();
      };

      const drawHeart = (cx: number, cy: number, size: number) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + size * 0.7);
        ctx.bezierCurveTo(cx - size, cy - size * 0.2, cx - size * 0.6, cy - size * 0.8, cx, cy - size * 0.4);
        ctx.bezierCurveTo(cx + size * 0.6, cy - size * 0.8, cx + size, cy - size * 0.2, cx, cy + size * 0.7);
        ctx.fill();
      };

      const drawSpiral = (cx: number, cy: number, maxRadius: number) => {
        ctx.lineWidth = 2;
        ctx.beginPath();
        const rot = time * 0.008;
        for (let a = 0; a < Math.PI * 5; a += 0.25) {
          const r = (a / (Math.PI * 5)) * maxRadius;
          const x = cx + Math.cos(a + rot) * r;
          const y = cy + Math.sin(a + rot) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // -------------------------------------------------------------
      // 3. Render Eyes based on Shape
      // -------------------------------------------------------------
      if (fs.eyeShape === 'love_hearts') {
        drawHeart(leftCenterX, eyeCenterY, 13);
        drawHeart(rightCenterX, eyeCenterY, 13);
      } else if (fs.eyeShape === 'happy_arc') {
        drawHappyArc(leftCenterX, eyeCenterY);
        drawHappyArc(rightCenterX, eyeCenterY);
      } else if (fs.eyeShape === 'sleep_arc' || state === 'SLEEPING') {
        drawSleepArc(leftCenterX, eyeCenterY);
        drawSleepArc(rightCenterX, eyeCenterY);

        // Floating Zzz
        ctx.font = 'bold 9px monospace';
        const zOff = Math.sin(time * 0.003) * 2;
        ctx.fillText('z', 98, 22 + zOff);
        ctx.fillText('Z', 108, 14 + zOff);
      } else if (fs.eyeShape === 'dizzy_spiral') {
        drawSpiral(leftCenterX, eyeCenterY, 11);
        drawSpiral(rightCenterX, eyeCenterY, 11);
      } else if (fs.eyeShape === 'wink') {
        drawHappyArc(leftCenterX, eyeCenterY);
        drawEyeRect(rightCenterX, eyeCenterY, fs.rightEyeWidth, fs.rightEyeHeight, fs.rightEyeRadius);
      } else if (fs.eyeShape === 'suspicious') {
        // Squinted narrowed eyes
        drawEyeRect(leftCenterX, eyeCenterY, fs.leftEyeWidth, 9, 3);
        drawEyeRect(rightCenterX, eyeCenterY, fs.rightEyeWidth, 9, 3);
        // Small focused pupils
        ctx.fillStyle = '#05070d';
        ctx.beginPath();
        ctx.arc(leftCenterX - 3, eyeCenterY, 2.5, 0, Math.PI * 2);
        ctx.arc(rightCenterX - 3, eyeCenterY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = oledColor;
      } else if (fs.eyeShape === 'angry') {
        ctx.save();
        ctx.translate(leftCenterX, eyeCenterY);
        ctx.rotate(0.24);
        drawEyeRect(0, 0, fs.leftEyeWidth, fs.leftEyeHeight * 0.85, 6);
        ctx.restore();

        ctx.save();
        ctx.translate(rightCenterX, eyeCenterY);
        ctx.rotate(-0.24);
        drawEyeRect(0, 0, fs.rightEyeWidth, fs.rightEyeHeight * 0.85, 6);
        ctx.restore();
      } else if (fs.eyeShape === 'sad_droop') {
        ctx.save();
        ctx.translate(leftCenterX, eyeCenterY);
        ctx.rotate(-0.2);
        drawEyeRect(0, 0, fs.leftEyeWidth, fs.leftEyeHeight * 0.8, 6);
        ctx.restore();

        ctx.save();
        ctx.translate(rightCenterX, eyeCenterY);
        ctx.rotate(0.2);
        drawEyeRect(0, 0, fs.rightEyeWidth, fs.rightEyeHeight * 0.8, 6);
        ctx.restore();
      } else if (fs.eyeShape === 'wide_surprised') {
        ctx.beginPath();
        ctx.ellipse(leftCenterX, eyeCenterY, 13, 21, 0, 0, Math.PI * 2);
        ctx.ellipse(rightCenterX, eyeCenterY, 13, 21, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner pupil
        ctx.fillStyle = '#05070d';
        ctx.beginPath();
        ctx.arc(leftCenterX + fs.gazeX * 0.4, eyeCenterY + fs.gazeY * 0.4, 4, 0, Math.PI * 2);
        ctx.arc(rightCenterX + fs.gazeX * 0.4, eyeCenterY + fs.gazeY * 0.4, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = oledColor;
      } else if (fs.eyeShape === 'curious_tilt') {
        // Asymmetric curious look
        ctx.save();
        ctx.translate(leftCenterX, eyeCenterY - 2);
        ctx.rotate(-0.1);
        drawEyeRect(0, 0, fs.leftEyeWidth, fs.leftEyeHeight * 0.95, fs.leftEyeRadius);
        ctx.restore();

        ctx.save();
        ctx.translate(rightCenterX, eyeCenterY + 1);
        ctx.rotate(0.08);
        drawEyeRect(0, 0, fs.rightEyeWidth, fs.rightEyeHeight * 0.85, fs.rightEyeRadius);
        ctx.restore();
      } else if (fs.eyeShape === 'confused_asym') {
        // One eye bigger, one smaller and squinted
        drawEyeRect(leftCenterX, eyeCenterY - 2, 28, 36, 8);
        drawEyeRect(rightCenterX, eyeCenterY + 3, 22, 20, 5);
      } else {
        // Normal eyes with procedural blink
        drawEyeRect(leftCenterX, eyeCenterY, fs.leftEyeWidth, fs.leftEyeHeight, Math.min(fs.leftEyeRadius, fs.leftEyeHeight / 2));
        drawEyeRect(rightCenterX, eyeCenterY, fs.rightEyeWidth, fs.rightEyeHeight, Math.min(fs.rightEyeRadius, fs.rightEyeHeight / 2));

        // Subtle pupil highlight reflection
        if (fs.blinkRatio < 0.3) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(leftCenterX - 5 + fs.gazeX * 0.2, eyeCenterY - 6 + fs.gazeY * 0.2, 2.5, 0, Math.PI * 2);
          ctx.arc(rightCenterX - 5 + fs.gazeX * 0.2, eyeCenterY - 6 + fs.gazeY * 0.2, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = oledColor;
        }
      }

      // -------------------------------------------------------------
      // 4. Eyebrows
      // -------------------------------------------------------------
      if (fs.leftBrowOffset !== 0 || fs.leftBrowAngle !== 0) {
        ctx.save();
        ctx.translate(leftCenterX, eyeCenterY - 22 + fs.leftBrowOffset);
        ctx.rotate(fs.leftBrowAngle);
        ctx.fillRect(-12, -2, 24, 3);
        ctx.restore();

        ctx.save();
        ctx.translate(rightCenterX, eyeCenterY - 22 + fs.rightBrowOffset);
        ctx.rotate(fs.rightBrowAngle);
        ctx.fillRect(-12, -2, 24, 3);
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 5. Blush Cheeks & Particles
      // -------------------------------------------------------------
      if (fs.extraVisuals.cheeksBlush) {
        ctx.beginPath();
        ctx.arc(leftCenterX - 14, eyeCenterY + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(rightCenterX + 14, eyeCenterY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (fs.extraVisuals.tearDrops) {
        ctx.beginPath();
        const dropY = eyeCenterY + 10 + ((time % 1000) / 1000) * 12;
        ctx.arc(rightCenterX + 12, dropY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (fs.extraVisuals.particles === 'sweat') {
        ctx.font = 'bold 8px monospace';
        ctx.fillText('💧', rightCenterX + 12, eyeCenterY - 14);
      } else if (fs.extraVisuals.particles === 'sparks') {
        const sparkPhase = (time * 0.005) % (Math.PI * 2);
        ctx.fillRect(leftCenterX - 18 + Math.cos(sparkPhase) * 3, eyeCenterY - 16, 2, 2);
        ctx.fillRect(rightCenterX + 16 + Math.sin(sparkPhase) * 3, eyeCenterY - 16, 2, 2);
      }

      // -------------------------------------------------------------
      // 6. Mouth Rendering
      // -------------------------------------------------------------
      const mouthY = 53 + fs.mouthYOffset;
      const mouthCX = 64;

      if (state !== 'SLEEPING') {
        ctx.lineWidth = 2.5;

        if (fs.mouthShape === 'talking') {
          ctx.beginPath();
          const halfW = fs.mouthWidth / 2;
          ctx.moveTo(mouthCX - halfW, mouthY);
          for (let x = mouthCX - halfW; x <= mouthCX + halfW; x += 3) {
            const my = mouthY + Math.sin((x - mouthCX) * 0.4 + fs.mouthPhonemePhase * 2) * (fs.mouthOpenHeight * 0.4);
            ctx.lineTo(x, my);
          }
          ctx.stroke();
        } else if (fs.mouthShape === 'MOUTH_O') {
          ctx.beginPath();
          ctx.ellipse(mouthCX, mouthY, 7, fs.mouthOpenHeight * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (fs.mouthShape === 'MOUTH_SMILE') {
          ctx.beginPath();
          ctx.arc(mouthCX, mouthY - 4, 12, Math.PI * 0.2, Math.PI * 0.8, false);
          ctx.stroke();
        } else if (fs.mouthShape === 'MOUTH_WIDE') {
          ctx.beginPath();
          ctx.arc(mouthCX, mouthY - 5, 14, Math.PI * 0.15, Math.PI * 0.85, false);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(mouthCX - 11, mouthY + 2);
          ctx.lineTo(mouthCX + 11, mouthY + 2);
          ctx.stroke();
        } else if (fs.mouthShape === 'sad_frown') {
          ctx.beginPath();
          ctx.arc(mouthCX, mouthY + 8, 12, Math.PI * 1.2, Math.PI * 1.8, false);
          ctx.stroke();
        } else if (fs.mouthShape === 'thinking_pucker') {
          ctx.beginPath();
          ctx.moveTo(mouthCX - 5, mouthY);
          ctx.lineTo(mouthCX + 8, mouthY - 2);
          ctx.stroke();
        } else if (fs.mouthShape === 'worried_wiggle') {
          ctx.beginPath();
          ctx.moveTo(mouthCX - 10, mouthY);
          ctx.quadraticCurveTo(mouthCX - 5, mouthY - 3, mouthCX, mouthY);
          ctx.quadraticCurveTo(mouthCX + 5, mouthY + 3, mouthCX + 10, mouthY);
          ctx.stroke();
        } else if (fs.mouthShape === 'pout') {
          ctx.beginPath();
          ctx.arc(mouthCX, mouthY + 4, 7, Math.PI * 1.2, Math.PI * 1.8, false);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.moveTo(mouthCX - 8, mouthY);
          ctx.lineTo(mouthCX + 8, mouthY);
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // 7. Activity Scene Props & Decorators (Layered Architecture)
      // -------------------------------------------------------------

      // COOKING SCENE: Pot, Burner, Flame, Steam, Stirring Spoon
      if (activity === 'COOKING' || props.potCooking) {
        const potX = 14;
        const potY = 40;

        // Stove / burner base
        ctx.fillStyle = oledColor;
        ctx.fillRect(potX - 6, potY + 18, 30, 2);

        // Visible Flame (toggled ON/OFF with animated flicker)
        if (props.flame) {
          ctx.fillStyle = '#ff6b00';
          const flameCount = 3;
          for (let f = 0; f < flameCount; f++) {
            const fx = potX - 2 + f * 9;
            const fh = 4 + Math.sin(time * 0.015 + f * 1.5) * 3;
            ctx.beginPath();
            ctx.moveTo(fx, potY + 18);
            ctx.lineTo(fx + 4, potY + 18 - fh);
            ctx.lineTo(fx + 8, potY + 18);
            ctx.fill();
          }
          ctx.fillStyle = oledColor;
        }

        // Cooking Pot body
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(potX - 4, potY + 4);
        ctx.lineTo(potX + 22, potY + 4);
        ctx.lineTo(potX + 18, potY + 17);
        ctx.lineTo(potX, potY + 17);
        ctx.closePath();
        ctx.stroke();

        // Pot handles
        ctx.beginPath();
        ctx.arc(potX - 5, potY + 8, 2, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(potX + 23, potY + 8, 2, Math.PI * 1.5, Math.PI * 0.5);
        ctx.stroke();

        // Steam animation rising
        if (props.steam) {
          ctx.lineWidth = 1.2;
          const steamPhase = time * 0.004;
          for (let s = 0; s < 3; s++) {
            const sx = potX + 2 + s * 7;
            const sy = potY - 2;
            const wave = Math.sin(steamPhase + s * 1.8) * 3;
            ctx.beginPath();
            ctx.moveTo(sx + wave, sy);
            ctx.quadraticCurveTo(sx - wave, sy - 6, sx + wave * 0.8, sy - 12);
            ctx.stroke();
          }
        }

        // Stirring Spoon / Utensil
        if (props.spoonStirring) {
          const stirAngle = Math.sin(time * 0.008) * 0.35 - 0.2;
          ctx.save();
          ctx.translate(potX + 9, potY + 8);
          ctx.rotate(stirAngle);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -16);
          ctx.lineTo(0, 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(0, 5, 3, 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.font = '7px monospace';
        ctx.fillText('COOKING', 4, 12);
      }

      // SINGING SCENE: Microphone + Bouncing Music Notes
      if (activity === 'SINGING' || props.microphone) {
        const micX = 114;
        const micY = 36;
        ctx.lineWidth = 1.5;

        // Microphone head mesh
        ctx.beginPath();
        ctx.ellipse(micX, micY - 8, 5, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillRect(micX - 4, micY - 9, 8, 2);

        // Mic handle & stand
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(micX, micY - 1);
        ctx.lineTo(micX, micY + 16);
        ctx.stroke();
        ctx.fillRect(micX - 6, micY + 16, 12, 2);

        // Floating notes
        if (props.musicNotes || activity === 'SINGING') {
          const bounce = Math.sin(time * 0.008) * 3;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('♪', micX - 16, micY - 12 + bounce);
          ctx.fillText('♫', 14, 28 - bounce);
        }
      }

      // READING SCENE: Book Prop with scanning lines
      if (activity === 'READING' || props.book) {
        const bookX = 16;
        const bookY = 46;

        // Open book spine & two angled pages
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(bookX, bookY);
        ctx.lineTo(bookX - 10, bookY + 8);
        ctx.lineTo(bookX - 10, bookY + 16);
        ctx.lineTo(bookX, bookY + 9);
        ctx.lineTo(bookX + 10, bookY + 16);
        ctx.lineTo(bookX + 10, bookY + 8);
        ctx.closePath();
        ctx.stroke();

        // Horizontal lines representing text
        ctx.fillRect(bookX - 8, bookY + 10, 6, 1);
        ctx.fillRect(bookX - 8, bookY + 13, 5, 1);
        ctx.fillRect(bookX + 2, bookY + 10, 6, 1);
        ctx.fillRect(bookX + 2, bookY + 13, 5, 1);

        // Scanning position bar
        ctx.font = '7px monospace';
        ctx.fillText('READING', 86, 62);
      }

      // MUSIC SCENE: Speaker / Sound Waves
      if (activity === 'LISTENING_MUSIC' || props.speaker) {
        const spkX = 14;
        const spkY = 22;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(spkX, spkY, 12, 18);
        ctx.beginPath();
        ctx.arc(spkX + 6, spkY + 9, 3.5, 0, Math.PI * 2);
        ctx.stroke();

        // Sound waves radiating
        const wavePhase = (time * 0.006) % 3;
        for (let w = 1; w <= 3; w++) {
          ctx.beginPath();
          ctx.arc(spkX + 6, spkY + 9, 7 + w * 4, -0.6, 0.6);
          ctx.stroke();
        }
      }

      // THINKING SCENE: Thought cloud bubbles
      if (activity === 'THINKING' || props.thoughtCloud) {
        const cloudX = 110;
        const cloudY = 16;
        ctx.beginPath();
        ctx.arc(cloudX - 6, cloudY + 10, 1.8, 0, Math.PI * 2);
        ctx.arc(cloudX - 3, cloudY + 6, 2.5, 0, Math.PI * 2);
        ctx.arc(cloudX, cloudY, 4.5, 0, Math.PI * 2);
        ctx.arc(cloudX + 5, cloudY - 1, 3.5, 0, Math.PI * 2);
        ctx.arc(cloudX - 4, cloudY - 1, 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // LISTENING: audio waveform spectrum
      if (state === 'LISTENING') {
        const barCount = 7;
        const barStartX = 42;
        const barGap = 7;
        for (let i = 0; i < barCount; i++) {
          const bh = Math.abs(Math.sin(time * 0.008 + i * 0.9)) * 11 + 3;
          ctx.fillRect(barStartX + i * barGap, 62 - bh, 4, bh);
        }
      }

      ctx.restore(); // restore head tilt

      // Subtle retro scanline / OLED pixel grid effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let y = 0; y < H; y += 2) {
        ctx.fillRect(0, y, W, 1);
      }

      animFrame = requestAnimationFrame(render);
    };

    animFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrame);
  }, [state, emotion, activity]);

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

        {/* OLED Screen Bezel with Left & Right Robotic Arm Overlays */}
        <div className="relative flex items-center justify-center">
          {/* Left Robotic Arm Visualizer */}
          {showArms && (
            <div className="relative -mr-3 z-10 flex flex-col items-center">
              <svg width="48" height="120" className="overflow-visible drop-shadow-md">
                {/* Shoulder Servo Mount */}
                <circle cx="36" cy="30" r="7" fill="#1e293b" stroke="#00f0ff" strokeWidth="1.5" />
                <circle cx="36" cy="30" r="2.5" fill="#00f0ff" />
                
                {/* Upper Arm Segment */}
                {/* Angle mapped from -80 to 90 degrees */}
                {(() => {
                  const rad = ((armState.leftAngle - 90) * Math.PI) / 180;
                  const elbowX = 36 + Math.cos(rad) * 34;
                  const elbowY = 30 + Math.sin(rad) * 34;
                  const wristRad = rad + (armState.leftAngle > 0 ? 0.3 : -0.2);
                  const handX = elbowX + Math.cos(wristRad) * 26;
                  const handY = elbowY + Math.sin(wristRad) * 26;
                  return (
                    <g>
                      <line x1="36" y1="30" x2={elbowX} y2={elbowY} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                      <circle cx={elbowX} cy={elbowY} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                      {/* Left Hand Indicator */}
                      <circle cx={handX} cy={handY} r="4.5" fill={armState.leftHand === 'FIST' ? '#ef4444' : '#22c55e'} />
                    </g>
                  );
                })()}
              </svg>
              <span className="text-[8px] font-mono text-cyan-400/70 -mt-2">L:{armState.leftAngle}°</span>
            </div>
          )}

          {/* Center Screen */}
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
            <div className="absolute bottom-1 right-2 text-[9px] font-mono text-cyan-400/80 uppercase font-semibold flex items-center gap-1.5">
              <span>{state}</span>
              <span className="text-[8px] px-1 py-0.2 bg-cyan-950 border border-cyan-800 rounded text-cyan-300">
                {emotion}
              </span>
            </div>
            {activity !== 'IDLE' && (
              <div className="absolute bottom-1 left-2 text-[9px] font-mono text-amber-400 font-semibold uppercase">
                ACT: {activity}
              </div>
            )}
          </div>

          {/* Right Robotic Arm Visualizer */}
          {showArms && (
            <div className="relative -ml-3 z-10 flex flex-col items-center">
              <svg width="48" height="120" className="overflow-visible drop-shadow-md">
                {/* Shoulder Servo Mount */}
                <circle cx="12" cy="30" r="7" fill="#1e293b" stroke="#00f0ff" strokeWidth="1.5" />
                <circle cx="12" cy="30" r="2.5" fill="#00f0ff" />

                {/* Right Arm Segment */}
                {(() => {
                  const rad = ((90 - armState.rightAngle) * Math.PI) / 180;
                  const elbowX = 12 + Math.cos(rad) * 34;
                  const elbowY = 30 + Math.sin(rad) * 34;
                  const wristRad = rad + (armState.rightAngle > 0 ? -0.3 : 0.2);
                  const handX = elbowX + Math.cos(wristRad) * 26;
                  const handY = elbowY + Math.sin(wristRad) * 26;
                  return (
                    <g>
                      <line x1="12" y1="30" x2={elbowX} y2={elbowY} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />
                      <circle cx={elbowX} cy={elbowY} r="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
                      <line x1={elbowX} y1={elbowY} x2={handX} y2={handY} stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                      {/* Right Hand Indicator */}
                      <circle
                        cx={handX}
                        cy={handY}
                        r="4.5"
                        fill={
                          armState.rightHand === 'THUMBS_UP'
                            ? '#eab308'
                            : armState.rightHand === 'POINT'
                            ? '#a855f7'
                            : armState.rightHand === 'FIST'
                            ? '#ef4444'
                            : '#22c55e'
                        }
                      />
                    </g>
                  );
                })()}
              </svg>
              <span className="text-[8px] font-mono text-cyan-400/70 -mt-2">R:{armState.rightAngle}°</span>
            </div>
          )}
        </div>

        {/* Bottom Hardware Branding & Arm Control Toggle */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ESP32 COMPANION
          </span>
          <button
            onClick={() => setShowArms(!showArms)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
          >
            {showArms ? 'Hide Arms' : 'Show Arms'}
          </button>
          <span>~60 FPS</span>
        </div>
      </div>
    </div>
  );
};
