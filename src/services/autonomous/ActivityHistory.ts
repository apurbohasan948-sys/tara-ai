/**
 * ActivityHistory.ts
 * Lightweight, privacy-safe history logger of TARA's autonomous activities.
 * Prevents repetitive behaviors and tracks interaction dynamics.
 */

import { ActivityHistoryItem, TaraActivity } from '../../types';

const STORAGE_KEY = 'tara_activity_history';
const MAX_HISTORY_ENTRIES = 50;

export class ActivityHistory {
  private history: ActivityHistoryItem[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.load();
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

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.history = parsed.slice(0, MAX_HISTORY_ENTRIES);
        }
      }
    } catch {
      this.history = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history.slice(0, MAX_HISTORY_ENTRIES)));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  /**
   * Records the start of an activity. Returns the unique entry ID.
   */
  public recordStart(
    activity: TaraActivity,
    reason: string,
    personalityState: string
  ): string {
    const id = 'act_' + Math.random().toString(36).substring(2, 9);
    const item: ActivityHistoryItem = {
      id,
      activity,
      startTime: Date.now(),
      durationSec: 0,
      reason,
      personalityState,
      interrupted: false,
    };
    this.history.unshift(item);
    if (this.history.length > MAX_HISTORY_ENTRIES) {
      this.history.pop();
    }
    this.persist();
    return id;
  }

  /**
   * Records the completion or interruption of an activity.
   */
  public recordEnd(id: string, interrupted: boolean = false, interruptedBy?: string) {
    const item = this.history.find((h) => h.id === id);
    if (item) {
      item.endTime = Date.now();
      item.durationSec = Math.round((item.endTime - item.startTime) / 1000);
      item.interrupted = interrupted;
      item.interruptedBy = interruptedBy;
      this.persist();
    }
  }

  /**
   * Gets the most recent activity.
   */
  public getLastActivity(): ActivityHistoryItem | null {
    return this.history.length > 0 ? this.history[0] : null;
  }

  /**
   * Gets the previous distinct activity before the current one.
   */
  public getPreviousDistinctActivity(): TaraActivity | null {
    if (this.history.length > 1) {
      return this.history[1].activity;
    }
    return null;
  }

  /**
   * Returns recent activities up to a limit.
   */
  public getRecent(limit: number = 10): ActivityHistoryItem[] {
    return this.history.slice(0, limit);
  }

  /**
   * Checks how many times this activity ran within the given time window in ms.
   */
  public getFrequency(activity: TaraActivity, timeWindowMs: number = 300000): number {
    const cutoff = Date.now() - timeWindowMs;
    return this.history.filter((h) => h.activity === activity && h.startTime > cutoff).length;
  }

  /**
   * Checks if an activity was interrupted recently.
   */
  public wasRecentlyInterrupted(activity: TaraActivity): boolean {
    const last = this.history.find((h) => h.activity === activity);
    return !!last && last.interrupted;
  }

  /**
   * Clears activity history.
   */
  public clear() {
    this.history = [];
    this.persist();
  }
}

export const activityHistory = new ActivityHistory();
