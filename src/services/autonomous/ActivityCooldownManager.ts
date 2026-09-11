/**
 * ActivityCooldownManager.ts
 * Manages autonomous activity cooldown periods to prevent repetitive behaviors.
 */

import { TaraActivity } from '../../types';

export class ActivityCooldownManager {
  private lastCompletedTime: Map<TaraActivity, number> = new Map();
  private customCooldowns: Map<TaraActivity, number> = new Map();

  /**
   * Default cooldowns per activity in seconds.
   */
  private defaultCooldowns: Record<TaraActivity, number> = {
    IDLE: 0,
    READING: 120,      // 2 minutes
    MUSIC: 90,        // 1.5 minutes
    SINGING: 180,      // 3 minutes
    COOKING: 240,      // 4 minutes
    THINKING: 60,      // 1 minute
    GAMING: 180,       // 3 minutes
    OBSERVING: 45,     // 45 seconds
    RELAXING: 90,      // 1.5 minutes
    DANCING: 200,      // ~3.3 minutes
    LEARNING: 120,     // 2 minutes
    CHECKING_TIME: 60, // 1 minute
    GREETING: 180,     // 3 minutes
    SLEEPING: 300,     // 5 minutes
    LISTENING: 0,
    SPEAKING: 0,
  };

  /**
   * Sets custom cooldown for an activity in seconds.
   */
  public setCooldown(activity: TaraActivity, seconds: number) {
    this.customCooldowns.set(activity, seconds);
  }

  /**
   * Gets effective cooldown in seconds.
   */
  public getCooldownSec(activity: TaraActivity): number {
    if (this.customCooldowns.has(activity)) {
      return this.customCooldowns.get(activity)!;
    }
    return this.defaultCooldowns[activity] ?? 60;
  }

  /**
   * Records that an activity finished right now.
   */
  public recordCompleted(activity: TaraActivity) {
    this.lastCompletedTime.set(activity, Date.now());
  }

  /**
   * Checks whether the activity is currently on cooldown.
   */
  public isOnCooldown(activity: TaraActivity): boolean {
    const last = this.lastCompletedTime.get(activity);
    if (!last) return false;
    const cooldownMs = this.getCooldownSec(activity) * 1000;
    return Date.now() - last < cooldownMs;
  }

  /**
   * Gets the remaining cooldown time in seconds (0 if ready).
   */
  public getRemainingCooldownSec(activity: TaraActivity): number {
    const last = this.lastCompletedTime.get(activity);
    if (!last) return 0;
    const cooldownMs = this.getCooldownSec(activity) * 1000;
    const elapsed = Date.now() - last;
    if (elapsed >= cooldownMs) return 0;
    return Math.ceil((cooldownMs - elapsed) / 1000);
  }

  /**
   * Gets a map of all activities and their cooldown status.
   */
  public getAllCooldownStatuses(): { activity: TaraActivity; onCooldown: boolean; remainingSec: number }[] {
    const activities: TaraActivity[] = [
      'READING',
      'MUSIC',
      'SINGING',
      'COOKING',
      'THINKING',
      'GAMING',
      'OBSERVING',
      'RELAXING',
      'DANCING',
      'LEARNING',
      'CHECKING_TIME',
      'GREETING',
      'SLEEPING',
    ];

    return activities.map((act) => ({
      activity: act,
      onCooldown: this.isOnCooldown(act),
      remainingSec: this.getRemainingCooldownSec(act),
    }));
  }

  /**
   * Clears all cooldowns (useful for simulation & testing).
   */
  public reset() {
    this.lastCompletedTime.clear();
  }
}

export const activityCooldownManager = new ActivityCooldownManager();
