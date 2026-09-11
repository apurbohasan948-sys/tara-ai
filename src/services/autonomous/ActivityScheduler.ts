/**
 * ActivityScheduler.ts
 * Manages the timing loop, randomized idle countdowns, and triggers next activity selection.
 * Ensures TARA does not behave like a predictable mechanical timer.
 */

import { AutonomousCandidate, AutonomousLifeConfig } from '../../types';
import { activitySelector } from './ActivitySelector';
import { activityStateMachine } from './ActivityStateMachine';

export class ActivityScheduler {
  private idleTimerSec: number = 0;
  private targetIdleSec: number = 20; // Randomized interval before next autonomous activity
  private nextCandidate: AutonomousCandidate | null = null;
  private selectionReason: string = '';

  constructor() {
    this.randomizeTargetIdle(15, 30);
  }

  /**
   * Randomizes the idle wait time within [minIdle, maxIdle].
   */
  public randomizeTargetIdle(minSec: number, maxSec: number) {
    const min = Math.max(5, minSec);
    const max = Math.max(min + 5, maxSec);
    this.targetIdleSec = Math.floor(min + Math.random() * (max - min));
    this.idleTimerSec = 0;
  }

  public getIdleTimerSec(): number {
    return Math.floor(this.idleTimerSec);
  }

  public getTargetIdleSec(): number {
    return this.targetIdleSec;
  }

  public getNextCandidate(): AutonomousCandidate | null {
    return this.nextCandidate;
  }

  public getSelectionReason(): string {
    return this.selectionReason;
  }

  /**
   * Main scheduler tick called by AutonomousLifeManager.
   */
  public update(
    dtMs: number,
    config: AutonomousLifeConfig,
    timeSinceInteractionSec: number,
    isUserActive: boolean
  ) {
    // If an activity is running, let the state machine tick
    if (activityStateMachine.isRunning()) {
      activityStateMachine.update(dtMs);
      this.idleTimerSec = 0;
      return;
    }

    // If user is currently actively interacting, hold idle count at zero
    if (isUserActive) {
      this.idleTimerSec = 0;
      return;
    }

    // Accumulate idle time
    this.idleTimerSec += dtMs / 1000;

    // Periodically update next candidate preview for inspection
    if (Math.floor(this.idleTimerSec) % 4 === 0) {
      const evaluation = activitySelector.selectActivity(config, timeSinceInteractionSec);
      this.nextCandidate = evaluation.selected;
      this.selectionReason = evaluation.selected.reason;
    }

    // When idle duration threshold is reached, launch the selected activity
    if (this.idleTimerSec >= this.targetIdleSec) {
      const evaluation = activitySelector.selectActivity(config, timeSinceInteractionSec);
      const chosen = evaluation.selected;
      this.nextCandidate = chosen;
      this.selectionReason = chosen.reason;

      // Start the activity
      activityStateMachine.start(chosen.activity, chosen.recommendedDuration, chosen.reason);

      // Reset and randomize next target idle duration for after this activity
      this.randomizeTargetIdle(config.minIdleTime, config.maxIdleTime);
    }
  }

  /**
   * Resets idle timer (e.g. after user interaction or activity completion).
   */
  public resetIdle(config: AutonomousLifeConfig) {
    this.randomizeTargetIdle(config.minIdleTime, config.maxIdleTime);
  }
}

export const activityScheduler = new ActivityScheduler();
