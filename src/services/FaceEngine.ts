import { RobotEmotion, RobotState, RobotActivity, EmotionProfile, MouthShape } from '../types';
import { expressionManager, VisualExpression } from './ExpressionManager';
import { activitySceneManager } from './ActivitySceneManager';

export interface FaceRenderState {
  // Gaze & Saccades
  gazeX: number; // -14 to +14 px
  gazeY: number; // -10 to +10 px
  pupilSize: number; // radius 2 to 6 px
  
  // Eye geometry & shape
  leftEyeWidth: number;
  leftEyeHeight: number;
  rightEyeWidth: number;
  rightEyeHeight: number;
  leftEyeRadius: number;
  rightEyeRadius: number;
  eyeShape: string;
  
  // Eyelids / Blinking
  blinkRatio: number; // 0.0 (open) to 1.0 (closed)
  squintRatio: number; // 0.0 to 0.8
  
  // Eyebrows & Asymmetry (for confused / curious)
  leftBrowOffset: number;
  rightBrowOffset: number;
  leftBrowAngle: number;
  rightBrowAngle: number;

  // Mouth geometry
  mouthShape: MouthShape;
  mouthOpenHeight: number; // 0 to 16 px
  mouthWidth: number; // 18 to 44 px
  mouthYOffset: number; // -4 to +6 px
  mouthPhonemePhase: number; // for smooth sine speech / singing modulation

  // Head Micro-movements
  headTilt: number;
  headBounce: number;

  // Activity-specific visual decorators
  activity: RobotActivity;
  activityPhase: number;
  extraVisuals: {
    readingPageOffset?: number; // 0 to 1 for scanning line
    singingNoteBounce?: number;
    thinkingParticles?: { x: number; y: number; r: number }[];
    cheeksBlush?: boolean;
    heartEyes?: boolean;
    tearDrops?: boolean;
    particles?: 'hearts' | 'stars' | 'sweat' | 'tears' | 'notes' | 'zzz' | 'sparks' | 'none';
  };
}

export class EyeController {
  private gazeX: number = 0;
  private gazeY: number = 0;
  private blinkProgress: number = 0;
  private isBlinking: boolean = false;
  private lastBlinkTime: number = performance.now();
  private nextBlinkInterval: number = 2800;

  public update(time: number, isSleeping: boolean, activity: RobotActivity, blinkPattern: string = 'NORMAL'): { gazeX: number; gazeY: number; blinkProgress: number } {
    if (isSleeping || blinkPattern === 'SLEEP') {
      this.blinkProgress = 1.0;
      return { gazeX: 0, gazeY: 2, blinkProgress: 1.0 };
    }

    if (blinkPattern === 'NONE') {
      return { gazeX: this.gazeX, gazeY: this.gazeY, blinkProgress: 0 };
    }

    // 1. Reading Activity scan line: eyes scan left to right, then reset
    if (activity === 'READING') {
      const scanPeriod = 1800; // ms
      const phase = (time % scanPeriod) / scanPeriod;
      this.gazeX = -8 + phase * 16;
      this.gazeY = 5; // looking down at book
    }

    // 2. Procedural Blink engine according to pattern
    const intervalMin = blinkPattern === 'FAST' ? 1200 : blinkPattern === 'SLOW' ? 4500 : 2500;
    const intervalVar = blinkPattern === 'FAST' ? 1000 : blinkPattern === 'SLOW' ? 3000 : 2500;

    if (!this.isBlinking && time - this.lastBlinkTime > this.nextBlinkInterval) {
      this.isBlinking = true;
      this.lastBlinkTime = time;
    }

    if (this.isBlinking) {
      const elapsed = time - this.lastBlinkTime;
      const duration = blinkPattern === 'DOUBLE' ? 320 : 160; // ms
      if (elapsed >= duration) {
        this.isBlinking = false;
        this.blinkProgress = 0;
        this.nextBlinkInterval = intervalMin + Math.random() * intervalVar;
      } else {
        if (blinkPattern === 'DOUBLE') {
          // Two quick blinks in succession
          const p = (elapsed % 160) / 160;
          this.blinkProgress = p < 0.5 ? p * 2 : (1 - p) * 2;
        } else {
          const p = elapsed / duration;
          this.blinkProgress = p < 0.5 ? p * 2 : (1 - p) * 2;
        }
      }
    }

    return {
      gazeX: this.gazeX,
      gazeY: this.gazeY,
      blinkProgress: this.blinkProgress,
    };
  }

