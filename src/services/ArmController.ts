/**
 * ArmController.ts - Standalone Floating Hand Animation Controller
 *
 * MANDATORY DESIGN DIRECTIVE:
 * - NO UPPER ARMS.
 * - NO FOREARMS.
 * - NO ELBOWS.
 * - NO SHOULDER-TO-HAND CONNECTING SEGMENTS.
 * - ONLY STANDALONE FLOATING ANIMATED 5-FINGER CARTOON HANDS.
 * - Pure display animation - ZERO MOTORS, ZERO SERVOS, ZERO GPIO.
 */

import { TaraArmGesture, TaraHandShape, TaraProp } from '../types';

export interface StandaloneHandState {
  x: number;          // Screen pixel X position
  y: number;          // Screen pixel Y position
  rotation: number;   // Rotation angle in radians
  shape: TaraHandShape;
  visible: boolean;
  scale: number;
  side: number;       // -1 = left, 1 = right
  // Legacy telemetry compatibility
  shoulder: number;
  elbow: number;
  wrist: number;
  handShape: TaraHandShape;
}

export interface HandPoseRenderData {
  left: StandaloneHandState;
  right: StandaloneHandState;
  propHeld?: TaraProp;
  gesture: TaraArmGesture;
}

export interface ArmPoseConfig {
  left: {
    shoulder: number;
    elbow: number;
    wrist: number;
    handShape: TaraHandShape;
  };
  right: {
    shoulder: number;
    elbow: number;
    wrist: number;
    handShape: TaraHandShape;
  };
  propHeld?: TaraProp;
  animationRate?: number;
}

export const GESTURE_POSES: Record<TaraArmGesture, ArmPoseConfig> = {
  IDLE: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
  },
  WAVE: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 20, handShape: 'wave' },
    animationRate: 6,
  },
  GREETING: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 15, handShape: 'open_5_fingers' },
    animationRate: 3,
  },
  POINT_LEFT: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'point_side' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
  },
  POINT_RIGHT: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'point_side' },
  },
  POINT_UP: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'point_up' },
  },
  POINT: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'point_side' },
  },
  THUMBS_UP: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'thumbs_up' },
  },
  CLAP: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'clap' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'clap' },
    animationRate: 6,
  },
  OPEN_HAND: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
  },
  CLOSE_HAND: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'fist' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'fist' },
  },
  HOLD_MIC: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'grip' },
    propHeld: 'MICROPHONE',
    animationRate: 2,
  },
  HOLD_BOOK: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'grip' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'grip' },
    propHeld: 'BOOK',
    animationRate: 1,
  },
  STIR: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'grip' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'grip' },
    propHeld: 'UTENSIL',
    animationRate: 4,
  },
  CELEBRATE: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    animationRate: 5,
  },
  THINKING: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'pinch' },
  },
  LISTENING: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    animationRate: 2,
  },
  PLAYING: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    animationRate: 5,
  },
  RAISE_HAND: {
    left: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
    right: { shoulder: 0, elbow: 0, wrist: 0, handShape: 'open_5_fingers' },
  },
};

export class ArmController {
  private currentGesture: TaraArmGesture = 'IDLE';
  private targetGesture: TaraArmGesture = 'IDLE';
  private animTime: number = 0;

  public setGesture(gesture: TaraArmGesture) {
    this.targetGesture = gesture;
    this.currentGesture = gesture;
  }

  public getGesture(): TaraArmGesture {
    return this.currentGesture;
  }

  public update(dtMs: number) {
    this.animTime += dtMs / 1000;
  }

