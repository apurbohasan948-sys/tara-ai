/**
 * ActivitySceneManager.ts
 * Manages procedural activity state machines for:
 * 1. Singing (Microphone appear, holding mic, singing mouth, music notes)
 * 2. Cooking (Stove on, flame variation, pot appear, steam particles, stirring arm)
 * 3. Reading (Book held by hands, page turn, focused down eyes)
 * 4. Music (Headphones, equalizer frequency bars, floating notes)
 * 5. Sleeping (Closed calm eyes, ZZZ floating up, breathing cycle)
 */

import {
  CookingSceneState,
  MusicSceneState,
  ReadingSceneState,
  SingingSceneState,
  SleepingSceneState,
  TaraActivity,
} from '../types';

export class ActivitySceneManager {
  private currentActivity: TaraActivity = 'IDLE';

  // Cooking state
  private cookingState: CookingSceneState = {
    stage: 'COOKING_START',
    flameFrame: 0,
    steamParticles: [],
    stirAngle: 0,
    burnerHeat: 0,
  };

  // Singing state
  private singingState: SingingSceneState = {
    stage: 'IDLE',
    micHeight: 0,
    notes: [],
    rhythmBeat: 0,
    micWobble: 0,
  };

  // Reading state
  private readingState: ReadingSceneState = {
    bookOpenAngle: 0,
    pageFlip: 0,
    readingLine: 0,
  };

  // Music state
  private musicState: MusicSceneState = {
    bars: [12, 24, 18, 30, 22, 16, 28, 20],
    notes: [],
    headphonePulse: 0,
  };

  // Sleeping state
  private sleepingState: SleepingSceneState = {
    zzzParticles: [],
    breathCycle: 0,
  };

  private activityTimeMs: number = 0;

  public setActivity(activity: TaraActivity) {
    if (this.currentActivity === activity) return;
    this.currentActivity = activity;
    this.activityTimeMs = 0;

    if (activity === 'COOKING') {
      this.cookingState = {
        stage: 'COOKING_START',
        flameFrame: 0,
        steamParticles: [],
        stirAngle: 0,
        burnerHeat: 0,
      };
    } else if (activity === 'SINGING') {
      this.singingState = {
        stage: 'PREPARE_SINGING',
        micHeight: 0,
        notes: [],
        rhythmBeat: 0,
        micWobble: 0,
      };
    } else if (activity === 'READING') {
      this.readingState = {
        bookOpenAngle: 1,
        pageFlip: 0,
        readingLine: 0,
      };
    } else if (activity === 'SLEEPING') {
      this.sleepingState = {
        zzzParticles: [
          { id: 1, x: 88, y: 32, scale: 0.8, opacity: 0.8 },
          { id: 2, x: 96, y: 22, scale: 1.1, opacity: 0.6 },
        ],
        breathCycle: 0,
      };
    }
  }

  public getActivity(): TaraActivity {
    return this.currentActivity;
  }

  public getCookingState(): CookingSceneState {
    return this.cookingState;
  }

  public getSingingState(): SingingSceneState {
    return this.singingState;
  }

  public getReadingState(): ReadingSceneState {
    return this.readingState;
  }

  public getMusicState(): MusicSceneState {
    return this.musicState;
  }

  public getSleepingState(): SleepingSceneState {
    return this.sleepingState;
  }

  /**
   * Update activity procedural animations (non-blocking, dt in ms)
   */
  public update(dtMs: number) {
    this.activityTimeMs += dtMs;
    const tSec = this.activityTimeMs / 1000;

    switch (this.currentActivity) {
      case 'COOKING':
        this.updateCooking(dtMs, tSec);
        break;
      case 'SINGING':
        this.updateSinging(dtMs, tSec);
        break;
      case 'READING':
        this.updateReading(dtMs, tSec);
        break;
      case 'MUSIC':
        this.updateMusic(dtMs, tSec);
        break;
      case 'SLEEPING':
        this.updateSleeping(dtMs, tSec);
        break;
      default:
        break;
    }
  }

