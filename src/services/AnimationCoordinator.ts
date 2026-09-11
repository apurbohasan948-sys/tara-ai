/**
 * AnimationCoordinator.ts
 * Coordinates Face, Eyes, Mouth, Voice, Activity, Props, Arms, and Effects.
 * Enforces layer cooperation so that:
 * - When cooking + speaking: Cooking scene remains active, voice controls mouth,
 *   cooking controls arms/props, emotion controls eyes.
 * - When singing: Singing controls microphone + arms + music effects, voice controls mouth,
 *   emotion controls eyes.
 * - ZERO HEAD/WHOLE-FACE DISPLACEMENT: Face position is strictly fixed.
 */

import {
  TaraActivity,
  TaraArmGesture,
  TaraEmotion,
  TaraExpression,
  TaraEyeState,
  TaraMouthState,
  TaraProp,
} from '../types';
import { activitySceneManager } from './ActivitySceneManager';
import { armController } from './ArmController';
import { expressionManager } from './ExpressionManager';
import { voiceManager } from './VoiceManager';

export interface CoordinatedFrame {
  activity: TaraActivity;
  emotion: TaraEmotion;
  expression: TaraExpression;
  eyeState: TaraEyeState;
  mouthState: TaraMouthState;
  armGesture: TaraArmGesture;
  prop: TaraProp;
  audioAmplitude: number;
  isVoiceActive: boolean;
  pupilOffsetX: number;
  pupilOffsetY: number;
  pupilScale: number;
  eyelidCurve: number;
  eyebrowAngle: number;
  eyebrowOffset: number;
  blush: boolean;
  blushIntensity: number;
  sweatDrop?: boolean;
  sparkle?: boolean;
  tears?: boolean;
  hearts?: boolean;
  dizzySpiral?: boolean;
}

export class AnimationCoordinator {
  private currentEmotion: TaraEmotion = 'happy';
  private targetEmotion: TaraEmotion = 'happy';
  private activeExpression: TaraExpression = 'neutral';
  private eyeOverride: TaraEyeState | null = null;
  private mouthOverride: TaraMouthState | null = null;
  private blinkProgress: number = 0; // 0 = open, 1 = shut
  private nextBlinkMs: number = 2500;
  private blinkTimerMs: number = 0;
  private saccadeX: number = 0;
  private saccadeY: number = 0;
  private nextSaccadeMs: number = 1800;
  private saccadeTimerMs: number = 0;

  public setEmotion(emotion: TaraEmotion) {
    this.currentEmotion = emotion;
    // Map default emotion to expression if no specific expression set
    const map: Record<TaraEmotion, TaraExpression> = {
      happy: 'happy',
      neutral: 'neutral',
      excited: 'excited',
      curious: 'curious',
      sad: 'sad',
      angry: 'angry',
      sleepy: 'sleepy',
      confused: 'confused',
      surprised: 'surprised',
      shy: 'shy',
      proud: 'proud',
      bored: 'bored',
      playful: 'playful',
      scared: 'scared',
      worried: 'worried',
      focused: 'focused',
    };
    this.setExpression(map[emotion] || 'happy');
  }

  public getEmotion(): TaraEmotion {
    return this.currentEmotion;
  }

  public setExpression(exp: TaraExpression) {
    this.activeExpression = exp;
    expressionManager.setExpression(exp);
  }

  public getExpression(): TaraExpression {
    return this.activeExpression;
  }

  public setEyeOverride(eye: TaraEyeState | null) {
    this.eyeOverride = eye;
  }

  public setMouthState(mouth: TaraMouthState | null) {
    this.mouthOverride = mouth;
  }

  public setActivity(activity: TaraActivity) {
    activitySceneManager.setActivity(activity);
  }

  public setArmGesture(gesture: TaraArmGesture) {
    armController.setGesture(gesture);
  }

