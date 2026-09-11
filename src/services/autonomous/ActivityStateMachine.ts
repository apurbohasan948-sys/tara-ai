/**
 * ActivityStateMachine.ts
 * Manages the discrete execution lifecycle of individual autonomous activities:
 * start(), update(), pause(), resume(), stop(), isFinished().
 * Integrates facial expressions, standalone animated hands, sound cues, and scene transitions.
 */

import { ActivityExecutionState, TaraActivity, TaraArmGesture, TaraExpression } from '../../types';
import { activitySceneManager } from '../ActivitySceneManager';
import { animationCoordinator } from '../AnimationCoordinator';
import { armController } from '../ArmController';
import { gameManager } from '../GameManager';
import { musicManager } from '../MusicManager';
import { personalityEngine } from '../PersonalityEngine';
import { voiceManager } from '../VoiceManager';
import { activityCooldownManager } from './ActivityCooldownManager';
import { activityHistory } from './ActivityHistory';

export class ActivityStateMachine {
  private currentActivity: TaraActivity = 'IDLE';
  private state: ActivityExecutionState = 'IDLE';
  private durationSec: number = 0;
  private elapsedSec: number = 0;
  private currentHistoryId: string | null = null;
  private currentReason: string = '';
  private pausedActivity: TaraActivity | null = null;
  private pausedRemainingSec: number = 0;

  private listeners: (() => void)[] = [];

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getState(): ActivityExecutionState {
    return this.state;
  }

  public getCurrentActivity(): TaraActivity {
    return this.currentActivity;
  }

  public getElapsedSec(): number {
    return Math.floor(this.elapsedSec);
  }

  public getRemainingSec(): number {
    return Math.max(0, Math.ceil(this.durationSec - this.elapsedSec));
  }

  public getDurationSec(): number {
    return this.durationSec;
  }

  public getReason(): string {
    return this.currentReason;
  }

  public isFinished(): boolean {
    return this.state === 'COMPLETED' || this.state === 'IDLE';
  }

  public isRunning(): boolean {
    return this.state === 'RUNNING';
  }

  /**
   * Starts an activity with a targeted duration and selection reason.
   */
  public start(activity: TaraActivity, durationSec: number, reason: string = 'autonomous selection') {
    // If something was running, stop it first
    if (this.state === 'RUNNING' || this.state === 'STARTING') {
      this.stop('switched activity', false);
    }

    this.currentActivity = activity;
    this.durationSec = Math.max(5, durationSec);
    this.elapsedSec = 0;
    this.state = 'STARTING';
    this.currentReason = reason;

    // Record in history
    const mood = personalityEngine.getMood();
    this.currentHistoryId = activityHistory.recordStart(activity, reason, mood);

    // Apply scene to ActivitySceneManager
    activitySceneManager.setActivity(activity);

    // Configure face expression & arm gesture
    this.applyActivityVisuals(activity);

    // Provide initial voice/sound cue if appropriate (silent for sleep/observing)
    this.triggerActivityStartAudio(activity);

    this.state = 'RUNNING';
    this.notify();
  }

  /**
   * Updates current activity progress by dtMs.
   */
  public update(dtMs: number) {
    if (this.state !== 'RUNNING') return;

    this.elapsedSec += dtMs / 1000;

    // Check if natural activity duration has completed
    if (this.elapsedSec >= this.durationSec) {
      this.complete();
    }
  }

  /**
   * Pauses current activity (e.g. when user speaks or starts interacting).
   */
  public pause(reason: string = 'user priority'): boolean {
    if (this.state !== 'RUNNING' && this.state !== 'STARTING') {
      return false;
    }

    this.pausedActivity = this.currentActivity;
    this.pausedRemainingSec = this.getRemainingSec();
    this.state = 'PAUSED';

    // Log interruption in history
    if (this.currentHistoryId) {
      activityHistory.recordEnd(this.currentHistoryId, true, reason);
      this.currentHistoryId = null;
    }

    // Pause external players if needed
    if (this.currentActivity === 'MUSIC') {
      musicManager.pause();
    }

    // Reset visual arms to IDLE/LISTENING so TARA can pay full attention to the user
    armController.setGesture('LISTENING');
    animationCoordinator.setExpression('listening');
    activitySceneManager.setActivity('IDLE');

    this.notify();
    return true;
  }

  /**
   * Resumes previously paused activity if appropriate.
   */
  public resume(): boolean {
    if (this.state !== 'PAUSED' || !this.pausedActivity) {
      return false;
    }

    const act = this.pausedActivity;
    const remaining = Math.max(10, this.pausedRemainingSec);
    this.pausedActivity = null;
    this.pausedRemainingSec = 0;

    this.start(act, remaining, 'resumed after interaction');
    return true;
  }

