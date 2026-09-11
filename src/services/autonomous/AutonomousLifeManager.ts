/**
 * AutonomousLifeManager.ts
 * Master Controller for TARA's Autonomous Life System.
 *
 * Architecture:
 * TARA
 *  ├── PersonalityEngine
 *  ├── AutonomousLifeManager
 *  │    ├── ActivitySelector
 *  │    ├── ActivityScheduler
 *  │    ├── ActivityCooldownManager
 *  │    ├── ActivityHistory
 *  │    └── ActivityStateMachine
 *  ├── FaceDecisionEngine
 *  ├── VoiceManager
 *  ├── MusicManager
 *  ├── GameManager
 *  ├── TimeManager
 *  └── PresenceManager
 *
 * Strict Priority:
 * SYSTEM ERROR > USER INTERACTION > LISTENING > USER RESPONSE >
 * USER REQUESTED ACTIVITY > AUTONOMOUS ACTIVITY > REST/IDLE
 */

import {
  AutonomousCandidate,
  AutonomousLifeConfig,
  AutonomousPriority,
  AutonomousStatus,
  PresenceState,
  TaraActivity,
} from '../../types';
import { animationCoordinator } from '../AnimationCoordinator';
import { armController } from '../ArmController';
import { gameManager } from '../GameManager';
import { musicManager } from '../MusicManager';
import { personalityEngine } from '../PersonalityEngine';
import { presenceManager } from '../PresenceManager';
import { voiceManager } from '../VoiceManager';
import { activityCooldownManager } from './ActivityCooldownManager';
import { activityHistory } from './ActivityHistory';
import { activityScheduler } from './ActivityScheduler';
import { activitySelector } from './ActivitySelector';
import { activityStateMachine } from './ActivityStateMachine';

const CONFIG_STORAGE_KEY = 'tara_autonomous_config';

const DEFAULT_CONFIG: AutonomousLifeConfig = {
  enabled: true,
  minIdleTime: 20,       // 20 seconds before choosing activity
  maxIdleTime: 45,       // 45 seconds max before autonomous activity
  minActivityDuration: 20,
  maxActivityDuration: 60,
  activityCooldown: 90,  // 90 seconds
  sleepStart: '23:00',
  sleepEnd: '07:00',
  allowMusic: true,
  allowGames: true,
  allowSinging: true,
  allowCooking: true,
  allowReading: true,
  allowDancing: true,
  allowThinking: true,
  allowObserving: true,
  allowRelaxing: true,
  allowLearning: true,
};

export class AutonomousLifeManager {
  private config: AutonomousLifeConfig = { ...DEFAULT_CONFIG };
  private currentPriority: AutonomousPriority = 'REST_IDLE';
  private lastUserInteractionMs: number = Date.now();
  private isUserActive: boolean = false;
  private userInteractionTimer: any = null;
  private loopInterval: any = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadConfig();
    this.initLoop();
    this.hookSubsystemEvents();
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