  public update(dtMs: number) {
    // 1. Natural non-disruptive blinking inside the eye
    this.blinkTimerMs += dtMs;
    if (this.blinkTimerMs > this.nextBlinkMs) {
      this.blinkProgress += dtMs / 140; // fast 140ms blink
      if (this.blinkProgress >= 1) {
        this.blinkProgress = 0;
        this.blinkTimerMs = 0;
        this.nextBlinkMs = 2000 + Math.random() * 3500;
      }
    }

    // 2. Micro saccadic eye glances (eyes look around gently, NO head movement)
    this.saccadeTimerMs += dtMs;
    if (this.saccadeTimerMs > this.nextSaccadeMs) {
      this.saccadeTimerMs = 0;
      this.nextSaccadeMs = 1500 + Math.random() * 3000;
      // Gentle ocular jitter within screen boundaries
      this.saccadeX = (Math.random() - 0.5) * 0.25;
      this.saccadeY = (Math.random() - 0.5) * 0.15;
    }

    // Update child subsystems
    activitySceneManager.update(dtMs);
    armController.update(dtMs);
  }

  /**
   * Resolves the layered coordinated state for the face renderer
   */
  public getCoordinatedFrame(): CoordinatedFrame {
    const activity = activitySceneManager.getActivity();
    const expConfig = expressionManager.getConfig(this.activeExpression);
    const voiceState = voiceManager.getVoiceState();
    const voiceMouth = voiceManager.getMouthState();
    const isVoiceSpeaking = voiceState === 'VOICE_SPEAKING' || voiceState === 'VOICE_STARTING';

    // Base eye state from expression
    let eyeState: TaraEyeState = this.eyeOverride || expConfig.eyeState;

    // Apply natural blink if eye is open
    if (this.blinkProgress > 0 && eyeState !== 'closed' && activity !== 'SLEEPING') {
      eyeState = 'blink';
    }

    // Layer 1: Activity influence on eyes
    if (activity === 'SLEEPING') {
      eyeState = 'closed';
    } else if (activity === 'READING') {
      // Look down at book
    } else if (activity === 'COOKING') {
      // Look towards cooking pot
    }

    // Layer 2: Mouth resolution (Cooperation between Voice & Expression & Activity)
    let mouthState: TaraMouthState = expConfig.mouthState;
    if (this.mouthOverride) {
      mouthState = this.mouthOverride;
    } else if (isVoiceSpeaking) {
      // Voice takes precedence on mouth shape dynamically
      mouthState = voiceMouth;
    } else if (activity === 'SINGING') {
      mouthState = 'SINGING';
    } else if (activity === 'SLEEPING') {
      mouthState = 'CLOSED';
    }

    // Layer 3: Arms & Prop resolution
    let armGesture: TaraArmGesture = 'IDLE';
    let prop: TaraProp = 'NONE';

    if (activity === 'SINGING') {
      armGesture = 'HOLD_MIC';
      prop = 'MICROPHONE';
    } else if (activity === 'COOKING') {
      armGesture = 'STIR';
      prop = 'COOKING_POT';
    } else if (activity === 'READING') {
      armGesture = 'HOLD_BOOK';
      prop = 'BOOK';
    } else if (activity === 'MUSIC') {
      armGesture = 'IDLE';
      prop = 'HEADPHONES';
    } else {
      armGesture = armController.getGesture();
    }

    // Pupil saccades & activity target
    let px = expConfig.pupilOffsetX + this.saccadeX;
    let py = expConfig.pupilOffsetY + this.saccadeY;

    if (activity === 'COOKING') {
      // Direct eyes down towards pot
      py = Math.max(py, 0.3);
    } else if (activity === 'READING') {
      // Direct eyes toward book
      py = Math.max(py, 0.35);
      px = (Math.sin(Date.now() / 800) * 0.2); // reading scan across
    }

    return {
      activity,
      emotion: this.currentEmotion,
      expression: this.activeExpression,
      eyeState,
      mouthState,
      armGesture,
      prop,
      audioAmplitude: voiceManager.getAmplitude(),
      isVoiceActive: isVoiceSpeaking,
      pupilOffsetX: px,
      pupilOffsetY: py,
      pupilScale: expConfig.pupilScale,
      eyelidCurve: expConfig.eyelidCurve,
      eyebrowAngle: expConfig.eyebrowAngle,
      eyebrowOffset: expConfig.eyebrowOffset,
      blush: expConfig.blush,
      blushIntensity: expConfig.blushIntensity,
      sweatDrop: expConfig.sweatDrop,
      sparkle: expConfig.sparkle,
      tears: expConfig.tears,
      hearts: expConfig.hearts,
      dizzySpiral: expConfig.dizzySpiral,
    };
  }
}

export const animationCoordinator = new AnimationCoordinator();
