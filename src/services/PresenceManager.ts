/**
 * PresenceManager.ts
 * Manages simulated mmWave radar / PIR human presence detection
 */

import { PresenceState } from '../types';
import { taraBehaviorManager } from './TaraBehaviorManager';

export class PresenceManager {
  private state: PresenceState = {
    detected: true,
    distanceCm: 65,
    motionScore: 0.4,
    lastDetectedMs: Date.now(),
  };

  private listeners: ((state: PresenceState) => void)[] = [];

  public getState(): PresenceState {
    return { ...this.state };
  }

  public subscribe(cb: (state: PresenceState) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  public setPresence(detected: boolean, distanceCm: number = 65, motionScore: number = 0.5) {
    this.state = {
      detected,
      distanceCm,
      motionScore,
      lastDetectedMs: Date.now(),
    };
    if (detected) {
      taraBehaviorManager.onUserPresence(distanceCm);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }
}

export const presenceManager = new PresenceManager();
