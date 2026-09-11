/**
 * ActionManager.ts
 * Dispatches high level actions and test sequences.
 */

import { TaraArmGesture, TaraExpression, TaraEyeState, TaraMouthState } from '../types';
import { activitySceneManager } from './ActivitySceneManager';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { expressionManager } from './ExpressionManager';
import { voiceManager } from './VoiceManager';

export class ActionManager {
  private isTestingSequence: boolean = false;

  /**
   * 6. Full singing sequence:
   * "Sing a song"
   * IDLE -> PREPARE_SINGING -> MICROPHONE_APPEAR -> SINGING
   * 1. Mic appears
   * 2. Hand moves toward mic
   * 3. Holds mic
   * 4. Singing expression
   * 5. Mouth animation
   * 6. Music notes
   * 7. Arm makes small rhythmic movements
   * 8. Eyes occasionally blink
   * 9. Singing continues
   * 10. Mic disappears after completion
   * 11. Return to normal face
   */
  public triggerSingingSequence(songLyrics?: string) {
    const text = songLyrics || "Do re mi fa sol la ti do~ Starlight shining bright on our desk tonight!";

    // Transition to singing
    activitySceneManager.setActivity('SINGING');
    armController.setGesture('HOLD_MIC');
    animationCoordinator.setExpression('singing');

    voiceManager.speak(
      text,
      'excited',
      2,
      () => {
        // while singing
        animationCoordinator.setExpression('singing');
      },
      () => {
        // After completion
        setTimeout(() => {
          activitySceneManager.setActivity('IDLE');
          armController.setGesture('IDLE');
          animationCoordinator.setExpression('happy');
        }, 1200);
      }
    );
  }

  /**
   * 7. Full cooking sequence
   */
  public triggerCookingSequence() {
    activitySceneManager.setActivity('COOKING');
    armController.setGesture('STIR');
    animationCoordinator.setExpression('focused');

    voiceManager.speak(
      "Heating the burner! Watch the flame ignite, and now our pot is simmering happily!",
      'happy',
      2,
      undefined,
      () => {
        setTimeout(() => {
          animationCoordinator.setExpression('celebrating');
          armController.setGesture('CELEBRATE');
          voiceManager.speak("Dish completed! Smells absolutely delicious.", 'excited');

          setTimeout(() => {
            activitySceneManager.setActivity('IDLE');
            armController.setGesture('IDLE');
            animationCoordinator.setExpression('happy');
          }, 3500);
        }, 8000);
      }
    );
  }

  /**
   * 8. Reading sequence
   */
  public triggerReadingSequence() {
    activitySceneManager.setActivity('READING');
    armController.setGesture('HOLD_BOOK');
    animationCoordinator.setExpression('focused');

    voiceManager.speak(
      "Opening up our companion encyclopedia. Scanning chapter three...",
      'neutral',
      1,
      undefined,
      () => {
        setTimeout(() => {
          voiceManager.speak("Fascinating insight right here on this page!", 'happy');
        }, 4000);
      }
    );
  }

  /**
   * 9. Music sequence
   */
  public triggerMusicSequence() {
    activitySceneManager.setActivity('MUSIC');
    armController.setGesture('IDLE');
    animationCoordinator.setExpression('happy');

    voiceManager.speak("Pumping up the lo-fi companion playlist! Enjoy the vibe.", 'happy');
  }

  /**
   * 10. Sleep sequence
   */
  public triggerSleepSequence() {
    activitySceneManager.setActivity('SLEEPING');
    armController.setGesture('IDLE');
    animationCoordinator.setExpression('deep_sleep');

    voiceManager.speak("Entering deep sleep mode... Goodnight, friend! Zzz...", 'sleepy');
  }

