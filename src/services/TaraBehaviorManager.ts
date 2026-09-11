/**
 * TaraBehaviorManager.ts
 * Coordinates autonomous behaviors, presence reactions, idle fidgets,
 * and boredom timers.
 */

import { TaraActivity, TaraPersonality } from '../types';
import { activitySceneManager } from './ActivitySceneManager';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { autonomousLifeManager } from './autonomous/AutonomousLifeManager';
import { emotionEngine } from './EmotionEngine';
import { voiceManager } from './VoiceManager';

export class TaraBehaviorManager {
  private autonomousEnabled: boolean = true;
  private idleTimeSec: number = 0;
  private personality: TaraPersonality = {
    cheerfulness: 85,
    curiosity: 75,
    sassiness: 40,
    energy: 70,
    empathy: 90,
  };

  private listeners: (() => void)[] = [];

  public getPersonality(): TaraPersonality {
    return { ...this.personality };
  }

  public setPersonality(p: Partial<TaraPersonality>) {
    this.personality = { ...this.personality, ...p };
    this.notify();
  }

  public isAutonomous(): boolean {
    return this.autonomousEnabled;
  }

  public setAutonomous(enabled: boolean) {
    this.autonomousEnabled = enabled;
    this.notify();
  }

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public onUserPresence(distanceCm: number) {
    this.idleTimeSec = 0;
    if (!this.autonomousEnabled) return;

    if (activitySceneManager.getActivity() === 'SLEEPING') {
      // Wake up with gentle surprise & happy greeting
      activitySceneManager.setActivity('IDLE');
      animationCoordinator.setExpression('surprised');
      armController.setGesture('GREETING');
      voiceManager.speak("Oh! You're back! Hello there!", 'happy');
      setTimeout(() => {
        animationCoordinator.setExpression('happy');
        armController.setGesture('WAVE');
      }, 1200);
    }
  }

  public triggerActivity(activity: TaraActivity) {
    this.idleTimeSec = 0;
    autonomousLifeManager.forceActivity(activity, 45);
    activitySceneManager.setActivity(activity);

    switch (activity) {
      case 'SINGING':
        armController.setGesture('HOLD_MIC');
        animationCoordinator.setExpression('singing');
        voiceManager.speak("La la la~ Singing a little desktop melody for you!", 'excited');
        break;

      case 'COOKING':
        armController.setGesture('STIR');
        animationCoordinator.setExpression('focused');
        voiceManager.speak("Turning on the stove! Today's special meal is on the way.", 'happy');
        break;

      case 'READING':
        armController.setGesture('HOLD_BOOK');
        animationCoordinator.setExpression('focused');
        voiceManager.speak("Enjoying a wonderful chapter in my favorite book.", 'neutral');
        break;

      case 'MUSIC':
        armController.setGesture('IDLE');
        animationCoordinator.setExpression('happy');
        voiceManager.speak("Putting on headphones! Let the rhythm flow.", 'happy');
        break;

      case 'SLEEPING':
        armController.setGesture('IDLE');
        animationCoordinator.setExpression('sleepy');
        voiceManager.speak("Yaaawn... Time for a cozy power nap. Zzz...", 'sleepy');
        break;

      case 'IDLE':
      default:
        armController.setGesture('IDLE');
        animationCoordinator.setExpression('happy');
        break;
    }
  }

  public update(dtMs: number) {
    if (!this.autonomousEnabled) return;

    this.idleTimeSec += dtMs / 1000;

    // After 90 seconds of inactivity in IDLE, yawn or stretch
    if (this.idleTimeSec > 90 && activitySceneManager.getActivity() === 'IDLE') {
      this.idleTimeSec = 0;
      const roll = Math.random();
      if (roll < 0.4) {
        animationCoordinator.setExpression('bored');
      } else if (roll < 0.7) {
        armController.setGesture('THINKING');
        animationCoordinator.setExpression('curious');
        setTimeout(() => {
          armController.setGesture('IDLE');
          animationCoordinator.setExpression('happy');
        }, 4000);
      }
    }
  }
}

export const taraBehaviorManager = new TaraBehaviorManager();
