import { RobotEmotion, EmotionProfile, ArmGesture } from '../types';
import { expressionManager } from './ExpressionManager';

export class EmotionEngine {
  private currentEmotion: RobotEmotion = 'NEUTRAL';
  private currentIntensity: number = 0.8;
  private emotionTimer: any = null;

  public getProfile(emotion: RobotEmotion = this.currentEmotion, intensity: number = this.currentIntensity): EmotionProfile {
    const prof = expressionManager.getProfile(emotion);
    return {
      ...prof,
      intensity: Math.max(0.1, Math.min(1.0, intensity)),
      durationMs: 3500,
    };
  }

  public setEmotion(emotion: RobotEmotion, intensity: number = 0.85, autoRevertMs?: number, onRevert?: (reverted: RobotEmotion) => void): EmotionProfile {
    this.currentEmotion = emotion;
    this.currentIntensity = intensity;

    if (autoRevertMs && autoRevertMs > 0) {
      expressionManager.pushTemporaryExpression(emotion, autoRevertMs);
    } else {
      expressionManager.setBaseEmotion(emotion, intensity);
    }

    if (this.emotionTimer) {
      clearTimeout(this.emotionTimer);
      this.emotionTimer = null;
    }

    if (autoRevertMs && autoRevertMs > 0) {
      this.emotionTimer = setTimeout(() => {
        this.currentEmotion = 'NEUTRAL';
        this.currentIntensity = 0.7;
        if (onRevert) onRevert('NEUTRAL');
      }, autoRevertMs);
    }

    return this.getProfile();
  }

  public getCurrentEmotion(): RobotEmotion {
    return expressionManager.getCurrentEffectiveEmotion();
  }

  public getIntensity(): number {
    return this.currentIntensity;
  }
}

export const emotionEngine = new EmotionEngine();
