/**
 * FaceDecisionEngine.ts
 * Intelligent Expression & Ocular Decision Engine.
 *
 * Connects:
 * - PersonalityEngine (traits, dynamic mood, shy behavior)
 * - EmotionEngine (valence & arousal)
 * - AnimationCoordinator (ocular layers, pupil saccades, mouth shape)
 * - PresenceManager (distance & human interaction)
 *
 * CRITICAL RULE:
 * - Head and face canvas NEVER MOVE OR ROTATE.
 * - All personality expression happens strictly through eyes, eyelids, pupils,
 *   eyebrows, blush, mouth, props, and arms.
 */

import { TaraEmotion, TaraExpression, TaraEyeState, TaraMouthState } from '../types';
import { animationCoordinator } from './AnimationCoordinator';
import { emotionEngine } from './EmotionEngine';
import { personalityEngine } from './PersonalityEngine';

export class FaceDecisionEngine {
  private updateTimer: any = null;
  private lastEvaluationTime: number = Date.now();

  constructor() {
    this.startEngine();
  }

  public startEngine() {
    if (this.updateTimer) clearInterval(this.updateTimer);
    this.updateTimer = setInterval(() => {
      this.evaluateFaceDecisions();
    }, 1000);
  }

  public stopEngine() {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Evaluates current emotional state, personality mood, and environmental context
   * to determine the best facial expression and ocular timing.
   */
  public evaluateFaceDecisions() {
    // If shy reaction sequence is active, do not override its coordinated stages
    if (personalityEngine.getIsShyActive()) {
      return;
    }

    const mood = personalityEngine.getMood();
    const emotion = emotionEngine.getEmotion();
    const traits = personalityEngine.getTraits();

    // Expression selection based on personality mood & traits
    let recommendedExpression: TaraExpression = 'happy';

    switch (mood) {
      case 'shy':
        recommendedExpression = 'shy';
        break;
      case 'playful':
        recommendedExpression = traits.mischievous > 60 ? 'teasing' : 'playful';
        break;
      case 'curious':
        recommendedExpression = 'curious';
        break;
      case 'excited':
        recommendedExpression = traits.expressive > 80 ? 'big_smile' : 'excited';
        break;
      case 'thoughtful':
        recommendedExpression = 'thinking';
        break;
      case 'mischievous':
        recommendedExpression = 'teasing';
        break;
      case 'caring':
        recommendedExpression = 'happy';
        break;
      case 'sleepy':
        recommendedExpression = 'sleepy';
        break;
      case 'focused':
        recommendedExpression = 'focused';
        break;
      case 'clumsy':
        recommendedExpression = 'confused';
        break;
      case 'cheerful':
      default:
        recommendedExpression = 'happy';
        break;
    }

    // Only update if current expression is neutral or matching prior mood
    const currentExp = animationCoordinator.getExpression();
    if (
      currentExp === 'neutral' ||
      currentExp === 'happy' ||
      currentExp === 'thinking' ||
      currentExp === 'focused'
    ) {
      animationCoordinator.setExpression(recommendedExpression);
    }
  }

  /**
   * Computes appropriate blink cadence in milliseconds based on current mood.
   */
  public getBlinkCadenceMs(): number {
    const mood = personalityEngine.getMood();
    switch (mood) {
      case 'shy':
        return 1200; // Fluttering faster blinks
      case 'focused':
        return 4500; // Fewer blinks when reading/focusing
      case 'sleepy':
        return 1600; // Heavy, slower lid closes
      case 'excited':
        return 2000;
      default:
        return 2800;
    }
  }
}

export const faceDecisionEngine = new FaceDecisionEngine();