  private updateCooking(dtMs: number, tSec: number) {
    // Cooking timeline state machine
    if (tSec < 0.8) {
      this.cookingState.stage = 'STOVE_ON';
      this.cookingState.burnerHeat = Math.min(1, tSec / 0.8);
    } else if (tSec < 2.0) {
      this.cookingState.stage = 'FLAME_ON';
      this.cookingState.burnerHeat = 1.0;
    } else if (tSec < 3.2) {
      this.cookingState.stage = 'POT_APPEAR';
    } else if (tSec < 5.0) {
      this.cookingState.stage = 'STEAM_START';
    } else if (tSec < 9.0) {
      this.cookingState.stage = 'STIR';
    } else if (tSec < 12.0) {
      this.cookingState.stage = 'CHECK_FOOD';
    } else if (tSec < 15.0) {
      this.cookingState.stage = 'STEAM_CONTINUE';
    } else if (tSec < 18.0) {
      this.cookingState.stage = 'HAPPY_FOCUSED';
    } else {
      this.cookingState.stage = 'COOKING_COMPLETE';
    }

    // Flame variation (2-3 frame procedural flicker)
    this.cookingState.flameFrame = Math.floor((tSec * 6) % 3);

    // Stirring rotation
    this.cookingState.stirAngle = (tSec * 4) % (Math.PI * 2);

    // Steam particles update
    if (['STEAM_START', 'STIR', 'CHECK_FOOD', 'STEAM_CONTINUE', 'HAPPY_FOCUSED'].includes(this.cookingState.stage)) {
      if (Math.random() < 0.25) {
        this.cookingState.steamParticles.push({
          id: Math.random(),
          x: 64 + (Math.random() * 16 - 8),
          y: 44,
          opacity: 0.9,
          size: 2 + Math.random() * 3,
        });
      }
    }

    // Move steam upward and fade
    this.cookingState.steamParticles.forEach((p) => {
      p.y -= (dtMs / 1000) * 14;
      p.x += Math.sin(p.y * 0.1) * 0.4;
      p.opacity -= (dtMs / 1000) * 0.4;
    });
    this.cookingState.steamParticles = this.cookingState.steamParticles.filter((p) => p.opacity > 0);
  }

  private updateSinging(dtMs: number, tSec: number) {
    // Stage transition
    if (tSec < 0.6) {
      this.singingState.stage = 'PREPARE_SINGING';
      this.singingState.micHeight = tSec / 0.6;
    } else if (tSec < 1.2) {
      this.singingState.stage = 'MICROPHONE_APPEAR';
      this.singingState.micHeight = 1.0;
    } else {
      this.singingState.stage = 'SINGING';
      this.singingState.micHeight = 1.0;
    }

    // Microphone subtle hand rhythm sway
    this.singingState.rhythmBeat = Math.sin(tSec * 4);
    this.singingState.micWobble = Math.sin(tSec * 3) * 2;

    // Music note particles
    if (this.singingState.stage === 'SINGING') {
      if (Math.random() < 0.08) {
        const symbols = ['♪', '♫', '♬', '♩'];
        this.singingState.notes.push({
          id: Math.random(),
          x: 48 + Math.random() * 32,
          y: 38,
          opacity: 1.0,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
        });
      }
    }

    this.singingState.notes.forEach((n) => {
      n.y -= (dtMs / 1000) * 16;
      n.x += Math.sin(n.y * 0.2) * 0.8;
      n.opacity -= (dtMs / 1000) * 0.5;
    });
    this.singingState.notes = this.singingState.notes.filter((n) => n.opacity > 0);
  }

  private updateReading(dtMs: number, tSec: number) {
    this.readingState.bookOpenAngle = 1.0;
    // Periodic page flip every 4.5 seconds
    const cycle = tSec % 4.5;
    if (cycle > 3.8) {
      this.readingState.pageFlip = (cycle - 3.8) / 0.7;
    } else {
      this.readingState.pageFlip = 0;
    }
    this.readingState.readingLine = Math.floor((tSec * 1.5) % 4);
  }

  private updateMusic(dtMs: number, tSec: number) {
    // Equalizer bars simulation
    this.musicState.bars = this.musicState.bars.map((_, i) => {
      const freq = (i + 1) * 3;
      return Math.floor(6 + Math.abs(Math.sin(tSec * freq)) * 18);
    });

    this.musicState.headphonePulse = (Math.sin(tSec * 4) + 1) * 0.5;

    // Floating notes
    if (Math.random() < 0.08) {
      this.musicState.notes.push({
        id: Math.random(),
        x: 30 + Math.random() * 68,
        y: 40,
        opacity: 0.9,
      });
    }

    this.musicState.notes.forEach((n) => {
      n.y -= (dtMs / 1000) * 12;
      n.opacity -= (dtMs / 1000) * 0.4;
    });
    this.musicState.notes = this.musicState.notes.filter((n) => n.opacity > 0);
  }

  private updateSleeping(dtMs: number, tSec: number) {
    this.sleepingState.breathCycle = (Math.sin(tSec * 1.2) + 1) * 0.5;

    // Spawn floating ZZZ particles
    if (this.sleepingState.zzzParticles.length < 3 && Math.random() < 0.04) {
      this.sleepingState.zzzParticles.push({
        id: Math.random(),
        x: 82 + Math.random() * 8,
        y: 36,
        scale: 0.6,
        opacity: 0.9,
      });
    }

    this.sleepingState.zzzParticles.forEach((z) => {
      z.y -= (dtMs / 1000) * 8;
      z.x += (dtMs / 1000) * 3;
      z.scale += (dtMs / 1000) * 0.15;
      z.opacity -= (dtMs / 1000) * 0.25;
    });
    this.sleepingState.zzzParticles = this.sleepingState.zzzParticles.filter((z) => z.opacity > 0);
  }
}

export const activitySceneManager = new ActivitySceneManager();
