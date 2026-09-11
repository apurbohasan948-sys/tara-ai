import {
  RobotActivity,
  RobotEmotion,
  ArmGesture,
  SceneType,
  ScenePropsState,
  ActivityPriority,
  AnimationEventLogEntry,
  ActionTimeline,
} from '../types';
import { expressionManager } from './ExpressionManager';
import { armController } from './ArmController';

export interface TimelineTrackStep {
  timeSec: number;
  stageName: string;
  propChanges?: Partial<ScenePropsState>;
  suggestedEmotion?: RobotEmotion;
  armGesture?: ArmGesture;
  headTilt?: number;
  gazeTarget?: 'FORWARD' | 'LOOK_AT_POT' | 'LOOK_AT_BOOK' | 'LOOK_AT_MIC' | 'UP';
  description: string;
}

export interface ActivitySceneDefinition {
  sceneType: SceneType;
  activity: RobotActivity;
  defaultProps: ScenePropsState;
  suggestedBaseEmotion: RobotEmotion;
  timeline: TimelineTrackStep[];
}

export class ActivitySceneManager {
  private currentActivity: RobotActivity = 'IDLE';
  private currentScene: SceneType = 'IdleScene';
  private currentPriority: ActivityPriority = 'IDLE';

  // Manual prop overrides from simulation UI
  private manualProps: ScenePropsState = {
    flame: false,
    steam: false,
    microphone: false,
    book: false,
    musicNotes: false,
    spoonStirring: false,
    potCooking: false,
    speaker: false,
    thoughtCloud: false,
  };

  // Active scene props (blended from timeline + manual overrides)
  private activeProps: ScenePropsState = { ...this.manualProps };

  // Activity timeline execution state
  private timelineStartTime: number = Date.now();
  private timelineDurationSec: number = 20;
  private currentStageIndex: number = 0;
  private currentStageName: string = 'IDLE';

  // Animation event log (bounded ring-buffer of 60 entries)
  private eventLog: AnimationEventLogEntry[] = [];
  private logListeners: ((entries: AnimationEventLogEntry[]) => void)[] = [];
  private sceneListeners: ((scene: SceneType, props: ScenePropsState) => void)[] = [];

