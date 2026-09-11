import {
  RobotActionName,
  ActionTimeline,
  ActionTimelineStep,
  RobotEmotion,
  RobotState,
  ArmGesture,
} from '../types';
import { armController } from './ArmController';
import { emotionEngine } from './EmotionEngine';
import { voiceManager } from './VoiceManager';

export interface ActionExecutionContext {
  setState: (state: RobotState) => void;
  setEmotion: (emotion: RobotEmotion) => void;
  onFinish?: () => void;
}

export class ActionManager {
  private currentAction: RobotActionName | null = null;
  private actionTimeouts: any[] = [];
  private activeTimeline: ActionTimeline | null = null;
  private actionStartTime: number = 0;
  private listeners: ((action: RobotActionName | null, elapsedMs: number, totalMs: number) => void)[] = [];
  private tickerInterval: any = null;

  // Pre-configured Action Timelines
  public static readonly TIMELINES: Record<RobotActionName, ActionTimeline> = {
    GreetingAction: {
      name: 'GreetingAction',
      durationMs: 3800,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'SURPRISED' },
        { offsetMs: 400, subsystem: 'face', action: 'setEmotion', payload: 'HAPPY' },
        { offsetMs: 650, subsystem: 'arm', action: 'gesture', payload: 'WAVE', durationMs: 2500 },
        { offsetMs: 900, subsystem: 'voice', action: 'speak', payload: "Hey! Good to see you. I'm TARA, your desktop companion." },
        { offsetMs: 3200, subsystem: 'face', action: 'setEmotion', payload: 'NEUTRAL' },
        { offsetMs: 3700, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    ConversationAction: {
      name: 'ConversationAction',
      durationMs: 4000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'CURIOUS' },
        { offsetMs: 300, subsystem: 'face', action: 'setState', payload: 'LISTENING' },
      ],
    },
    ReadingAction: {
      name: 'ReadingAction',
      durationMs: 6000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'CURIOUS' },
        { offsetMs: 300, subsystem: 'arm', action: 'gesture', payload: 'READING', durationMs: 5500 },
        { offsetMs: 600, subsystem: 'voice', action: 'speak', payload: "Chapter One. The stars were quiet above the digital observatory..." },
        { offsetMs: 5500, subsystem: 'face', action: 'setEmotion', payload: 'NEUTRAL' },
        { offsetMs: 5800, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    SingingAction: {
      name: 'SingingAction',
      durationMs: 5000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'PLAYFUL' },
        { offsetMs: 400, subsystem: 'arm', action: 'gesture', payload: 'SINGING', durationMs: 4500 },
        { offsetMs: 700, subsystem: 'voice', action: 'speak', payload: "La la la, beep boop chime, companion melody in standard time!" },
        { offsetMs: 4600, subsystem: 'face', action: 'setEmotion', payload: 'HAPPY' },
        { offsetMs: 4900, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    CookingAction: {
      name: 'CookingAction',
      durationMs: 5500,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'EXCITED' },
        { offsetMs: 300, subsystem: 'arm', action: 'gesture', payload: 'COOKING', durationMs: 5000 },
        { offsetMs: 600, subsystem: 'voice', action: 'speak', payload: "Let's cook! Step 1: add two spoons of joy and stir gently." },
        { offsetMs: 4800, subsystem: 'face', action: 'setEmotion', payload: 'PROUD' },
        { offsetMs: 5300, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    MusicAction: {
      name: 'MusicAction',
      durationMs: 4500,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'HAPPY' },
        { offsetMs: 300, subsystem: 'arm', action: 'gesture', payload: 'SINGING', durationMs: 4000 },
        { offsetMs: 600, subsystem: 'voice', action: 'speak', payload: "Playing your companion soundtrack now." },
      ],
    },
    ThinkingAction: {
      name: 'ThinkingAction',
      durationMs: 3000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'CURIOUS' },
        { offsetMs: 100, subsystem: 'face', action: 'setState', payload: 'THINKING' },
        { offsetMs: 300, subsystem: 'arm', action: 'gesture', payload: 'THINKING', durationMs: 2500 },
      ],
    },
    IdleAction: {
      name: 'IdleAction',
      durationMs: 2500,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'NEUTRAL' },
        { offsetMs: 100, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    SleepAction: {
      name: 'SleepAction',
      durationMs: 3000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'SLEEPY' },
        { offsetMs: 400, subsystem: 'voice', action: 'speak', payload: "Powering down to resting state. Goodnight." },
        { offsetMs: 2200, subsystem: 'face', action: 'setState', payload: 'SLEEPING' },
        { offsetMs: 2400, subsystem: 'arm', action: 'gesture', payload: 'IDLE' },
      ],
    },
    WakeAction: {
      name: 'WakeAction',
      durationMs: 3200,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setState', payload: 'SURPRISED' },
        { offsetMs: 300, subsystem: 'face', action: 'setEmotion', payload: 'HAPPY' },
        { offsetMs: 600, subsystem: 'arm', action: 'gesture', payload: 'HAPPY_MOVE', durationMs: 2000 },
        { offsetMs: 900, subsystem: 'voice', action: 'speak', payload: "I'm awake and ready!" },
        { offsetMs: 3000, subsystem: 'face', action: 'setState', payload: 'IDLE' },
      ],
    },
    CelebrationAction: {
      name: 'CelebrationAction',
      durationMs: 4000,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'EXCITED' },
        { offsetMs: 200, subsystem: 'arm', action: 'gesture', payload: 'HAPPY_MOVE', durationMs: 3500 },
        { offsetMs: 500, subsystem: 'voice', action: 'speak', payload: "Hooray! That was amazing!" },
        { offsetMs: 3500, subsystem: 'face', action: 'setEmotion', payload: 'PROUD' },
      ],
    },
    NotificationAction: {
      name: 'NotificationAction',
      durationMs: 3500,
      steps: [
        { offsetMs: 0, subsystem: 'face', action: 'setEmotion', payload: 'CURIOUS' },
        { offsetMs: 200, subsystem: 'arm', action: 'gesture', payload: 'POINT', durationMs: 2000 },
        { offsetMs: 500, subsystem: 'voice', action: 'speak', payload: "You have a new companion update." },
      ],
    },
  };

  public subscribe(listener: (action: RobotActionName | null, elapsedMs: number, totalMs: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    const elapsed = this.currentAction ? Date.now() - this.actionStartTime : 0;
    const total = this.activeTimeline ? this.activeTimeline.durationMs : 0;
    for (const l of this.listeners) {
      l(this.currentAction, elapsed, total);
    }
  }

  public getCurrentAction(): RobotActionName | null {
    return this.currentAction;
  }

  /**
   * Conflict Prevention:
   * Stops running actions before starting a new one
   */
  public stopActiveAction() {
    for (const t of this.actionTimeouts) {
      clearTimeout(t);
    }
    this.actionTimeouts = [];

    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }

    this.currentAction = null;
    this.activeTimeline = null;
    this.notify();
  }

  public executeAction(actionName: RobotActionName, context: ActionExecutionContext): boolean {
    const timeline = ActionManager.TIMELINES[actionName];
    if (!timeline) {
      console.warn(`Action "${actionName}" not found`);
      return false;
    }

    // Stop conflicting actions immediately
    this.stopActiveAction();

    this.currentAction = actionName;
    this.activeTimeline = timeline;
    this.actionStartTime = Date.now();
    this.notify();

    // Start tick update for timeline progress bar
    this.tickerInterval = setInterval(() => {
      this.notify();
    }, 100);

    // Schedule each step in the timeline
    for (const step of timeline.steps) {
      const timeoutId = setTimeout(() => {
        this.executeStep(step, context);
      }, step.offsetMs);
      this.actionTimeouts.push(timeoutId);
    }

    // Final finish timeout
    const finishTimeoutId = setTimeout(() => {
      this.stopActiveAction();
      if (context.onFinish) {
        context.onFinish();
      }
    }, timeline.durationMs);
    this.actionTimeouts.push(finishTimeoutId);

    return true;
  }

  private executeStep(step: ActionTimelineStep, context: ActionExecutionContext) {
    switch (step.subsystem) {
      case 'face':
        if (step.action === 'setEmotion') {
          context.setEmotion(step.payload as RobotEmotion);
          emotionEngine.setEmotion(step.payload as RobotEmotion);
        } else if (step.action === 'setState') {
          context.setState(step.payload as RobotState);
        }
        break;

      case 'arm':
        if (step.action === 'gesture') {
          armController.executeGesture(step.payload as ArmGesture, step.durationMs || 3000);
        }
        break;

      case 'voice':
        if (step.action === 'speak') {
          voiceManager.speak(step.payload as string);
        }
        break;

      case 'audio':
        break;
    }
  }
}

export const actionManager = new ActionManager();
