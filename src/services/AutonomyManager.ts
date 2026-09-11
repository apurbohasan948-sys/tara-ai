import { AutonomyConfig, RobotEmotion, RobotState } from '../types';
import { armController } from './ArmController';
import { emotionEngine } from './EmotionEngine';
import { voiceManager } from './VoiceManager';

export class AutonomyManager {
  private config: AutonomyConfig = {
    enabled: true,
    idleFrequencySeconds: 35,
    greetingEnabled: true,
    greetingCooldownMinutes: 5,
    voiceEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  };

  private timer: any = null;
  private isRunning: boolean = false;
  private lastActionTime: number = Date.now();
  private onTriggerCallback?: (state: RobotState, emotion: RobotEmotion) => void;

  constructor() {
    this.start();
  }

  public getConfig(): AutonomyConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<AutonomyConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.restart();
  }

  public setCallback(cb: (state: RobotState, emotion: RobotEmotion) => void) {
    this.onTriggerCallback = cb;
  }

  public start() {
    if (this.timer) clearInterval(this.timer);
    this.isRunning = true;
    this.timer = setInterval(() => {
      this.checkAutonomousBehavior();
    }, 10000);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  private restart() {
    this.stop();
    if (this.config.enabled) {
      this.start();
    }
  }

  private isQuietHour(): boolean {
    if (!this.config.quietHoursEnabled) return false;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = this.config.quietHoursStart.split(':').map(Number);
    const [endH, endM] = this.config.quietHoursEnd.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (startMin <= endMin) {
      return currentMin >= startMin && currentMin <= endMin;
    } else {
      // Crosses midnight (e.g. 22:00 to 07:00)
      return currentMin >= startMin || currentMin <= endMin;
    }
  }

  public checkAutonomousBehavior() {
    if (!this.config.enabled || this.isQuietHour()) return;

    const now = Date.now();
    const elapsedSec = (now - this.lastActionTime) / 1000;
    if (elapsedSec < this.config.idleFrequencySeconds) return;

    this.lastActionTime = now;
    this.executeRandomIdleBehavior();
  }

  public executeRandomIdleBehavior() {
    // 5 Harmless autonomous companion micro-behaviors
    const roll = Math.floor(Math.random() * 5);

    switch (roll) {
      case 0:
        // Look around curiously
        emotionEngine.setEmotion('CURIOUS', 0.7, 3000, () => {
          if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'NEUTRAL');
        });
        if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'CURIOUS');
        break;

      case 1:
        // Gentle arm stretch / small wave
        armController.executeGesture('HAPPY_MOVE', 2200);
        emotionEngine.setEmotion('HAPPY', 0.6, 2500, () => {
          if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'NEUTRAL');
        });
        if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'HAPPY');
        break;

      case 2:
        // Sleepy slow blink
        emotionEngine.setEmotion('SLEEPY', 0.6, 3500, () => {
          if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'NEUTRAL');
        });
        if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'SLEEPY');
        break;

      case 3:
        // Playful grin
        emotionEngine.setEmotion('PLAYFUL', 0.8, 3000, () => {
          if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'NEUTRAL');
        });
        if (this.onTriggerCallback) this.onTriggerCallback('IDLE', 'PLAYFUL');
        break;

      case 4:
        // Occasional harmless thought (if voice is enabled)
        if (this.config.voiceEnabled && Math.random() < 0.3) {
          const thoughts = [
            "Just checking in, systems are running smoothly!",
            "I'm ready whenever you need me.",
            "All quiet on the desktop.",
          ];
          const pick = thoughts[Math.floor(Math.random() * thoughts.length)];
          voiceManager.speak(pick);
        }
        break;
    }
  }
}

export const autonomyManager = new AutonomyManager();
