/**
 * HandRenderer.ts
 * Procedural Vector 5-Finger Cartoon Hand Renderer for TARA.
 *
 * DESIGN CONSTRAINTS:
 * - Simple solid hand shapes with rounded cartoon-like geometry.
 * - Five clearly visible fingers (Thumb, Index, Middle, Ring, Pinky).
 * - Minimal detail, clean silhouette, zero stickers, zero emojis.
 * - Matches TARA's OLED phosphor palette.
 * - Lightweight non-blocking vector drawing suitable for ESP32 SSD1306/SH1106 displays.
 */

import { TaraHandShape } from '../types';

export class HandRenderer {
  /**
   * Procedural drawing of a single cartoon hand with 5 clearly visible fingers.
   *
   * @param ctx Canvas 2D context
   * @param hx Wrist X position
   * @param hy Wrist Y position
   * @param angleRad Wrist rotation angle in radians
   * @param shape Desired hand shape
   * @param primaryColor Main phosphor color
   * @param bgColor Background cutout color for contrast
   * @param side -1 for left hand, 1 for right hand
   * @param scale Optional scale factor (default 1.0)
   */
  public static drawHand(
    ctx: CanvasRenderingContext2D,
    hx: number,
    hy: number,
    angleRad: number,
    shape: TaraHandShape | string,
    primaryColor: string,
    bgColor: string,
    side: number = 1,
    scale: number = 1.0
  ) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angleRad);
    ctx.scale(scale, scale);

    ctx.fillStyle = primaryColor;
    ctx.strokeStyle = primaryColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (shape) {
      case 'thumbs_up':
        this.renderThumbsUp(ctx, primaryColor, bgColor, side);
        break;

      case 'point_up':
        this.renderPointUp(ctx, primaryColor, bgColor, side);
        break;

      case 'point_side':
      case 'point':
        this.renderPointSide(ctx, primaryColor, bgColor, side);
        break;

      case 'fist':
      case 'close_hand':
        this.renderFist(ctx, primaryColor, bgColor, side);
        break;

      case 'grip':
        this.renderGrip(ctx, primaryColor, bgColor, side);
        break;

      case 'pinch':
        this.renderPinch(ctx, primaryColor, bgColor, side);
        break;

      case 'wave':
        this.renderWave(ctx, primaryColor, bgColor, side);
        break;

      case 'clap':
        this.renderClap(ctx, primaryColor, bgColor, side);
        break;

      case 'scissors':
        this.renderScissors(ctx, primaryColor, bgColor, side);
        break;

      case 'open_5_fingers':
      case 'open':
      default:
        this.renderOpenFiveFingers(ctx, primaryColor, bgColor, side);
        break;
    }

    ctx.restore();
  }

  /**
   * 1. OPEN 5-FINGER HAND
   * Rounded solid palm with 5 distinct, cleanly articulated cartoon fingers.
   */
  private static renderOpenFiveFingers(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Palm base: Solid rounded circle/capsule
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 5 Distinct Rounded Fingers (Thumb, Index, Middle, Ring, Pinky)
    // Angles and lengths defined relative to the palm center
    const fingerDefs = [
      { name: 'thumb', angle: -0.85 * side, len: 6.5, width: 3.2, ox: -2.5 * side, oy: -1 },
      { name: 'index', angle: -0.32 * side, len: 8.5, width: 2.8, ox: -1.2 * side, oy: -3.5 },
      { name: 'middle', angle: 0.0, len: 10.0, width: 2.9, ox: 0.5 * side, oy: -4 },
      { name: 'ring', angle: 0.35 * side, len: 8.5, width: 2.8, ox: 2.2 * side, oy: -3.5 },
      { name: 'pinky', angle: 0.72 * side, len: 6.8, width: 2.5, ox: 3.5 * side, oy: -2 },
    ];

    fingerDefs.forEach((f) => {
      ctx.lineWidth = f.width;
      ctx.beginPath();
      ctx.moveTo(f.ox, f.oy);
      const ex = f.ox + Math.sin(f.angle) * f.len;
      const ey = f.oy - Math.cos(f.angle) * f.len;
      ctx.lineTo(ex, ey);
      ctx.stroke();

      // Rounded tip dot
      ctx.beginPath();
      ctx.arc(ex, ey, f.width * 0.45, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle inner palm line accent in background color for crisp separation
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 1, 3, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();
  }

  /**
   * 2. THUMBS UP
   * Solid fist with 4 curled fingers and vertical thumb extending upwards.
   */
  private static renderThumbsUp(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Fist body
    ctx.beginPath();
    ctx.ellipse(0, 2, 5.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Curled fingers horizontal segmented bumps
    for (let i = 0; i < 4; i++) {
      const fy = -1 + i * 2;
      ctx.beginPath();
      ctx.ellipse(3 * side, fy, 2.2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Extended vertical Thumb with rounded cartoon tip
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(-1.5 * side, 1);
    ctx.lineTo(-2 * side, -9);
    ctx.stroke();

    // Thumb tip
    ctx.beginPath();
    ctx.arc(-2 * side, -9, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Knuckle divider accent
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(0, 5);
    ctx.stroke();
  }

  /**
   * 3. POINT UP
   * Index finger pointing straight up, thumb folded over curled fingers.
   */
  private static renderPointUp(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Fist body
    ctx.beginPath();
    ctx.ellipse(0, 2, 5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curled middle, ring, pinky
    for (let i = 0; i < 3; i++) {
      const fy = 1 + i * 2;
      ctx.beginPath();
      ctx.ellipse(3 * side, fy, 2, 1.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thumb folded over
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-3 * side, 3);
    ctx.lineTo(-0.5 * side, 1);
    ctx.stroke();

    // Extended Index Finger
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(-1 * side, -1);
    ctx.lineTo(-1 * side, -11);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-1 * side, -11, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 4. POINT SIDE
   * Index finger pointing forward/sideways with clean silhouette.
   */
  private static renderPointSide(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Palm/knuckle block
    ctx.beginPath();
    ctx.ellipse(-1 * side, 0, 4.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curled 3 fingers underneath
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-1 * side, 2 + i * 1.8, 2.2, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Folded thumb
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-3 * side, 0);
    ctx.lineTo(0, 1);
    ctx.stroke();

    // Extended Index Finger pointing in 'side' direction
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(9 * side, -2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(9 * side, -2, 2.0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * 5. FIST (CLOSE HAND)
   * 5-finger closed solid fist with rounded knuckles and thumb tucked over.
   */
  private static renderFist(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    ctx.beginPath();
    ctx.ellipse(0, 0, 5.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Curled finger ridges on top
    for (let i = 0; i < 4; i++) {
      const fx = -3 + i * 2;
      ctx.beginPath();
      ctx.arc(fx, -4.5, 1.8, Math.PI, 0);
      ctx.fill();
    }

    // Thumb folded horizontally across lower palm
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-3.5 * side, 1);
    ctx.lineTo(2 * side, 2);
    ctx.stroke();

    // Inner knuckle line
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -2);
    ctx.stroke();
  }

  /**
   * 6. GRIP
   * 5-finger hand grasping a prop (handle, spoon, book edge).
   */
  private static renderGrip(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Palm backing
    ctx.beginPath();
    ctx.ellipse(-1 * side, 0, 5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Wrapping fingers curled around front
    for (let i = 0; i < 4; i++) {
      const fy = -3 + i * 2.2;
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(-1 * side, fy);
      ctx.lineTo(4 * side, fy);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(4 * side, fy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Opposing thumb locking in from other side
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-3 * side, -2);
    ctx.lineTo(1 * side, -3);
    ctx.stroke();
  }

  /**
   * 7. PINCH
   * Thumb & index tips meeting, remaining 3 fingers relaxed.
   */
  private static renderPinch(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    ctx.beginPath();
    ctx.ellipse(0, 1, 4.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thumb & Index meeting at pinch point
    const pinchX = 4 * side;
    const pinchY = -4;

    // Index curve
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.quadraticCurveTo(2 * side, -6, pinchX, pinchY);
    ctx.stroke();

    // Thumb curve
    ctx.beginPath();
    ctx.moveTo(-2 * side, 0);
    ctx.quadraticCurveTo(0, -5, pinchX, pinchY);
    ctx.stroke();

    // Pinch contact dot
    ctx.beginPath();
    ctx.arc(pinchX, pinchY, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // Curled middle, ring, pinky below
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(-1 * side, 3 + i * 1.8, 2.0, 1.0, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * 8. WAVE
   * Expressive 5-finger open hand with dynamic fanned gesture.
   */
  private static renderWave(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Splayed open hand
    this.renderOpenFiveFingers(ctx, color, bgColor, side);

    // Dynamic motion arc trail behind fingers
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -8, 12, -0.3 * Math.PI, 0.1 * Math.PI, false);
    ctx.stroke();
  }

  /**
   * 9. CLAP
   * 5-finger profile hand with aligned fingers meeting.
   */
  private static renderClap(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    ctx.beginPath();
    ctx.ellipse(0, 1, 4.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4 Aligned fingers extended toward center
    for (let i = 0; i < 4; i++) {
      const fy = -3 + i * 2;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, fy);
      ctx.lineTo(6 * side, fy - 1);
      ctx.stroke();
    }

    // Thumb angled slightly
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-1 * side, 2);
    ctx.lineTo(3 * side, 5);
    ctx.stroke();
  }

  /**
   * 10. SCISSORS (For Rock Paper Scissors game)
   * Two extended fingers (index and middle in V-shape), thumb over ring and pinky.
   */
  private static renderScissors(
    ctx: CanvasRenderingContext2D,
    color: string,
    bgColor: string,
    side: number
  ) {
    // Fist base
    ctx.beginPath();
    ctx.ellipse(0, 2, 5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Curled ring and pinky
    ctx.beginPath();
    ctx.ellipse(2 * side, 2, 2, 1.2, 0, 0, Math.PI * 2);
    ctx.ellipse(2 * side, 4, 1.8, 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Folded thumb
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-2 * side, 2);
    ctx.lineTo(1 * side, 1);
    ctx.stroke();

    // Extended Index finger (angled outward)
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(-1 * side, 0);
    ctx.lineTo(-4 * side, -10);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-4 * side, -10, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Extended Middle finger (angled inward)
    ctx.beginPath();
    ctx.moveTo(1 * side, 0);
    ctx.lineTo(3 * side, -11);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(3 * side, -11, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
