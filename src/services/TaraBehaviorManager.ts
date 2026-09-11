import {
  RobotActivity,
  RobotEmotion,
  RobotState,
  RobotActionName,
} from '../types';
import { actionManager } from './ActionManager';
import { activityManager } from './ActivityManager';
import { armController } from './ArmController';
import { emotionEngine } from './EmotionEngine';
import { presenceManager } from './PresenceManager';
import { voiceManager } from './VoiceManager';
import { musicController } from './MusicController';

export interface BehaviorDispatchContext {
  setState: (st: RobotState) => void;
  setEmotion: (em: RobotEmotion) => void;
  setActivity: (act: RobotActivity) => void;
}

export class TaraBehaviorManager {
  private currentBehavior: string = 'IDLE';
  private listeners: ((behavior: string) => void)[] = [];

  constructor() {
    // Connect autonomous presence greeting
    presenceManager.setCallbacks(
      (presenceState, info) => {
        // Can react to presence state changes
      },
      () => {
        // Autonomous Greeting triggered by presence sensor cooldown!
        this.triggerGreeting();
      }
    );
  }

  public subscribe(listener: (behavior: string) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentBehavior);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.currentBehavior);
    }
  }

  public getCurrentBehavior(): string {
    return this.currentBehavior;
  }

  /**
   * High-Level Pipeline:
   * Intent / Emotion / Context -> BehaviorManager -> ActionManager -> Subsystems
   */
  public handleIntent(
    intent: string,
    context: BehaviorDispatchContext,
    detectedEmotion?: RobotEmotion,
    textPayload?: string
  ) {
    this.currentBehavior = intent;
    this.notify();

    if (detectedEmotion) {
      context.setEmotion(detectedEmotion);
      emotionEngine.setEmotion(detectedEmotion);
    }

    const norm = intent.toLowerCase().trim();

    if (norm.includes('cook')) {
      activityManager.startActivity('COOKING', context);
    } else if (norm.includes('sing')) {
      activityManager.startActivity('SINGING', context);
    } else if (norm.includes('read') || norm.includes('story') || norm.includes('book')) {
      activityManager.startActivity('READING', context, textPayload);
    } else if (norm.includes('music') || norm.includes('play song')) {
      activityManager.startActivity('LISTENING_MUSIC', context);
    } else if (norm.includes('sleep') || norm.includes('goodnight')) {
      activityManager.startActivity('SLEEPING', context);
    } else if (norm.includes('wake') || norm.includes('good morning')) {
      actionManager.executeAction('WakeAction', {
        setState: context.setState,
        setEmotion: context.setEmotion,
      });
    } else if (norm.includes('greet') || norm.includes('hello') || norm.includes('hi')) {
      actionManager.executeAction('GreetingAction', {
        setState: context.setState,
        setEmotion: context.setEmotion,
      });
    } else if (norm.includes('celebrate') || norm.includes('hooray') || norm.includes('party')) {
      actionManager.executeAction('CelebrationAction', {
        setState: context.setState,
        setEmotion: context.setEmotion,
      });
    } else if (norm.includes('wave')) {
      armController.executeGesture('WAVE', 3000);
      context.setEmotion('HAPPY');
      emotionEngine.setEmotion('HAPPY');
    } else {
      // General conversation
      actionManager.executeAction('ConversationAction', {
        setState: context.setState,
        setEmotion: context.setEmotion,
      });
      if (textPayload) {
        voiceManager.speak(textPayload);
      }
    }
  }

  public triggerGreeting(context?: BehaviorDispatchContext) {
    this.currentBehavior = 'GREETING';
    this.notify();

    if (context) {
      actionManager.executeAction('GreetingAction', {
        setState: context.setState,
        setEmotion: context.setEmotion,
      });
    } else {
      // Direct subsystem drive
      emotionEngine.setEmotion('SURPRISED', 0.9);
      setTimeout(() => {
        emotionEngine.setEmotion('HAPPY', 0.85);
        armController.executeGesture('WAVE', 2500);
        voiceManager.speak("Hey! You're back. Good to see you!");
      }, 400);
    }
  }

  public resetToIdle(context: BehaviorDispatchContext) {
    this.currentBehavior = 'IDLE';
    this.notify();
    actionManager.stopActiveAction();
    activityManager.stopActivity(context);
    armController.resetToSafePosition();
    context.setState('IDLE');
    context.setEmotion('NEUTRAL');
    emotionEngine.setEmotion('NEUTRAL');
  }
}

export const taraBehaviorManager = new TaraBehaviorManager();