  private loadConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (raw) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch {
      this.config = { ...DEFAULT_CONFIG };
    }
  }

  public saveConfig(newConfig: Partial<AutonomousLifeConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(this.config));
    } catch {
      // Ignore quota errors
    }
    this.notify();
  }

  public getConfig(): AutonomousLifeConfig {
    return { ...this.config };
  }

  /**
   * Initializes autonomous update loop (ticks every 500ms).
   */
  private initLoop() {
    if (this.loopInterval) clearInterval(this.loopInterval);
    let lastTime = Date.now();

    this.loopInterval = setInterval(() => {
      const now = Date.now();
      const dtMs = now - lastTime;
      lastTime = now;

      if (!this.config.enabled) return;

      const timeSinceInteractionSec = (now - this.lastUserInteractionMs) / 1000;

      // Update current priority
      this.evaluateCurrentPriority();

      // Tick scheduler
      activityScheduler.update(
        dtMs,
        this.config,
        timeSinceInteractionSec,
        this.isUserActive
      );

      this.notify();
    }, 500);
  }

  /**
   * Evaluates and sets the strict priority level.
   */
  private evaluateCurrentPriority() {
    if (this.isUserActive) {
      this.currentPriority = 'USER_INTERACTION';
    } else if (voiceManager.isSpeaking()) {
      this.currentPriority = 'USER_RESPONSE';
    } else if (gameManager.getActiveGame() !== 'NONE') {
      this.currentPriority = 'USER_REQUESTED_ACTIVITY';
    } else if (activityStateMachine.isRunning()) {
      this.currentPriority = 'AUTONOMOUS_ACTIVITY';
    } else {
      this.currentPriority = 'REST_IDLE';
    }
  }

  /**
   * CRITICAL: USER ALWAYS HAS PRIORITY.
   * Called immediately whenever user types, speaks, triggers a button, or touches TARA.
   */
  public notifyUserInteraction(type: string = 'chat') {
    this.lastUserInteractionMs = Date.now();
    this.isUserActive = true;
    this.currentPriority = 'USER_INTERACTION';

    if (this.userInteractionTimer) clearTimeout(this.userInteractionTimer);

    // If currently sleeping, wake up gently!
    if (activityStateMachine.getCurrentActivity() === 'SLEEPING') {
      activityStateMachine.stop('user woke TARA', true);
      animationCoordinator.setExpression('surprised');
      armController.setGesture('GREETING');
      voiceManager.speak('Oh! Hello! I was having a sweet nap, but I\'m right here for you!', 'happy');
      setTimeout(() => {
        animationCoordinator.setExpression('happy');
        armController.setGesture('WAVE');
      }, 1400);
    }
    // If performing an autonomous activity, pause or yield to the user immediately!
    else if (activityStateMachine.isRunning()) {
      activityStateMachine.pause(`user interaction: ${type}`);
    }

    // User active window lasts for 12 seconds after last interaction
    this.userInteractionTimer = setTimeout(() => {
      this.isUserActive = false;
      this.evaluateCurrentPriority();
      this.notify();
    }, 12000);

    this.notify();
  }

  /**
   * Hooks presence and external manager events.
   */
  private hookSubsystemEvents() {
    // 1. Listen for Presence changes (User approaches or enters range)
    presenceManager.subscribe((presence: PresenceState) => {
      if (presence.detected) {
        this.onPresenceDetected(presence);
      }
    });

    // 2. Listen for voice completion to restore normal priority
    voiceManager.subscribe(() => {
      this.evaluateCurrentPriority();
      this.notify();
    });
  }

  /**
   * Handles user approaching TARA.
   * If TARA is doing an activity, trigger a brief natural SHY reaction without physical head movement!
   */
  private onPresenceDetected(presence: PresenceState) {
    if (!this.config.enabled) return;

    // If an activity is underway, TARA notices the user and displays a brief cute shy moment!
    if (activityStateMachine.isRunning() && !personalityEngine.getIsShyActive()) {
      const traits = personalityEngine.getTraits();
      if (traits.slightlyShy > 60 && Math.random() < 0.6) {
        // Notice user with zero head displacement
        personalityEngine.triggerShyReaction('TARA noticed you approaching!');
      }
    }
  }

  // =========================================================================
  // SIMULATION CONTROLS & DEVELOPER FORCE CONTROLS
  // =========================================================================

  /**
   * Force an activity immediately (e.g. for testing & simulation).
   */
  public forceActivity(activity: TaraActivity, durationSec: number = 30) {
    this.isUserActive = false;
    activityStateMachine.start(activity, durationSec, 'developer forced simulation');
    this.notify();
  }

  /**
   * Stop current activity immediately.
   */
  public stopActivity() {
    activityStateMachine.stop('developer manual stop', false);
    activityScheduler.resetIdle(this.config);
    this.notify();
  }

  /**
   * Simulate user interaction.
   */
  public simulateUserInteraction() {
    this.notifyUserInteraction('simulated user touch/voice');
  }

  /**
   * Simulate presence sensor state.
   */
  public simulatePresence(detected: boolean, distanceCm: number = 45) {
    presenceManager.setPresence(detected, distanceCm);
    this.notify();
  }

  /**
   * Returns complete diagnostic snapshot for UI debug panels.
   */
  public getStatus(): AutonomousStatus {
    const presence = presenceManager.getState();
    const mood = personalityEngine.getMood();
    const lastInteractionSecAgo = Math.floor((Date.now() - this.lastUserInteractionMs) / 1000);

    return {
      enabled: this.config.enabled,
      currentPriority: this.currentPriority,
      executionState: activityStateMachine.getState(),
      currentActivity: activityStateMachine.getCurrentActivity(),
      previousActivity: activityHistory.getPreviousDistinctActivity() ?? 'IDLE',
      nextCandidate: activityScheduler.getNextCandidate(),
      idleDurationSec: activityScheduler.getIdleTimerSec(),
      activityDurationSec: activityStateMachine.getElapsedSec(),
      remainingDurationSec: activityStateMachine.getRemainingSec(),
      selectionReason: activityStateMachine.isRunning()
        ? activityStateMachine.getReason()
        : activityScheduler.getSelectionReason(),
      isSleeping: activityStateMachine.getCurrentActivity() === 'SLEEPING',
      personalityMood: mood,
      userPresent: presence.detected,
      lastUserInteractionSecAgo: lastInteractionSecAgo,
    };
  }

  // Expose modular subcomponents
  public get CooldownManager() {
    return activityCooldownManager;
  }
  public get History() {
    return activityHistory;
  }
  public get Selector() {
    return activitySelector;
  }
  public get StateMachine() {
    return activityStateMachine;
  }
  public get Scheduler() {
    return activityScheduler;
  }
}

export const autonomousLifeManager = new AutonomousLifeManager();