  /**
   * Test all 34+ facial expressions sequentially
   */
  public testAllExpressions(onStep?: (exp: TaraExpression, index: number, total: number) => void): () => void {
    const list = expressionManager.getAllExpressions().map((e) => e.name);
    let index = 0;
    this.isTestingSequence = true;

    const interval = setInterval(() => {
      if (!this.isTestingSequence || index >= list.length) {
        clearInterval(interval);
        this.isTestingSequence = false;
        animationCoordinator.setExpression('happy');
        return;
      }
      const exp = list[index];
      animationCoordinator.setExpression(exp);
      onStep?.(exp, index + 1, list.length);
      index++;
    }, 1200);

    return () => {
      this.isTestingSequence = false;
      clearInterval(interval);
      animationCoordinator.setExpression('happy');
    };
  }

  /**
   * Test all mouth shapes sequentially
   */
  public testAllMouthStates(onStep?: (mouth: TaraMouthState, index: number, total: number) => void): () => void {
    const mouthStates: TaraMouthState[] = [
      'CLOSED',
      'SMALL',
      'SMILE',
      'OPEN_SMALL',
      'OPEN_MEDIUM',
      'OPEN_WIDE',
      'O_SHAPE',
      'A_SHAPE',
      'E_SHAPE',
      'SPEAKING',
      'LAUGHING',
      'SINGING',
    ];

    let index = 0;
    this.isTestingSequence = true;

    const interval = setInterval(() => {
      if (!this.isTestingSequence || index >= mouthStates.length) {
        clearInterval(interval);
        this.isTestingSequence = false;
        return;
      }
      const m = mouthStates[index];
      // Temporarily bypass expression mouth
      animationCoordinator.setExpression('neutral');
      // simulate amplitude for open shapes
      onStep?.(m, index + 1, mouthStates.length);
      index++;
    }, 1000);

    return () => {
      this.isTestingSequence = false;
      clearInterval(interval);
    };
  }

  /**
   * Test all eye states sequentially
   */
  public testAllEyeStates(onStep?: (eye: TaraEyeState, index: number, total: number) => void): () => void {
    const eyeStates: TaraEyeState[] = [
      'normal',
      'blink',
      'open',
      'look_left',
      'look_right',
      'look_down',
      'look_up',
      'squint',
      'wide',
      'wink',
      'closed',
      'half_closed',
      'dizzy_spiral',
      'hearts',
      'tears',
      'sparkle',
    ];

    let index = 0;
    this.isTestingSequence = true;

    const interval = setInterval(() => {
      if (!this.isTestingSequence || index >= eyeStates.length) {
        clearInterval(interval);
        this.isTestingSequence = false;
        animationCoordinator.setEyeOverride(null);
        return;
      }
      const eye = eyeStates[index];
      animationCoordinator.setEyeOverride(eye);
      onStep?.(eye, index + 1, eyeStates.length);
      index++;
    }, 1000);

    return () => {
      this.isTestingSequence = false;
      clearInterval(interval);
      animationCoordinator.setEyeOverride(null);
    };
  }

  /**
   * Test all arm gestures sequentially
   */
  public testAllArmGestures(onStep?: (gesture: TaraArmGesture, index: number, total: number) => void): () => void {
    const gestures: TaraArmGesture[] = [
      'IDLE',
      'WAVE',
      'HOLD_MIC',
      'RAISE_HAND',
      'POINT',
      'THUMBS_UP',
      'CLAP',
      'STIR',
      'HOLD_BOOK',
      'CELEBRATE',
      'THINKING',
      'GREETING',
    ];

    let index = 0;
    this.isTestingSequence = true;

    const interval = setInterval(() => {
      if (!this.isTestingSequence || index >= gestures.length) {
        clearInterval(interval);
        this.isTestingSequence = false;
        armController.setGesture('IDLE');
        return;
      }
      const g = gestures[index];
      armController.setGesture(g);
      onStep?.(g, index + 1, gestures.length);
      index++;
    }, 1200);

    return () => {
      this.isTestingSequence = false;
      clearInterval(interval);
      armController.setGesture('IDLE');
    };
  }
}

export const actionManager = new ActionManager();