  /**
   * Calculates real-time standalone floating hand coordinates and shapes.
   * NO UPPER ARMS, NO FOREARMS, NO ELBOWS, NO SHOULDER CONNECTIONS.
   */
  public getRenderPose(w: number = 320, h: number = 160, timeOverride?: number): HandPoseRenderData {
    const t = timeOverride !== undefined ? timeOverride : this.animTime;
    const base = GESTURE_POSES[this.currentGesture] || GESTURE_POSES.IDLE;

    // Default resting values for standalone floating hands
    let left: StandaloneHandState = {
      x: w * 0.16,
      y: h * 0.82 + Math.sin(t * 1.8) * 3,
      rotation: 0.1,
      shape: 'open_5_fingers',
      visible: true,
      scale: 1.35,
      side: -1,
      shoulder: 0,
      elbow: 0,
      wrist: 0,
      handShape: 'open_5_fingers',
    };

    let right: StandaloneHandState = {
      x: w * 0.84,
      y: h * 0.82 + Math.sin(t * 1.8 + 0.5) * 3,
      rotation: -0.1,
      shape: 'open_5_fingers',
      visible: true,
      scale: 1.35,
      side: 1,
      shoulder: 0,
      elbow: 0,
      wrist: 0,
      handShape: 'open_5_fingers',
    };

    switch (this.currentGesture) {
      case 'WAVE':
        // Standalone hand moves gently side-to-side on the right
        left.visible = false;
        right.visible = true;
        right.shape = 'open_5_fingers';
        right.x = w * 0.82 + Math.sin(t * 5.5) * 12;
        right.y = h * 0.46 + Math.cos(t * 2.8) * 3;
        right.rotation = (Math.sin(t * 5.5) * 22 * Math.PI) / 180;
        right.scale = 1.45;
        break;

      case 'GREETING':
        // Standalone open hand appears and performs a small welcoming wave
        left.visible = false;
        right.visible = true;
        right.shape = 'open_5_fingers';
        right.x = w * 0.80 + Math.sin(t * 3.5) * 8;
        right.y = h * 0.42;
        right.rotation = (Math.sin(t * 3.5) * 16 * Math.PI) / 180;
        right.scale = 1.4;
        break;

      case 'POINT_LEFT':
        left.visible = true;
        right.visible = false;
        left.shape = 'point_side';
        left.x = w * 0.20 + Math.sin(t * 3) * 5;
        left.y = h * 0.50;
        left.rotation = 0;
        left.scale = 1.4;
        break;

      case 'POINT_RIGHT':
      case 'POINT':
        left.visible = false;
        right.visible = true;
        right.shape = 'point_side';
        right.x = w * 0.80 + Math.sin(t * 3) * 5;
        right.y = h * 0.50;
        right.rotation = 0;
        right.scale = 1.4;
        break;

      case 'POINT_UP':
        left.visible = false;
        right.visible = true;
        right.shape = 'point_up';
        right.x = w * 0.80;
        right.y = h * 0.35 + Math.sin(t * 3) * 4;
        right.rotation = 0;
        right.scale = 1.4;
        break;

      case 'THUMBS_UP':
        // Standalone hand changes into a thumbs-up pose
        left.visible = false;
        right.visible = true;
        right.shape = 'thumbs_up';
        right.x = w * 0.80;
        right.y = h * 0.48 + Math.sin(t * 3.5) * 4;
        right.rotation = -0.05;
        right.scale = 1.45;
        break;

      case 'CLAP':
        // Two standalone hands move toward each other and separate
        {
          const clapProgress = Math.abs(Math.sin(t * 7)); // 0 = palms meet, 1 = separated
          const clapY = h * 0.65;
          left.visible = true;
          right.visible = true;
          left.shape = 'clap';
          right.shape = 'clap';
          left.x = w * 0.5 - 14 - clapProgress * 28;
          left.y = clapY;
          left.rotation = -0.08;
          left.scale = 1.4;

          right.x = w * 0.5 + 14 + clapProgress * 28;
          right.y = clapY;
          right.rotation = 0.08;
          right.scale = 1.4;
        }
        break;

      case 'OPEN_HAND':
        // Two standalone hands floating open forward
        left.visible = true;
        right.visible = true;
        left.shape = 'open_5_fingers';
        right.shape = 'open_5_fingers';
        left.x = w * 0.24;
        left.y = h * 0.68 + Math.sin(t * 2) * 3;
        left.rotation = 0.15;
        left.scale = 1.4;

        right.x = w * 0.76;
        right.y = h * 0.68 + Math.sin(t * 2) * 3;
        right.rotation = -0.15;
        right.scale = 1.4;
        break;

      case 'CLOSE_HAND':
        left.visible = true;
        right.visible = true;
        left.shape = 'fist';
        right.shape = 'fist';
        left.x = w * 0.24;
        left.y = h * 0.68 + Math.sin(t * 2.5) * 2;
        left.rotation = 0.12;
        left.scale = 1.35;

        right.x = w * 0.76;
        right.y = h * 0.68 + Math.sin(t * 2.5) * 2;
        right.rotation = -0.12;
        right.scale = 1.35;
        break;

      case 'HOLD_MIC':
        // A standalone hand moves into the microphone position and visually grips the microphone
        left.visible = true;
        left.shape = 'open_5_fingers';
        left.x = w * 0.20;
        left.y = h * 0.72 + Math.sin(t * 3) * 4;
        left.rotation = 0.2;
        left.scale = 1.3;

        right.visible = true;
        right.shape = 'grip';
        right.x = w * 0.76; // Exact microphone handle position in FaceEngine
        right.y = h * 0.66 + 12;
        right.rotation = -0.22;
        right.scale = 1.4;
        break;

      case 'STIR':
        // A standalone hand moves around the pot while holding the cooking utensil
        {
          const orbitAngle = t * 4.5;
          left.visible = true;
          left.shape = 'grip';
          left.x = w * 0.5 - 28; // Gripping pot left handle
          left.y = h * 0.72 + 5;
          left.rotation = 0.1;
          left.scale = 1.3;

          right.visible = true;
          right.shape = 'grip';
          right.x = w * 0.5 + Math.cos(orbitAngle) * 16 + 4;
          right.y = h * 0.72 - 12 + Math.sin(orbitAngle) * 6;
          right.rotation = Math.sin(orbitAngle) * 0.35 - 0.2;
          right.scale = 1.4;
        }
        break;

      case 'HOLD_BOOK':
        // Two standalone hands appear near the book and move naturally with the reading animation
        left.visible = true;
        right.visible = true;
        left.shape = 'grip';
        right.shape = 'grip';
        left.x = w * 0.5 - 34; // Left page edge
        left.y = h * 0.78 + 4 + Math.sin(t * 1.5) * 1.5;
        left.rotation = -0.15;
        left.scale = 1.3;

        right.x = w * 0.5 + 34; // Right page edge
        right.y = h * 0.78 + 4 + Math.sin(t * 1.5) * 1.5;
        right.rotation = 0.15;
        right.scale = 1.3;
        break;

      case 'CELEBRATE':
        left.visible = true;
        right.visible = true;
        left.shape = 'open_5_fingers';
        right.shape = 'open_5_fingers';
        left.x = w * 0.18;
        left.y = h * 0.28 + Math.sin(t * 5) * 6;
        left.rotation = 0.25;
        left.scale = 1.4;

        right.x = w * 0.82;
        right.y = h * 0.28 - Math.sin(t * 5) * 6;
        right.rotation = -0.25;
        right.scale = 1.4;
        break;

      case 'THINKING':
        // Standalone hand rests pensively near the lower cheek/chin
        left.visible = false;
        right.visible = true;
        right.shape = 'pinch';
        right.x = w * 0.65;
        right.y = h * 0.68 + Math.sin(t * 2) * 2;
        right.rotation = -0.18;
        right.scale = 1.4;
        break;

      case 'LISTENING':
        left.visible = true;
        right.visible = true;
        left.shape = 'open_5_fingers';
        right.shape = 'open_5_fingers';
        left.x = w * 0.14;
        left.y = h * 0.46 + Math.sin(t * 2.5) * 3;
        left.rotation = 0.25;
        left.scale = 1.35;

        right.x = w * 0.86;
        right.y = h * 0.46 + Math.sin(t * 2.5) * 3;
        right.rotation = -0.25;
        right.scale = 1.35;
        break;

      case 'PLAYING':
        left.visible = true;
        right.visible = true;
        left.shape = 'open_5_fingers';
        right.shape = 'open_5_fingers';
        left.x = w * 0.32 + Math.sin(t * 6) * 5;
        left.y = h * 0.74 + Math.cos(t * 8) * 4;
        left.rotation = 0.1;
        left.scale = 1.3;

        right.x = w * 0.68 - Math.sin(t * 6) * 5;
        right.y = h * 0.74 - Math.cos(t * 8) * 4;
        right.rotation = -0.1;
        right.scale = 1.3;
        break;

      case 'RAISE_HAND':
        left.visible = false;
        right.visible = true;
        right.shape = 'open_5_fingers';
        right.x = w * 0.80;
        right.y = h * 0.22 + Math.sin(t * 2) * 2;
        right.rotation = 0;
        right.scale = 1.45;
        break;

      case 'IDLE':
      default:
        // Left and right floating hands hover gently at bottom corners
        break;
    }

    // Update legacy telemetry properties so visualizers don't break
    left.handShape = left.shape;
    right.handShape = right.shape;
    left.wrist = Math.round((left.rotation * 180) / Math.PI);
    right.wrist = Math.round((right.rotation * 180) / Math.PI);

    return {
      left,
      right,
      propHeld: base.propHeld,
      gesture: this.currentGesture,
    };
  }
}

export const armController = new ArmController();