  // Scene definitions
  private static readonly SCENES: Record<RobotActivity, ActivitySceneDefinition> = {
    IDLE: {
      sceneType: 'IdleScene',
      activity: 'IDLE',
      suggestedBaseEmotion: 'NEUTRAL',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        { timeSec: 0, stageName: 'RESTING', description: 'TARA in attentive desktop standby' },
      ],
    },
    COOKING: {
      sceneType: 'CookingScene',
      activity: 'COOKING',
      suggestedBaseEmotion: 'FOCUSED',
      defaultProps: {
        flame: true,
        steam: true,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: true,
        potCooking: true,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'START_COOKING',
          propChanges: { potCooking: true, flame: false, steam: false, spoonStirring: false },
          suggestedEmotion: 'FOCUSED',
          armGesture: 'ARM_STIR',
          gazeTarget: 'LOOK_AT_POT',
          description: 'Approaching stove; placed pot on burner',
        },
        {
          timeSec: 2,
          stageName: 'STOVE_IGNITION',
          propChanges: { flame: true, steam: false },
          suggestedEmotion: 'FOCUSED',
          gazeTarget: 'LOOK_AT_POT',
          description: 'Stove burner ON, flame ignites beneath pot',
        },
        {
          timeSec: 4,
          stageName: 'STEAM_RISING',
          propChanges: { steam: true },
          suggestedEmotion: 'CURIOUS',
          gazeTarget: 'LOOK_AT_POT',
          description: 'Pot heating up, steam begins rising',
        },
        {
          timeSec: 7,
          stageName: 'STIRRING_FOOD',
          propChanges: { spoonStirring: true },
          suggestedEmotion: 'HAPPY',
          armGesture: 'ARM_STIR',
          gazeTarget: 'LOOK_AT_POT',
          description: 'Holding cooking utensil, stirring the pot steadily',
        },
        {
          timeSec: 12,
          stageName: 'CHECKING_TASTE',
          propChanges: { spoonStirring: false },
          suggestedEmotion: 'PROUD',
          armGesture: 'ARM_THUMBS_UP',
          gazeTarget: 'FORWARD',
          description: 'Pausing stirring to inspect aroma and taste',
        },
        {
          timeSec: 16,
          stageName: 'COOKING_PERFECT',
          propChanges: { flame: false, steam: true, spoonStirring: false },
          suggestedEmotion: 'BIG_SMILE',
          armGesture: 'ARM_CELEBRATE',
          gazeTarget: 'FORWARD',
          description: 'Flame turned off, meal prepared successfully!',
        },
      ],
    },
    SINGING: {
      sceneType: 'SingingScene',
      activity: 'SINGING',
      suggestedBaseEmotion: 'EXCITED',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: true,
        book: false,
        musicNotes: true,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'RAISE_MIC',
          propChanges: { microphone: true, musicNotes: false },
          suggestedEmotion: 'SMILING',
          armGesture: 'ARM_HOLD_MIC',
          gazeTarget: 'LOOK_AT_MIC',
          description: 'Raising microphone to singing position',
        },
        {
          timeSec: 2,
          stageName: 'VOCAL_INTRO',
          propChanges: { microphone: true, musicNotes: true },
          suggestedEmotion: 'EXCITED',
          armGesture: 'ARM_HOLD_MIC',
          gazeTarget: 'FORWARD',
          description: 'Music intro starts, singing first verse',
        },
        {
          timeSec: 7,
          stageName: 'CHORUS_CRESCENDO',
          propChanges: { musicNotes: true },
          suggestedEmotion: 'CELEBRATING',
          armGesture: 'ARM_CELEBRATE',
          gazeTarget: 'FORWARD',
          description: 'High energy chorus with melodic notes bouncing',
        },
        {
          timeSec: 15,
          stageName: 'SONG_OUTRO',
          propChanges: { musicNotes: false },
          suggestedEmotion: 'BIG_SMILE',
          armGesture: 'ARM_WAVE',
          gazeTarget: 'FORWARD',
          description: 'Bowing with a warm smile, lowering microphone',
        },
      ],
    },
    READING: {
      sceneType: 'ReadingScene',
      activity: 'READING',
      suggestedBaseEmotion: 'FOCUSED',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: true,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'OPEN_BOOK',
          propChanges: { book: true },
          suggestedEmotion: 'FOCUSED',
          armGesture: 'ARM_HOLD_BOOK',
          gazeTarget: 'LOOK_AT_BOOK',
          description: 'Opening book, looking down at top of page',
        },
        {
          timeSec: 3,
          stageName: 'SCANNING_LINES',
          propChanges: { book: true },
          suggestedEmotion: 'CONCENTRATED',
          gazeTarget: 'LOOK_AT_BOOK',
          description: 'Eyes scanning across text horizontally',
        },
        {
          timeSec: 9,
          stageName: 'PAGE_TURN',
          propChanges: { book: true },
          suggestedEmotion: 'CURIOUS',
          armGesture: 'ARM_POINT',
          gazeTarget: 'LOOK_AT_BOOK',
          description: 'Flipping to the next page with interest',
        },
        {
          timeSec: 15,
          stageName: 'READING_COMPLETE',
          propChanges: { book: true },
          suggestedEmotion: 'PROUD',
          armGesture: 'ARM_HOLD_BOOK',
          gazeTarget: 'FORWARD',
          description: 'Finished chapter, looking up with satisfaction',
        },
      ],
    },
    LISTENING_MUSIC: {
      sceneType: 'MusicScene',
      activity: 'LISTENING_MUSIC',
      suggestedBaseEmotion: 'PLAYFUL',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: true,
        spoonStirring: false,
        potCooking: false,
        speaker: true,
        thoughtCloud: false,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'AUDIO_START',
          propChanges: { speaker: true, musicNotes: true },
          suggestedEmotion: 'PLAYFUL',
          armGesture: 'ARM_HAPPY_MOVE',
          gazeTarget: 'FORWARD',
          description: 'Music track starts playing, rhythm bars pulsating',
        },
        {
          timeSec: 6,
          stageName: 'HEAD_BOPPING',
          propChanges: { speaker: true, musicNotes: true },
          suggestedEmotion: 'EXCITED',
          armGesture: 'ARM_HAPPY_MOVE',
          gazeTarget: 'FORWARD',
          description: 'Bouncing rhythmically to the beat',
        },
      ],
    },
    THINKING: {
      sceneType: 'ThinkingScene',
      activity: 'THINKING',
      suggestedBaseEmotion: 'THINKING_HARD',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: true,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'CONSIDERING',
          propChanges: { thoughtCloud: true },
          suggestedEmotion: 'THINKING_HARD',
          armGesture: 'ARM_THINK',
          gazeTarget: 'UP',
          description: 'Pondering query, eyes looking upward, thought particles forming',
        },
        {
          timeSec: 5,
          stageName: 'EUREKA',
          propChanges: { thoughtCloud: false },
          suggestedEmotion: 'AMAZED',
          armGesture: 'ARM_CELEBRATE',
          gazeTarget: 'FORWARD',
          description: 'Insight achieved! Thought resolved',
        },
      ],
    },
    SLEEPING: {
      sceneType: 'SleepingScene',
      activity: 'SLEEPING',
      suggestedBaseEmotion: 'SLEEP_DEEP',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        {
          timeSec: 0,
          stageName: 'FALLING_ASLEEP',
          suggestedEmotion: 'SLEEPY',
          armGesture: 'ARM_IDLE',
          description: 'Eyes gently closing into sleep arc',
        },
        {
          timeSec: 3,
          stageName: 'DEEP_DREAM',
          suggestedEmotion: 'SLEEP_DEEP',
          description: 'Slow harmonic breathing with floating ZZZ',
        },
      ],
    },
    TALKING: {
      sceneType: 'IdleScene',
      activity: 'TALKING',
      suggestedBaseEmotion: 'SPEAKING',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        { timeSec: 0, stageName: 'CONVERSING', description: 'Conversational interaction' },
      ],
    },
    PLAYING: {
      sceneType: 'IdleScene',
      activity: 'PLAYING',
      suggestedBaseEmotion: 'PLAYFUL',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        { timeSec: 0, stageName: 'PLAYING_GAME', description: 'Active companion game session' },
      ],
    },
    RESTING: {
      sceneType: 'IdleScene',
      activity: 'RESTING',
      suggestedBaseEmotion: 'NEUTRAL',
      defaultProps: {
        flame: false,
        steam: false,
        microphone: false,
        book: false,
        musicNotes: false,
        spoonStirring: false,
        potCooking: false,
        speaker: false,
        thoughtCloud: false,
      },
      timeline: [
        { timeSec: 0, stageName: 'IDLE_CALM', description: 'Resting on desktop' },
      ],
    },
  };

  /**
   * Set active activity and transition scene without losing underlying emotion
   */
  public setActivity(activity: RobotActivity, priority: ActivityPriority = 'ACTIVE_ACTIVITY') {
    this.currentActivity = activity;
    this.currentPriority = priority;

    const def = ActivitySceneManager.SCENES[activity] || ActivitySceneManager.SCENES['IDLE'];
    this.currentScene = def.sceneType;

    // Initialize props from default scene
    this.activeProps = { ...def.defaultProps, ...this.manualProps };

    // Reset timeline
    this.timelineStartTime = Date.now();
    this.currentStageIndex = 0;
    this.currentStageName = def.timeline[0]?.stageName || 'START';

    // Log the transition
    this.logEvent(
      'ACTIVITY',
      `Activity = ${activity} (${def.sceneType}) [Priority: ${priority}]`
    );

    // Apply suggested emotion unless user or speaking layer takes precedence
    if (def.suggestedBaseEmotion && !expressionManager.isTemporaryActive()) {
      expressionManager.setBaseEmotion(def.suggestedBaseEmotion);
    }

    // Apply arm gesture if present
    if (def.timeline[0]?.armGesture) {
      armController.triggerGesture(def.timeline[0].armGesture);
    }

    this.notifyScene();
  }

  /**
   * Progress timeline loop (called every animation frame or timer tick)
   */
  public updateTimeline(now: number = Date.now()): {
    stageName: string;
    elapsedSec: number;
    gazeTarget?: string;
  } {
    const def = ActivitySceneManager.SCENES[this.currentActivity];
    if (!def || def.timeline.length === 0) {
      return { stageName: 'IDLE', elapsedSec: 0 };
    }

    const elapsedSec = (now - this.timelineStartTime) / 1000;
    const currentStep = def.timeline.slice().reverse().find((step) => elapsedSec >= step.timeSec) || def.timeline[0];

    if (currentStep && currentStep.stageName !== this.currentStageName) {
      this.currentStageName = currentStep.stageName;

      // Apply prop changes
      if (currentStep.propChanges) {
        this.activeProps = {
          ...this.activeProps,
          ...currentStep.propChanges,
        };
      }

      // Log prop / step changes
      this.logEvent('SCENE', `Stage -> ${currentStep.stageName}: ${currentStep.description}`);

      if (currentStep.propChanges?.flame !== undefined) {
        this.logEvent('PROP', `Flame = ${currentStep.propChanges.flame ? 'ON' : 'OFF'}`);
      }
      if (currentStep.propChanges?.steam !== undefined) {
        this.logEvent('PROP', `Steam = ${currentStep.propChanges.steam ? 'ON' : 'OFF'}`);
      }

      // Apply emotion suggestion
      if (currentStep.suggestedEmotion && !expressionManager.isTemporaryActive()) {
        expressionManager.setBaseEmotion(currentStep.suggestedEmotion);
      }

      // Apply arm gesture
      if (currentStep.armGesture) {
        armController.triggerGesture(currentStep.armGesture);
        this.logEvent('ARM', `Arm gesture -> ${currentStep.armGesture}`);
      }

      this.notifyScene();
    }

    return {
      stageName: this.currentStageName,
      elapsedSec: Math.floor(elapsedSec),
      gazeTarget: currentStep?.gazeTarget,
    };
  }

  /**
   * Manually toggle a prop (e.g. from simulation UI controls)
   */
  public setProp(prop: keyof ScenePropsState, value: boolean) {
    this.manualProps[prop] = value;
    this.activeProps[prop] = value;
    this.logEvent('PROP', `Manual toggle: ${prop} = ${value ? 'ON' : 'OFF'}`);
    this.notifyScene();
  }

  public getProps(): ScenePropsState {
    return { ...this.activeProps };
  }

  public getCurrentScene(): SceneType {
    return this.currentScene;
  }

  public getCurrentActivity(): RobotActivity {
    return this.currentActivity;
  }

  public getCurrentPriority(): ActivityPriority {
    return this.currentPriority;
  }

  public getCurrentStage(): string {
    return this.currentStageName;
  }

  public getTimelineElapsed(): number {
    return Math.floor((Date.now() - this.timelineStartTime) / 1000);
  }

  /**
   * Append to the animation event log
   */
  public logEvent(category: AnimationEventLogEntry['category'], message: string) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const entry: AnimationEventLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      category,
      message,
    };

    this.eventLog = [entry, ...this.eventLog].slice(0, 60);
    for (const cb of this.logListeners) {
      cb(this.eventLog);
    }
  }

  public getEventLog(): AnimationEventLogEntry[] {
    return this.eventLog;
  }

  public subscribeLog(cb: (entries: AnimationEventLogEntry[]) => void): () => void {
    this.logListeners.push(cb);
    cb(this.eventLog);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== cb);
    };
  }

  public subscribeScene(cb: (scene: SceneType, props: ScenePropsState) => void): () => void {
    this.sceneListeners.push(cb);
    cb(this.currentScene, this.activeProps);
    return () => {
      this.sceneListeners = this.sceneListeners.filter((l) => l !== cb);
    };
  }

  private notifyScene() {
    for (const cb of this.sceneListeners) {
      cb(this.currentScene, this.activeProps);
    }
  }
}

export const activitySceneManager = new ActivitySceneManager();
