import { RobotActivity, RobotEmotion, RobotState } from '../types';
import { actionManager } from './ActionManager';
import { musicController } from './MusicController';

export interface ActivityContext {
  setState: (st: RobotState) => void;
  setEmotion: (em: RobotEmotion) => void;
  setActivity: (act: RobotActivity) => void;
}

export class ActivityManager {
  private currentActivity: RobotActivity = 'IDLE';
  private previousActivity: RobotActivity = 'IDLE';
  private listeners: ((activity: RobotActivity) => void)[] = [];

  public subscribe(listener: (activity: RobotActivity) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentActivity);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l(this.currentActivity);
    }
  }

  public getCurrentActivity(): RobotActivity {
    return this.currentActivity;
  }

  public startActivity(activity: RobotActivity, context: ActivityContext, payload?: any) {
    this.previousActivity = this.currentActivity;
    this.currentActivity = activity;
    context.setActivity(activity);
    this.notify();

    switch (activity) {
      case 'READING':
        actionManager.executeAction('ReadingAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
          onFinish: () => {
            this.stopActivity(context);
          },
        });
        break;

      case 'SINGING':
        actionManager.executeAction('SingingAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
          onFinish: () => {
            this.stopActivity(context);
          },
        });
        break;

      case 'COOKING':
        actionManager.executeAction('CookingAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
          onFinish: () => {
            this.stopActivity(context);
          },
        });
        break;

      case 'LISTENING_MUSIC':
        musicController.play();
        actionManager.executeAction('MusicAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
        });
        break;

      case 'THINKING':
        actionManager.executeAction('ThinkingAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
        });
        break;

      case 'SLEEPING':
        actionManager.executeAction('SleepAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
        });
        break;

      case 'TALKING':
        actionManager.executeAction('ConversationAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
        });
        break;

      case 'PLAYING':
        actionManager.executeAction('CelebrationAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
          onFinish: () => {
            this.stopActivity(context);
          },
        });
        break;

      case 'RESTING':
      case 'IDLE':
      default:
        this.currentActivity = 'IDLE';
        context.setActivity('IDLE');
        actionManager.executeAction('IdleAction', {
          setState: context.setState,
          setEmotion: context.setEmotion,
        });
        break;
    }
  }

  public stopActivity(context: ActivityContext) {
    if (this.currentActivity === 'LISTENING_MUSIC') {
      musicController.pause();
    }
    this.currentActivity = 'IDLE';
    context.setActivity('IDLE');
    context.setState('IDLE');
    context.setEmotion('NEUTRAL');
    this.notify();
  }
}

export const activityManager = new ActivityManager();
