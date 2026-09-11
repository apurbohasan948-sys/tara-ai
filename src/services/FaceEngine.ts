/**
 * FaceEngine.ts - High Fidelity Layered Display Face Renderer for TARA
 *
 * CRITICAL DESIGN MANDATE:
 * - TARA's HEAD & FACE BODY NEVER ROTATE OR DISPLACE PHYSICALLY.
 * - Entire screen position remains locked.
 * - All animations occur INSIDE the 128x64 (or scaled) OLED display canvas.
 * - Purely visual display arms (NO motors/servos).
 * - Real visual microphone when singing.
 * - Real cooking scene (stove, flame, pot, steam, stirring utensil).
 * - Real book reading, music listening with headphones/equalizer, sleeping with ZZZ.
 */

import { activitySceneManager } from './ActivitySceneManager';
import { animationCoordinator, CoordinatedFrame } from './AnimationCoordinator';
import { armController } from './ArmController';
import { HandRenderer } from './HandRenderer';

export interface FaceEngineOptions {
  width: number;
  height: number;
  palette: 'cyan' | 'amber' | 'white' | 'green';
  showArms: boolean;
  showScanlines: boolean;
  pixelGrid: boolean;
}

export class FaceEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private options: FaceEngineOptions = {
    width: 256,
    height: 128,
    palette: 'cyan',
    showArms: true,
    showScanlines: true,
    pixelGrid: false,
  };

  private frameCount: number = 0;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Colors
  private getColorScheme() {
    switch (this.options.palette) {
      case 'amber':
        return {
          bg: '#140c02',
          primary: '#ffb300',
          secondary: '#ff8f00',
          glow: 'rgba(255, 179, 0, 0.4)',
          dim: '#664200',
          accent: '#ffe082',
        };
      case 'white':
        return {
          bg: '#0a0a0f',
          primary: '#e8f0fe',
          secondary: '#b0bec5',
          glow: 'rgba(232, 240, 254, 0.35)',
          dim: '#455a64',
          accent: '#ffffff',
        };
      case 'green':
        return {
          bg: '#041407',
          primary: '#00e676',
          secondary: '#00c853',
          glow: 'rgba(0, 230, 118, 0.35)',
          dim: '#1b5e20',
          accent: '#b9f6ca',
        };
      case 'cyan':
      default:
        return {
          bg: '#030d17',
          primary: '#00e5ff',
          secondary: '#00b0ff',
          glow: 'rgba(0, 229, 255, 0.35)',
          dim: '#01579b',
          accent: '#80d8ff',
        };
    }
  }

  public attach(canvas: HTMLCanvasElement, options?: Partial<FaceEngineOptions>) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    if (options) {
      this.options = { ...this.options, ...options };
    }
    this.start();
  }

  public setOptions(options: Partial<FaceEngineOptions>) {
    this.options = { ...this.options, ...options };
  }

  public getOptions(): FaceEngineOptions {
    return { ...this.options };
  }

  public start() {
    if (this.animFrameId !== null) return;
    this.lastTime = performance.now();
    const loop = (time: number) => {
      const dt = Math.min(time - this.lastTime, 100);
      this.lastTime = time;
      this.updateAndRender(dt);
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public stop() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateAndRender(dt: number) {
    if (!this.ctx || !this.canvas) return;

    this.frameCount++;
    animationCoordinator.update(dt);
    const frame = animationCoordinator.getCoordinatedFrame();

    const colors = this.getColorScheme();
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // 1. LAYER: BASE BACKGROUND (OLED DEEP BLACK)
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, w, h);

    // Subtle OLED bezel boundary guide (clean rounded rectangle inside display)
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // 2. LAYER: ACTIVITY BACKGROUND PROPS (e.g. stove burner, headphones)
    this.renderActivityBackground(ctx, frame, colors, w, h);

    // 3. LAYER: EYES & EYEBROWS (Fixed stable display position, dynamic pupils)
    this.renderEyes(ctx, frame, colors, w, h);

    // 4. LAYER: CHEEKS / BLUSH
    if (frame.blush && frame.blushIntensity > 0) {
      this.renderBlush(ctx, frame, colors, w, h);
    }

    // 5. LAYER: MOUTH STATE (Voice-synchronized or emotional shape)
    this.renderMouth(ctx, frame, colors, w, h);

    // 6. LAYER: ACTIVITY FOREGROUND PROPS (Cooking Pot/Flame/Steam, Real Microphone, Book)
    this.renderActivityForeground(ctx, frame, colors, w, h);

    // 7. LAYER: STANDALONE FLOATING ANIMATED HANDS (NO ARMS, NO MOTORS)
    if (this.options.showArms) {
      this.renderStandaloneHands(ctx, frame, colors, w, h);
    }

    // 8. LAYER: TEMPORARY EFFECTS (Sweat drop, Tears, ZZZ, Sparkles)
    this.renderEffects(ctx, frame, colors, w, h);

    // 9. LAYER: SCANLINES / PIXEL GRID FILTER
    if (this.options.showScanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }
    }
  }

  // ==========================================
  // EYES & EYEBROWS
  // ==========================================
  private renderEyes(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const eyeSpacing = w * 0.22;
    const centerY = h * 0.42;
    const leftEyeX = w * 0.5 - eyeSpacing;
    const rightEyeX = w * 0.5 + eyeSpacing;
    const eyeRadiusX = w * 0.11;
    const eyeRadiusY = h * 0.24;

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 8;

    // Render Left and Right Eyes
    this.drawSingleEye(ctx, leftEyeX, centerY, eyeRadiusX, eyeRadiusY, frame, colors, -1);
    this.drawSingleEye(ctx, rightEyeX, centerY, eyeRadiusX, eyeRadiusY, frame, colors, 1);

    // Eyebrows
    this.drawEyebrow(ctx, leftEyeX, centerY - eyeRadiusY - 4 + frame.eyebrowOffset, eyeRadiusX, frame.eyebrowAngle, colors, -1);
    this.drawEyebrow(ctx, rightEyeX, centerY - eyeRadiusY - 4 + frame.eyebrowOffset, eyeRadiusX, -frame.eyebrowAngle, colors, 1);

    ctx.restore();
  }

  private drawSingleEye(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    side: number // -1 for left, 1 for right
  ) {
    ctx.save();

    // Specific eye variations
    if (frame.eyeState === 'blink') {
      // Crisp horizontal slit
      ctx.fillStyle = colors.primary;
      ctx.fillRect(cx - rx, cy - 1.5, rx * 2, 3);
      ctx.restore();
      return;
    }

    if (frame.eyeState === 'closed') {
      // Soft curved resting arc
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy + (frame.eyelidCurve >= 0 ? -4 : 4), rx * 0.9, 0.1 * Math.PI, 0.9 * Math.PI, frame.eyelidCurve >= 0);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (frame.eyeState === 'wink' && side === 1) {
      // Right eye winking arc with cute lash
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(cx, cy - 2, rx * 0.9, 0.15 * Math.PI, 0.85 * Math.PI, false);
      ctx.stroke();
      // small lash tip
      ctx.beginPath();
      ctx.moveTo(cx + rx * 0.8, cy + 2);
      ctx.lineTo(cx + rx * 1.1, cy - 3);
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (frame.eyeState === 'dizzy_spiral') {
      // Swirling concentric rings
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2.5;
      const angle = (this.frameCount * 0.1) * side;
      ctx.beginPath();
      for (let a = 0; a < 6 * Math.PI; a += 0.2) {
        const r = (a / (6 * Math.PI)) * rx;
        const x = cx + Math.cos(a + angle) * r;
        const y = cy + Math.sin(a + angle) * (r * 0.8);
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (frame.eyeState === 'hearts') {
      // Heart-shaped pupil glow
      this.drawHeart(ctx, cx, cy, rx * 0.85, colors.primary);
      ctx.restore();
      return;
    }

    // Standard Open/Squint/Wide Sclera & Pupils
    let actualRy = ry;
    if (frame.eyeState === 'squint' || frame.eyeState === 'half_closed') {
      actualRy = ry * 0.45;
    } else if (frame.eyeState === 'wide') {
      actualRy = ry * 1.15;
    }

    // Outer Eye Sclera (Pill / Rounded Capsule)
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, actualRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil clip
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, actualRy, 0, 0, Math.PI * 2);
    ctx.clip();

    // Pupil Pupil inside eye (Darker Center with highlight)
    const pupilX = cx + frame.pupilOffsetX * (rx * 0.65);
    const pupilY = cy + frame.pupilOffsetY * (actualRy * 0.65);
    const prx = rx * 0.55 * frame.pupilScale;
    const pry = actualRy * 0.55 * frame.pupilScale;

    // Pupil body
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.ellipse(pupilX, pupilY, prx, pry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil core highlight (sparkle or white reflection)
    if (frame.sparkle) {
      this.drawSparkle(ctx, pupilX - prx * 0.3, pupilY - pry * 0.3, 4.5, colors.accent);
    } else {
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(pupilX - prx * 0.3, pupilY - pry * 0.3, prx * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // end clip

    // Eyelid curvature cut (e.g. happy eyes have bottom cut arc)
    if (frame.eyelidCurve > 0.3) {
      ctx.fillStyle = colors.bg;
      ctx.beginPath();
      ctx.ellipse(cx, cy + actualRy * 0.9, rx * 1.2, actualRy * 0.55 * frame.eyelidCurve, 0, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawEyebrow(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    length: number,
    angleDeg: number,
    colors: ReturnType<typeof this.getColorScheme>,
    side: number
  ) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((angleDeg * Math.PI) / 180);

    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-length * 0.7, 0);
    ctx.lineTo(length * 0.7, 0);
    ctx.stroke();

    ctx.restore();
  }

  // ==========================================
  // BLUSH / CHEEKS
  // ==========================================
  private renderBlush(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const y = h * 0.62;
    const offset = w * 0.35;
    const leftX = w * 0.5 - offset;
    const rightX = w * 0.5 + offset;

    ctx.save();
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = 2;
    ctx.globalAlpha = Math.min(1, frame.blushIntensity);

    // Cute diagonal anime blush streaks
    for (const bx of [leftX, rightX]) {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(bx + i * 4 - 3, y + 4);
        ctx.lineTo(bx + i * 4 + 3, y - 4);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ==========================================
  // MOUTH SHAPES
  // ==========================================
  private renderMouth(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const mx = w * 0.5;
    const my = h * 0.74;

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;
    ctx.strokeStyle = colors.primary;
    ctx.fillStyle = colors.primary;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (frame.mouthState) {
      case 'CLOSED':
        ctx.beginPath();
        ctx.moveTo(mx - 8, my);
        ctx.lineTo(mx + 8, my);
        ctx.stroke();
        break;

      case 'SMALL':
        ctx.beginPath();
        ctx.arc(mx, my - 2, 6, 0.2 * Math.PI, 0.8 * Math.PI, false);
        ctx.stroke();
        break;

      case 'SMILE':
        ctx.beginPath();
        ctx.arc(mx, my - 4, 16, 0.15 * Math.PI, 0.85 * Math.PI, false);
        ctx.stroke();
        break;

      case 'OPEN_SMALL':
        ctx.beginPath();
        ctx.ellipse(mx, my, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'OPEN_MEDIUM':
        ctx.beginPath();
        ctx.ellipse(mx, my, 13, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'OPEN_WIDE':
        ctx.beginPath();
        ctx.ellipse(mx, my, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Tooth line highlight
        ctx.fillStyle = colors.bg;
        ctx.fillRect(mx - 10, my - 10, 20, 4);
        break;

      case 'O_SHAPE':
        ctx.beginPath();
        ctx.ellipse(mx, my, 8, 11, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'A_SHAPE':
        ctx.beginPath();
        ctx.moveTo(mx - 12, my - 4);
        ctx.lineTo(mx + 12, my - 4);
        ctx.lineTo(mx, my + 10);
        ctx.closePath();
        ctx.fill();
        break;

      case 'E_SHAPE':
        ctx.beginPath();
        ctx.ellipse(mx, my, 15, 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(mx - 12, my);
        ctx.lineTo(mx + 12, my);
        ctx.stroke();
        break;

      case 'LAUGHING': {
        // Wide crescent toothy laugh
        ctx.beginPath();
        ctx.arc(mx, my - 6, 18, 0.1 * Math.PI, 0.9 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
        break;
      }

      case 'SINGING': {
        // Rhythmic pulsing singing oval with slight bounce
        const pulse = 1 + Math.sin(this.frameCount * 0.25) * 0.25;
        ctx.beginPath();
        ctx.ellipse(mx, my, 9 * pulse, 12 * pulse, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'SPEAKING':
      default: {
        // Dynamic speaking mouth shape
        const openH = 4 + frame.audioAmplitude * 12;
        const openW = 8 + frame.audioAmplitude * 8;
        ctx.beginPath();
        ctx.ellipse(mx, my, openW, openH, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  // ==========================================
  // ACTIVITY BACKGROUND PROPS
  // ==========================================
  private renderActivityBackground(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    if (frame.activity === 'MUSIC') {
      // Visual Headphones framing the display
      const musicState = activitySceneManager.getMusicState();
      ctx.save();
      ctx.strokeStyle = colors.secondary;
      ctx.lineWidth = 4;

      // Top headband arc
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.45, w * 0.46, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Left & right ear pads with sound wave pulse
      const pulse = musicState.headphonePulse * 4;
      ctx.fillStyle = colors.primary;
      ctx.fillRect(w * 0.04 - pulse * 0.5, h * 0.35, 8 + pulse, 24);
      ctx.fillRect(w * 0.96 - 8 - pulse * 0.5, h * 0.35, 8 + pulse, 24);

      // Equalizer bars along bottom edge
      const barCount = musicState.bars.length;
      const barW = 8;
      const gap = 5;
      const totalW = barCount * (barW + gap);
      const startX = (w - totalW) * 0.5;

      ctx.fillStyle = colors.secondary;
      musicState.bars.forEach((barHeight, i) => {
        const bx = startX + i * (barW + gap);
        const bh = (barHeight / 30) * 16;
        ctx.fillRect(bx, h - 10 - bh, barW, bh);
      });

      ctx.restore();
    }
  }

  // ==========================================
  // ACTIVITY FOREGROUND PROPS (MIC, COOKING, BOOK)
  // ==========================================
  private renderActivityForeground(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    if (frame.activity === 'SINGING') {
      this.renderRealMicrophone(ctx, colors, w, h);
    } else if (frame.activity === 'COOKING') {
      this.renderCookingScene(ctx, colors, w, h);
    } else if (frame.activity === 'READING') {
      this.renderReadingScene(ctx, colors, w, h);
    } else if (frame.activity === 'CHECKING_TIME') {
      this.renderCheckingTimeWidget(ctx, colors, w, h);
    } else if (frame.activity === 'THINKING') {
      this.renderThinkingThoughtBubbles(ctx, colors, w, h);
    } else if (frame.activity === 'DANCING') {
      this.renderDancingRhythmNotes(ctx, colors, w, h);
    } else if (frame.activity === 'LEARNING') {
      this.renderLearningDataMatrix(ctx, colors, w, h);
    }
  }

  private renderCheckingTimeWidget(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const timeState = activitySceneManager.getCheckingTimeState();
    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;
    ctx.fillStyle = colors.dim;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;

    // Small OLED digital clock capsule at bottom-center
    const clockW = 76;
    const clockH = 18;
    const cx = (w - clockW) * 0.5;
    const cy = h - 22;

    ctx.beginPath();
    ctx.roundRect(cx, cy, clockW, clockH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeState.timeString || '--:--', cx + clockW * 0.5, cy + clockH * 0.5 + 1);
    ctx.restore();
  }

  private renderThinkingThoughtBubbles(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const think = activitySceneManager.getThinkingState();
    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 5;
    ctx.fillStyle = colors.accent;

    // 3 ascending thought bubbles near upper right
    const pulse = think.bubblePulse * 2;
    ctx.beginPath();
    ctx.arc(w * 0.76, h * 0.28, 2.5 + pulse * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.20, 3.5 + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(w * 0.90, h * 0.12, 5.0 + pulse * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderDancingRhythmNotes(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const dance = activitySceneManager.getDancingState();
    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 4;
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 12px monospace';

    // Rhythmic sparkles on left and right edges
    const symbols = ['♫', '♪', '✦', '♬'];
    const s1 = symbols[Math.floor((this.frameCount * 0.05) % symbols.length)];
    const s2 = symbols[Math.floor((this.frameCount * 0.05 + 2) % symbols.length)];

    ctx.fillText(s1, w * 0.08, h * 0.35 + Math.sin(this.frameCount * 0.2) * 5);
    ctx.fillText(s2, w * 0.88, h * 0.35 - Math.sin(this.frameCount * 0.2) * 5);
    ctx.restore();
  }

  private renderLearningDataMatrix(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const learn = activitySceneManager.getLearningState();
    ctx.save();
    ctx.strokeStyle = colors.primary;
    ctx.fillStyle = colors.accent;
    ctx.lineWidth = 1;

    // Lower telemetry data scanline
    const barY = h - 8;
    ctx.strokeRect(w * 0.2, barY, w * 0.6, 4);
    ctx.fillRect(w * 0.2 + 1, barY + 1, (w * 0.6 - 2) * (learn.dataProgress / 100), 2);
    ctx.restore();
  }

  /**
   * 4. REAL RECOGNIZABLE MICROPHONE
   * Explicitly constructed with head/grille, metal collar, handle, stand/holding hand.
   */
  private renderRealMicrophone(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const singingState = activitySceneManager.getSingingState();
    const micY = h * 0.58 + (1 - singingState.micHeight) * 40 + singingState.micWobble;
    const micX = w * 0.5 + 32;

    ctx.save();
    ctx.translate(micX, micY);
    ctx.rotate((-18 * Math.PI) / 180);

    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;

    // 1. Microphone Handle (Cylindrical body)
    ctx.fillStyle = colors.dim;
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-4, 6, 8, 28, 2);
    ctx.fill();
    ctx.stroke();

    // 2. Connector / Cable Collar at bottom
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(-2, 34, 4, 6);

    // 3. Microphone Metal Collar Ring
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-6, 2, 12, 4);

    // 4. Microphone Capsule / Head Grille (Domed capsule with mesh cross-hatch)
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.ellipse(0, -6, 8.5, 10.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Grille mesh texture details
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 1;
    // horizontal bands
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(6, -8);
    ctx.moveTo(-7, -4);
    ctx.lineTo(7, -4);
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.stroke();

    // vertical center spine
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, 2);
    ctx.stroke();

    ctx.restore();

    // Music note particles
    ctx.save();
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 13px monospace';
    singingState.notes.forEach((note) => {
      ctx.globalAlpha = Math.max(0, note.opacity);
      ctx.fillText(note.symbol, note.x, note.y);
    });
    ctx.restore();
  }

  /**
   * 7. COOKING SCENE
   * Complete cooking scene with:
   * - Stove / Burner base
   * - 2-3 frame animated flame
   * - Cooking pot / pan with handles
   * - Rising steam particles
   * - Stirring utensil
   */
  private renderCookingScene(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const cookingState = activitySceneManager.getCookingState();
    const potX = w * 0.5;
    const potY = h * 0.72;

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;

    // 1. Stove / Burner Plate
    ctx.fillStyle = colors.dim;
    ctx.fillRect(potX - 32, potY + 16, 64, 5);
    ctx.strokeStyle = colors.secondary;
    ctx.strokeRect(potX - 30, potY + 16, 60, 4);

    // 2. Animated Flame (2-3 frame variation)
    if (['FLAME_ON', 'POT_APPEAR', 'STEAM_START', 'STIR', 'CHECK_FOOD', 'STEAM_CONTINUE', 'HAPPY_FOCUSED'].includes(cookingState.stage)) {
      ctx.fillStyle = colors.accent;
      const fFrame = cookingState.flameFrame;
      const flamePoints = [
        { x: potX - 16, h: fFrame === 0 ? 9 : fFrame === 1 ? 13 : 8 },
        { x: potX - 8, h: fFrame === 1 ? 14 : fFrame === 2 ? 10 : 12 },
        { x: potX, h: fFrame === 2 ? 15 : fFrame === 0 ? 11 : 14 },
        { x: potX + 8, h: fFrame === 0 ? 13 : fFrame === 1 ? 9 : 12 },
        { x: potX + 16, h: fFrame === 1 ? 10 : fFrame === 2 ? 14 : 9 },
      ];

      flamePoints.forEach((fp) => {
        ctx.beginPath();
        ctx.moveTo(fp.x - 3, potY + 16);
        ctx.lineTo(fp.x, potY + 16 - fp.h);
        ctx.lineTo(fp.x + 3, potY + 16);
        ctx.closePath();
        ctx.fill();
      });
    }

    // 3. Cooking Pot / Pan
    if (cookingState.stage !== 'COOKING_START' && cookingState.stage !== 'STOVE_ON') {
      // Pot Body
      ctx.fillStyle = colors.primary;
      ctx.beginPath();
      ctx.roundRect(potX - 22, potY, 44, 16, [0, 0, 8, 8]);
      ctx.fill();

      // Pot Rim
      ctx.fillStyle = colors.secondary;
      ctx.fillRect(potX - 25, potY - 2, 50, 4);

      // Pot Left & Right Handles
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(potX - 26, potY + 5, 4, Math.PI * 0.5, Math.PI * 1.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(potX + 26, potY + 5, 4, Math.PI * 1.5, Math.PI * 0.5);
      ctx.stroke();

      // Stirring Utensil (Wooden Spoon / Spatula)
      const spoonAngle = Math.sin(cookingState.stirAngle) * 0.35 - 0.2;
      ctx.save();
      ctx.translate(potX + 4, potY + 4);
      ctx.rotate(spoonAngle);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(-2, -26, 4, 28);
      // Spoon head oval inside pot
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 4. Rising Steam Particles
    ctx.fillStyle = colors.accent;
    cookingState.steamParticles.forEach((p) => {
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * 8. READING SCENE
   * Book with spine, pages, page flip animation, held by hands.
   */
  private renderReadingScene(
    ctx: CanvasRenderingContext2D,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const readingState = activitySceneManager.getReadingState();
    const bx = w * 0.5;
    const by = h * 0.78;

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;

    // Book Cover & Pages
    ctx.fillStyle = colors.dim;
    ctx.beginPath();
    ctx.roundRect(bx - 36, by - 12, 72, 24, 3);
    ctx.fill();
    ctx.strokeStyle = colors.primary;
    ctx.stroke();

    // Open Book Left Page & Right Page
    ctx.fillStyle = colors.primary;
    ctx.fillRect(bx - 32, by - 10, 30, 20);
    ctx.fillRect(bx + 2, by - 10, 30, 20);

    // Book spine center line
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by - 10);
    ctx.lineTo(bx, by + 10);
    ctx.stroke();

    // Text lines inside pages
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 3; row++) {
      const ly = by - 6 + row * 6;
      ctx.beginPath();
      ctx.moveTo(bx - 28, ly);
      ctx.lineTo(bx - 6, ly);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(bx + 6, ly);
      ctx.lineTo(bx + 28, ly);
      ctx.stroke();
    }

    // Page flip curl
    if (readingState.pageFlip > 0) {
      const curl = readingState.pageFlip * 20;
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(bx, by - 10);
      ctx.lineTo(bx + 20 - curl, by - 8);
      ctx.lineTo(bx + 20 - curl, by + 10);
      ctx.lineTo(bx, by + 10);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  // ==========================================
  // 5. STANDALONE FLOATING ANIMATED HANDS (NO ARMS, NO MOTORS)
  // ==========================================
  private renderStandaloneHands(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    const pose = armController.getRenderPose(w, h);

    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 4;
    ctx.strokeStyle = colors.primary;
    ctx.fillStyle = colors.primary;
    ctx.lineWidth = 3.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 1. Render Left Standalone Hand (if active / visible)
    if (pose.left.visible) {
      HandRenderer.drawHand(
        ctx,
        pose.left.x,
        pose.left.y,
        pose.left.rotation,
        pose.left.shape,
        colors.primary,
        colors.bg,
        -1,
        pose.left.scale || 1.35
      );
    }

    // 2. Render Right Standalone Hand (if active / visible)
    if (pose.right.visible) {
      HandRenderer.drawHand(
        ctx,
        pose.right.x,
        pose.right.y,
        pose.right.rotation,
        pose.right.shape,
        colors.primary,
        colors.bg,
        1,
        pose.right.scale || 1.35
      );
    }

    ctx.restore();
  }

  // ==========================================
  // TEMPORARY EFFECTS (SWEAT, TEARS, ZZZ)
  // ==========================================
  private renderEffects(
    ctx: CanvasRenderingContext2D,
    frame: CoordinatedFrame,
    colors: ReturnType<typeof this.getColorScheme>,
    w: number,
    h: number
  ) {
    ctx.save();
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 6;

    // 1. Sweat drop on forehead/temple
    if (frame.sweatDrop) {
      const dropX = w * 0.78;
      const dropY = h * 0.22 + (Math.sin(this.frameCount * 0.1) * 2);
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.moveTo(dropX, dropY - 5);
      ctx.quadraticCurveTo(dropX + 4, dropY + 3, dropX, dropY + 5);
      ctx.quadraticCurveTo(dropX - 4, dropY + 3, dropX, dropY - 5);
      ctx.fill();
    }

    // 2. Tears streaming down cheeks
    if (frame.tears) {
      ctx.fillStyle = colors.accent;
      const tearY = h * 0.58 + (this.frameCount * 0.8) % 18;
      ctx.beginPath();
      ctx.arc(w * 0.32, tearY, 2.5, 0, Math.PI * 2);
      ctx.arc(w * 0.68, tearY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Sleeping ZZZ floating upwards
    if (frame.activity === 'SLEEPING') {
      const sleepState = activitySceneManager.getSleepingState();
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 12px monospace';
      sleepState.zzzParticles.forEach((z) => {
        ctx.globalAlpha = Math.max(0, z.opacity);
        ctx.save();
        ctx.translate(z.x, z.y);
        ctx.scale(z.scale, z.scale);
        ctx.fillText('Z', 0, 0);
        ctx.restore();
      });
    }

    ctx.restore();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const topCurveHeight = size * 0.3;
    ctx.moveTo(x, y + topCurveHeight);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
    ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
    ctx.closePath();
    ctx.fill();
  }

  private drawSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
    ctx.quadraticCurveTo(x, y, x - radius, y);
    ctx.quadraticCurveTo(x, y, x, y - radius);
    ctx.closePath();
    ctx.fill();
  }
}

export const faceEngine = new FaceEngine();
