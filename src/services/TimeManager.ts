/**
 * TimeManager.ts
 * Manages NTP time synchronization, companions alarms, timers, and time-of-day awareness.
 */

import { CompanionTimer, TimeManagerConfig } from '../types';
import { voiceManager } from './VoiceManager';

export class TimeManager {
  private config: TimeManagerConfig = {
    ntpServer: 'pool.ntp.org',
    synced: true,
    offsetMs: 0,
    lastSyncTime: Date.now(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    use24Hour: false,
    activeTimers: [],
  };

  private listeners: (() => void)[] = [];
  private ticker: any = null;

  constructor() {
    this.startTicker();
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

  private startTicker() {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = setInterval(() => {
      this.updateTimers();
    }, 1000);
  }

  private updateTimers() {
    let changed = false;
    this.config.activeTimers = this.config.activeTimers.map((t) => {
      if (t.active && t.remainingSec > 0) {
        changed = true;
        const nextSec = t.remainingSec - 1;
        if (nextSec <= 0) {
          this.triggerTimerAlarm(t);
          return { ...t, remainingSec: 0, active: false };
        }
        return { ...t, remainingSec: nextSec };
      }
      return t;
    });

    if (changed) {
      this.notify();
    }
  }

  private triggerTimerAlarm(timer: CompanionTimer) {
    voiceManager.speak(`Beep beep! Your timer for ${timer.label} has finished!`, 'excited');
    this.notify();
  }

  public getConfig(): TimeManagerConfig {
    return { ...this.config };
  }

  public syncNTP(server: string = 'pool.ntp.org'): Promise<{ success: boolean; latencyMs: number }> {
    return new Promise((resolve) => {
      // Simulate authentic NTP UDP round trip latency
      const start = Date.now();
      setTimeout(() => {
        const latency = Date.now() - start + Math.floor(Math.random() * 25 + 15);
        this.config.ntpServer = server;
        this.config.synced = true;
        this.config.offsetMs = Math.floor((Math.random() - 0.5) * 4); // < 5ms drift
        this.config.lastSyncTime = Date.now();
        this.notify();
        resolve({ success: true, latencyMs: latency });
      }, 400);
    });
  }

  public getNow(): Date {
    return new Date(Date.now() + this.config.offsetMs);
  }

  public getFormattedTime(): string {
    const now = this.getNow();
    return now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !this.config.use24Hour,
    });
  }

  public getFormattedDate(): string {
    const now = this.getNow();
    return now.toLocaleDateString([], {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }

  public getTimeOfDayPeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = this.getNow().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }

  public getTimeGreeting(): string {
    const period = this.getTimeOfDayPeriod();
    switch (period) {
      case 'morning':
        return 'Good morning! Ready for a productive day together?';
      case 'afternoon':
        return 'Good afternoon! Remember to take a quick stretch and sip some water!';
      case 'evening':
        return 'Good evening! How did everything go today?';
      case 'night':
        return 'It is getting late! Even robot companions need their beauty sleep soon!';
    }
  }

  public createTimer(label: string, seconds: number): CompanionTimer {
    const newTimer: CompanionTimer = {
      id: Math.random().toString(36).substring(2, 9),
      label: label || 'Companion Timer',
      totalSec: seconds,
      remainingSec: seconds,
      active: true,
    };
    this.config.activeTimers.push(newTimer);
    this.notify();
    return newTimer;
  }

  public cancelTimer(id: string) {
    this.config.activeTimers = this.config.activeTimers.filter((t) => t.id !== id);
    this.notify();
  }

  public handleTimeQuery(): string {
    const timeStr = this.getFormattedTime();
    const dateStr = this.getFormattedDate();
    const greeting = this.getTimeGreeting();
    return `It is currently ${timeStr} on ${dateStr}. ${greeting}`;
  }
}

export const timeManager = new TimeManager();