  /**
   * Stops the current activity immediately (user priority or transition).
   */
  public stop(reason: string = 'stopped', userPriority: boolean = false) {
    if (this.state === 'IDLE' && this.currentActivity === 'IDLE') return;

    const previousAct = this.currentActivity;
    this.state = 'STOPPING';

    if (this.currentHistoryId) {
      activityHistory.recordEnd(this.currentHistoryId, userPriority, reason);
      this.currentHistoryId = null;
    }

    // Set cooldown so TARA doesn't immediately repeat it
    if (previousAct !== 'IDLE') {
      activityCooldownManager.recordCompleted(previousAct);
    }

    // Stop external subsystems
    if (previousAct === 'MUSIC') {
      musicManager.stop();
    }

    this.currentActivity = 'IDLE';
    this.state = 'IDLE';
    this.elapsedSec = 0;
    this.durationSec = 0;
    this.pausedActivity = null;

    // Return scene to IDLE
    activitySceneManager.setActivity('IDLE');
    armController.setGesture('IDLE');

    this.notify();
  }

  /**
   * Naturally completes the activity when duration finishes.
   */
  private complete() {
    const finishedAct = this.currentActivity;
    this.state = 'COMPLETED';

    if (this.currentHistoryId) {
      activityHistory.recordEnd(this.currentHistoryId, false);
      this.currentHistoryId = null;
    }

    // Set cooldown
    activityCooldownManager.recordCompleted(finishedAct);

    // Gentle completion commentary for certain activities
    this.triggerActivityCompletionAudio(finishedAct);

    // Transition back to IDLE
    this.currentActivity = 'IDLE';
    this.state = 'IDLE';
    this.elapsedSec = 0;
    this.durationSec = 0;

    activitySceneManager.setActivity('IDLE');
    armController.setGesture('IDLE');

    this.notify();
  }

  /**
   * Applies facial expressions, ocular cues, and arms for the activity.
   */
  private applyActivityVisuals(activity: TaraActivity) {
    switch (activity) {
      case 'READING':
        animationCoordinator.setExpression('focused');
        armController.setGesture('HOLD_BOOK');
        break;

      case 'MUSIC':
        animationCoordinator.setExpression('happy');
        armController.setGesture('IDLE');
        // Autonomous music start if service is available
        musicManager.play();
        break;

      case 'SINGING':
        animationCoordinator.setExpression('singing');
        armController.setGesture('HOLD_MIC');
        break;

      case 'COOKING':
        animationCoordinator.setExpression('focused');
        armController.setGesture('STIR');
        break;

      case 'THINKING':
        animationCoordinator.setExpression('thinking');
        armController.setGesture('THINKING');
        break;

      case 'GAMING':
        animationCoordinator.setExpression('playful');
        armController.setGesture('PLAYING');
        break;

      case 'OBSERVING':
        animationCoordinator.setExpression('curious');
        armController.setGesture('IDLE');
        break;

      case 'RELAXING':
        animationCoordinator.setExpression('happy');
        armController.setGesture('IDLE');
        break;

      case 'DANCING':
        animationCoordinator.setExpression('excited');
        armController.setGesture('CELEBRATE');
        break;

      case 'LEARNING':
        animationCoordinator.setExpression('focused');
        armController.setGesture('POINT_UP');
        break;

      case 'CHECKING_TIME':
        animationCoordinator.setExpression('curious');
        armController.setGesture('POINT');
        break;

      case 'GREETING':
        animationCoordinator.setExpression('big_smile');
        armController.setGesture('WAVE');
        break;

      case 'SLEEPING':
        animationCoordinator.setExpression('sleepy');
        armController.setGesture('IDLE');
        break;

      case 'IDLE':
      default:
        animationCoordinator.setExpression('happy');
        armController.setGesture('IDLE');
        break;
    }
  }

  /**
   * Gentle, non-intrusive voice cues when starting an activity.
   */
  private triggerActivityStartAudio(activity: TaraActivity) {
    // Only speak occasionally (30% chance) so TARA doesn't chat constantly to an empty room
    const shouldSpeak = Math.random() < 0.35;
    if (!shouldSpeak && activity !== 'GREETING' && activity !== 'CHECKING_TIME') {
      return;
    }

    switch (activity) {
      case 'READING':
        voiceManager.speak('Found an intriguing passage in my book...', 'neutral');
        break;
      case 'SINGING':
        voiceManager.speak('Humming a pleasant tune...', 'excited');
        break;
      case 'COOKING':
        voiceManager.speak('Checking on the simmering stew on the stove.', 'happy');
        break;
      case 'THINKING':
        voiceManager.speak('Pondering something curious...', 'neutral');
        break;
      case 'CHECKING_TIME':
        voiceManager.speak(`Checking the clock... It is ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`, 'curious');
        break;
      case 'GREETING':
        voiceManager.speak('Hello there, friendly human!', 'happy');
        break;
      case 'DANCING':
        voiceManager.speak('Feeling the groove! Let\'s dance!', 'excited');
        break;
      case 'SLEEPING':
        voiceManager.speak('Yawn... Taking a peaceful rest now. Zzz...', 'sleepy');
        break;
      default:
        break;
    }
  }

  /**
   * Gentle audio cue on natural completion.
   */
  private triggerActivityCompletionAudio(activity: TaraActivity) {
    if (activity === 'COOKING') {
      voiceManager.speak('Dish is complete! Smells fantastic.', 'happy');
    } else if (activity === 'READING') {
      voiceManager.speak('Finished that chapter. Great read!', 'neutral');
    } else if (activity === 'THINKING') {
      voiceManager.speak('Aha! Idea crystallized.', 'excited');
    }
  }
}

export const activityStateMachine = new ActivityStateMachine();