  public setGaze(x: number, y: number) {
    this.gazeX = Math.max(-14, Math.min(14, x));
    this.gazeY = Math.max(-10, Math.min(10, y));
  }
}

export class MouthController {
  private mouthShape: MouthShape = 'MOUTH_CLOSED';
  private speechPhase: number = 0;

  public update(state: RobotState, activity: RobotActivity, time: number): {
    mouthShape: MouthShape;
    mouthOpenHeight: number;
    mouthWidth: number;
    mouthYOffset: number;
    mouthPhonemePhase: number;
  } {
    this.speechPhase += 0.22;

    if (state === 'SPEAKING' || activity === 'SINGING') {
      // Dynamic phoneme modulation with realistic mouth sync
      const isSinging = activity === 'SINGING';
      const openAmount = isSinging
        ? Math.abs(Math.sin(this.speechPhase * 1.5)) * 14 + 4 
        : Math.abs(Math.sin(this.speechPhase * 2.0)) * 10 + 2;
      return {
        mouthShape: isSinging ? 'MOUTH_O' : 'talking',
        mouthOpenHeight: openAmount,
        mouthWidth: 30 + Math.cos(this.speechPhase) * 6,
        mouthYOffset: 2,
        mouthPhonemePhase: this.speechPhase,
      };
    }

    switch (this.mouthShape) {
      case 'MOUTH_WIDE':
      case 'wide_grin':
        return { mouthShape: 'MOUTH_WIDE', mouthOpenHeight: 8, mouthWidth: 34, mouthYOffset: 2, mouthPhonemePhase: 0 };
      case 'MOUTH_SMILE':
      case 'smile':
        return { mouthShape: 'MOUTH_SMILE', mouthOpenHeight: 5, mouthWidth: 28, mouthYOffset: 1, mouthPhonemePhase: 0 };
      case 'MOUTH_O':
      case 'open_o':
        return { mouthShape: 'MOUTH_O', mouthOpenHeight: 12, mouthWidth: 16, mouthYOffset: 2, mouthPhonemePhase: 0 };
      case 'MOUTH_SMALL':
        return { mouthShape: 'MOUTH_SMALL', mouthOpenHeight: 3, mouthWidth: 14, mouthYOffset: 1, mouthPhonemePhase: 0 };
      case 'sad_frown':
        return { mouthShape: 'sad_frown', mouthOpenHeight: 2, mouthWidth: 24, mouthYOffset: 4, mouthPhonemePhase: 0 };
      case 'thinking_pucker':
        return { mouthShape: 'thinking_pucker', mouthOpenHeight: 3, mouthWidth: 16, mouthYOffset: 1, mouthPhonemePhase: 0 };
      case 'worried_wiggle':
        return { mouthShape: 'worried_wiggle', mouthOpenHeight: 2, mouthWidth: 24, mouthYOffset: 3, mouthPhonemePhase: 0 };
      case 'pout':
        return { mouthShape: 'pout', mouthOpenHeight: 3, mouthWidth: 18, mouthYOffset: 3, mouthPhonemePhase: 0 };
      default:
        return { mouthShape: 'MOUTH_CLOSED', mouthOpenHeight: 0, mouthWidth: 24, mouthYOffset: 1, mouthPhonemePhase: 0 };
    }
  }

  public setMouthShape(shape: MouthShape) {
    this.mouthShape = shape;
  }
}

export class AnimationController {
  private phase: number = 0;

  public update(): number {
    this.phase = (this.phase + 0.08) % (Math.PI * 2);
    return this.phase;
  }

  public getPhase(): number {
    return this.phase;
  }
}

export class FaceEngine {
  private eyeController = new EyeController();
  private mouthController = new MouthController();
  private animationController = new AnimationController();

