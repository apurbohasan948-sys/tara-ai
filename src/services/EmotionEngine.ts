/**
 * EmotionEngine.ts
 * Manages TARA's emotional state, emotional inertia, valence/arousal,
 * and mapping to facial expressions.
 */

import { TaraEmotion } from '../types';
import { animationCoordinator } from './AnimationCoordinator';

export class EmotionEngine {
  private currentEmotion: TaraEmotion = 'happy';
  private valence: number = 0.8; // -1.0 (very negative) to 1.0 (very positive)
  private arousal: number = 0.6; // 0.0 (calm/sleepy) to 1.0 (hyper/excited)
  private decayTimer: number = 0;

  public getEmotion(): TaraEmotion {
    return this.currentEmotion;
  }

  public setEmotion(emotion: TaraEmotion) {
    this.currentEmotion = emotion;
    this.updateValenceArousal(emotion);
    animationCoordinator.setEmotion(emotion);
  }

  public getValenceArousal() {
    return { valence: this.valence, arousal: this.arousal };
  }

  public update(dtMs: number) {
    this.decayTimer += dtMs;
    // Over time, emotions slowly drift toward friendly happy/neutral
    if (this.decayTimer > 15000) {
      this.decayTimer = 0;
      if (['angry', 'scared', 'worried', 'frustrated', 'sad'].includes(this.currentEmotion)) {
        this.setEmotion('neutral');
      }
    }
  }

  private updateValenceArousal(emotion: TaraEmotion) {
    switch (emotion) {
      case 'happy':
        this.valence = 0.8;
        this.arousal = 0.6;
        break;
      case 'excited':
        this.valence = 0.95;
        this.arousal = 0.95;
        break;
      case 'curious':
        this.valence = 0.6;
        this.arousal = 0.7;
        break;
      case 'playful':
        this.valence = 0.85;
        this.arousal = 0.75;
        break;
      case 'proud':
        this.valence = 0.7;
        this.arousal = 0.5;
        break;
      case 'sad':
        this.valence = -0.7;
        this.arousal = 0.3;
        break;
      case 'angry':
        this.valence = -0.8;
        this.arousal = 0.9;
        break;
      case 'sleepy':
        this.valence = 0.2;
        this.arousal = 0.1;
        break;
      case 'confused':
        this.valence = 0.0;
        this.arousal = 0.5;
        break;
      case 'surprised':
        this.valence = 0.5;
        this.arousal = 0.85;
        break;
      case 'shy':
        this.valence = 0.4;
        this.arousal = 0.4;
        break;
      case 'bored':
        this.valence = -0.2;
        this.arousal = 0.2;
        break;
      default:
        this.valence = 0.5;
        this.arousal = 0.5;
        break;
    }
  }
}

export const emotionEngine = new EmotionEngine();