  public computeRenderState(
    state: RobotState,
    emotion: RobotEmotion,
    activity: RobotActivity,
    time: number = performance.now()
  ): FaceRenderState {
    const isSleeping = state === 'SLEEPING';
    const effectiveEmotion = expressionManager.getCurrentEffectiveEmotion();
    const visual = expressionManager.computeVisualExpression(effectiveEmotion);
    const eyeUpdate = this.eyeController.update(time, isSleeping, activity, visual.blinkPattern);
    const animPhase = this.animationController.update();

    // Sync mouth shape from emotion unless speaking
    if (state !== 'SPEAKING' && activity !== 'SINGING') {
      this.mouthController.setMouthShape(visual.mouthShape);
    }
    const mouthUpdate = this.mouthController.update(state, activity, time);

    // Eye shape & dimensions based on visual expression & activity
    let eyeW = visual.leftEyeWidth;
    let eyeH = visual.leftEyeHeight;
    let eyeR = 9;
    let squintRatio = visual.squintRatio;
    let pupilSize = Math.max(2, Math.round(4 * visual.pupilDilation));
    let leftBrowOffset = visual.eyebrowOffsetLeft;
    let rightBrowOffset = visual.eyebrowOffsetRight;
    let leftBrowAngle = visual.eyebrowTiltLeft;
    let rightBrowAngle = visual.eyebrowTiltRight;
    let eyeShape = visual.eyeShape;

    // Subtle head movements
    const headBounce = Math.sin(animPhase) * 1.5;
    const headTilt = visual.headTilt + Math.sin(animPhase * 0.5) * 0.02;

    // Behavioral contextual overrides
    if (activity === 'READING') {
      eyeShape = 'normal';
      eyeH = 30;
      squintRatio = 0.25;
    } else if (activity === 'COOKING') {
      eyeUpdate.gazeX = -4;
      eyeUpdate.gazeY = 4; // Looking towards cooking pot on stove
    } else if (activity === 'SINGING') {
      eyeShape = 'happy_arc';
    } else if (state === 'THINKING') {
      eyeUpdate.gazeX = 6;
      eyeUpdate.gazeY = -6; // Looking up
    }

    // Thinking particles
    const thinkingParticles = (state === 'THINKING' || visual.particles === 'sparks') ? [
      { x: 110 + Math.cos(animPhase) * 7, y: 16 + Math.sin(animPhase) * 7, r: 2.2 },
      { x: 110, y: 16, r: 1.5 },
    ] : undefined;

    return {
      gazeX: eyeUpdate.gazeX + visual.pupilOffsetX,
      gazeY: eyeUpdate.gazeY + visual.pupilOffsetY,
      pupilSize,
      leftEyeWidth: eyeW,
      leftEyeHeight: Math.max(3, eyeH * (1 - eyeUpdate.blinkProgress)),
      rightEyeWidth: visual.rightEyeWidth,
      rightEyeHeight: Math.max(3, visual.rightEyeHeight * (1 - eyeUpdate.blinkProgress)),
      leftEyeRadius: eyeR,
      rightEyeRadius: eyeR,
      eyeShape,
      blinkRatio: eyeUpdate.blinkProgress,
      squintRatio,
      leftBrowOffset,
      rightBrowOffset,
      leftBrowAngle,
      rightBrowAngle,
      mouthShape: mouthUpdate.mouthShape,
      mouthOpenHeight: mouthUpdate.mouthOpenHeight,
      mouthWidth: mouthUpdate.mouthWidth,
      mouthYOffset: mouthUpdate.mouthYOffset + visual.mouthYOffset,
      mouthPhonemePhase: mouthUpdate.mouthPhonemePhase,
      headTilt,
      headBounce,
      activity,
      activityPhase: animPhase,
      extraVisuals: {
        readingPageOffset: activity === 'READING' ? (time % 1800) / 1800 : undefined,
        singingNoteBounce: activity === 'SINGING' ? Math.sin(animPhase * 2) * 4 : undefined,
        thinkingParticles,
        cheeksBlush: visual.cheeksBlush,
        heartEyes: visual.eyeShape === 'love_hearts',
        tearDrops: visual.particles === 'tears',
        particles: visual.particles,
      },
    };
  }

  public setGaze(x: number, y: number) {
    this.eyeController.setGaze(x, y);
  }
}

export const faceEngine = new FaceEngine();
