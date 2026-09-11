/**
 * ActivitySelector.ts
 * Dynamic, personality-driven, time-aware autonomous activity selection engine.
 * Never uses fixed mechanical loops; uses weighted probability with controlled randomness.
 */

import { AutonomousCandidate, AutonomousLifeConfig, TaraActivity, TaraMood } from '../../types';
import { gameManager } from '../GameManager';
import { musicManager } from '../MusicManager';
import { personalityEngine } from '../PersonalityEngine';
import { presenceManager } from '../PresenceManager';
import { timeManager } from '../TimeManager';
import { voiceManager } from '../VoiceManager';
import { activityCooldownManager } from './ActivityCooldownManager';
import { activityHistory } from './ActivityHistory';

export class ActivitySelector {
  /**
   * Evaluates all candidates and returns the best chosen activity
   * along with the list of scored candidates for debugging.
   */
  public selectActivity(
    config: AutonomousLifeConfig,
    timeSinceInteractionSec: number
  ): { selected: AutonomousCandidate; allCandidates: AutonomousCandidate[] } {
    const candidates: AutonomousCandidate[] = [];

    // Gather contextual states
    const mood = personalityEngine.getMood();
    const traits = personalityEngine.getTraits();
    const timePeriod = this.getDhakaTimePeriod();
    const isSleepingHour = this.isWithinSleepSchedule(config.sleepStart, config.sleepEnd);
    const presence = presenceManager.getState();
    const lastActivity = activityHistory.getLastActivity()?.activity ?? 'IDLE';

    // List of candidate activities to evaluate
    const pool: { activity: TaraActivity; allowed: boolean; baseWeight: number }[] = [
      { activity: 'READING', allowed: config.allowReading, baseWeight: 60 },
      { activity: 'MUSIC', allowed: config.allowMusic, baseWeight: 50 },
      { activity: 'SINGING', allowed: config.allowSinging, baseWeight: 45 },
      { activity: 'COOKING', allowed: config.allowCooking, baseWeight: 40 },
      { activity: 'THINKING', allowed: config.allowThinking, baseWeight: 55 },
      { activity: 'GAMING', allowed: config.allowGames, baseWeight: 45 },
      { activity: 'OBSERVING', allowed: config.allowObserving, baseWeight: 65 },
      { activity: 'RELAXING', allowed: config.allowRelaxing, baseWeight: 50 },
      { activity: 'DANCING', allowed: config.allowDancing, baseWeight: 35 },
      { activity: 'LEARNING', allowed: config.allowLearning, baseWeight: 55 },
      { activity: 'CHECKING_TIME', allowed: true, baseWeight: 40 },
      { activity: 'GREETING', allowed: true, baseWeight: 30 },
      { activity: 'SLEEPING', allowed: true, baseWeight: isSleepingHour ? 90 : 10 },
    ];

    for (const item of pool) {
      if (!item.allowed) continue;

      // 1. Check cooldown
      if (activityCooldownManager.isOnCooldown(item.activity)) {
        continue;
      }

      // 2. Penalize direct repetition of previous activity
      let score = item.baseWeight;
      const reasons: string[] = [];

      if (item.activity === lastActivity) {
        score -= 40;
        reasons.push('recently completed');
      }

      // 3. Sleep schedule rules: No loud activities during sleep hours
      if (isSleepingHour) {
        if (item.activity === 'SLEEPING') {
          score += 60;
          reasons.push('sleep schedule active');
        } else if (item.activity === 'RELAXING' || item.activity === 'THINKING') {
          score += 20;
          reasons.push('quiet night activity');
        } else if (['SINGING', 'DANCING', 'COOKING', 'GAMING'].includes(item.activity)) {
          // Severely penalize loud activities during sleep hours
          score -= 100;
          reasons.push('too energetic for bedtime');
        }
      }

      // 4. Time of day modifiers (Asia/Dhaka)
      switch (timePeriod) {
        case 'morning':
          if (['GREETING', 'CHECKING_TIME', 'READING', 'LEARNING'].includes(item.activity)) {
            score += 25;
            reasons.push('morning routine');
          }
          break;
        case 'afternoon':
          if (['READING', 'COOKING', 'LEARNING', 'MUSIC', 'GAMING'].includes(item.activity)) {
            score += 20;
            reasons.push('afternoon focus');
          }
          break;
        case 'evening':
          if (['MUSIC', 'SINGING', 'GAMING', 'RELAXING', 'DANCING'].includes(item.activity)) {
            score += 25;
            reasons.push('evening recreation');
          }
          break;
        case 'night':
          if (['SLEEPING', 'RELAXING', 'THINKING', 'READING'].includes(item.activity)) {
            score += 30;
            reasons.push('cozy night winding down');
          } else if (['SINGING', 'DANCING', 'COOKING'].includes(item.activity)) {
            score -= 30;
          }
          break;
      }

      // 5. Personality state influence
      this.applyPersonalityModifiers(item.activity, mood, traits, reasons, (delta) => {
        score += delta;
      });

      // 6. Presence influence
      if (presence.detected) {
        if (item.activity === 'GREETING' && timeSinceInteractionSec > 120) {
          score += 35;
          reasons.push('user present nearby');
        } else if (item.activity === 'GAMING' && traits.playful > 70) {
          score += 20;
          reasons.push('suggest game to user');
        }
      } else {
        // When nobody is present, TARA enjoys quiet autonomous life
        if (['READING', 'THINKING', 'LEARNING', 'RELAXING', 'OBSERVING'].includes(item.activity)) {
          score += 15;
          reasons.push('quiet solitary pursuit');
        }
      }

      // 7. Prevent starting music/game if external system is not ready or busy
      if (item.activity === 'MUSIC' && musicManager.isPlaying()) {
        score -= 50; // Already playing
      }
      if (item.activity === 'GAMING' && gameManager.getActiveGame() !== 'NONE') {
        score -= 50; // Already in game
      }
      if (voiceManager.isSpeaking() && item.activity !== 'OBSERVING') {
        score -= 30; // Wait for voice to finish
      }

      // 8. Controlled randomness (adds ±15 points so selection feels organic)
      const jitter = (Math.random() - 0.5) * 30;
      score += jitter;

      if (score > 10) {
        const recommendedDuration = this.calculateRecommendedDuration(item.activity, config);
        candidates.push({
          activity: item.activity,
          score: Math.round(score),
          reason: reasons.length > 0 ? reasons.join(', ') : 'organic interest',
          recommendedDuration,
        });
      }
    }

    // Sort descending by score
    candidates.sort((a, b) => b.score - a.score);

    // If no candidate scored high enough, fallback to OBSERVING or RELAXING
    const fallback: AutonomousCandidate = {
      activity: 'OBSERVING',
      score: 30,
      reason: 'gentle environmental awareness',
      recommendedDuration: 20,
    };

    const selected = candidates.length > 0 ? candidates[0] : fallback;
    return { selected, allCandidates: candidates };
  }

  /**
   * Applies personality traits & mood to activity scores.
   */
  private applyPersonalityModifiers(
    activity: TaraActivity,
    mood: TaraMood,
    traits: ReturnType<typeof personalityEngine.getTraits>,
    reasons: string[],
    adjust: (delta: number) => void
  ) {
    switch (mood) {
      case 'curious':
        if (['READING', 'LEARNING', 'OBSERVING', 'THINKING'].includes(activity)) {
          adjust(30);
          reasons.push('curious mood match');
        }
        break;
      case 'playful':
        if (['GAMING', 'SINGING', 'DANCING'].includes(activity)) {
          adjust(35);
          reasons.push('playful mood match');
        }
        break;
      case 'thoughtful':
        if (['THINKING', 'READING', 'RELAXING'].includes(activity)) {
          adjust(30);
          reasons.push('thoughtful mood match');
        }
        break;
      case 'shy':
        if (['OBSERVING', 'RELAXING', 'READING'].includes(activity)) {
          adjust(25);
          reasons.push('quiet shy state');
        } else if (['SINGING', 'DANCING'].includes(activity)) {
          adjust(-20);
        }
        break;
      case 'excited':
        if (['MUSIC', 'SINGING', 'DANCING', 'GAMING'].includes(activity)) {
          adjust(35);
          reasons.push('high excitement');
        }
        break;
      case 'sleepy':
        if (['SLEEPING', 'RELAXING', 'READING'].includes(activity)) {
          adjust(40);
          reasons.push('drowsy rest state');
        } else {
          adjust(-30);
        }
        break;
      case 'focused':
        if (['READING', 'LEARNING', 'COOKING', 'THINKING'].includes(activity)) {
          adjust(30);
          reasons.push('focused determination');
        }
        break;
      case 'cheerful':
      default:
        if (['MUSIC', 'COOKING', 'GREETING'].includes(activity)) {
          adjust(15);
        }
        break;
    }

    // Trait-specific boosts
    if (traits.curious > 80 && ['LEARNING', 'OBSERVING', 'READING'].includes(activity)) {
      adjust(10);
    }
    if (traits.playful > 80 && ['GAMING', 'DANCING'].includes(activity)) {
      adjust(10);
    }
    if (traits.slightlyShy > 70 && activity === 'OBSERVING') {
      adjust(10);
    }
  }

  /**
   * Calculates a natural duration with controlled randomness.
   */
  private calculateRecommendedDuration(activity: TaraActivity, config: AutonomousLifeConfig): number {
    const min = Math.max(15, config.minActivityDuration);
    const max = Math.max(min + 10, config.maxActivityDuration);
    const span = max - min;

    // Certain activities naturally have standard durations
    switch (activity) {
      case 'CHECKING_TIME':
        return 12; // Brief check
      case 'GREETING':
        return 15;
      case 'THINKING':
        return Math.floor(min + Math.random() * (span * 0.4));
      case 'OBSERVING':
        return Math.floor(min * 0.8 + Math.random() * 20);
      case 'COOKING':
        return Math.floor(min + Math.random() * span);
      case 'SINGING':
      case 'MUSIC':
        return Math.floor(min + Math.random() * span);
      case 'SLEEPING':
        return Math.floor(max + Math.random() * 120); // Sleep can last longer
      default:
        return Math.floor(min + Math.random() * span);
    }
  }

  /**
   * Checks if current time is within sleep schedule (e.g. 23:00 to 07:00 in Asia/Dhaka).
   */
  public isWithinSleepSchedule(startStr: string, endStr: string): boolean {
    const dhakaDate = this.getDhakaDate();
    const curHour = dhakaDate.getHours();
    const curMinute = dhakaDate.getMinutes();
    const curMinutes = curHour * 60 + curMinute;

    const [sH, sM] = (startStr || '23:00').split(':').map(Number);
    const [eH, eM] = (endStr || '07:00').split(':').map(Number);
    const startMinutes = (sH || 23) * 60 + (sM || 0);
    const endMinutes = (eH || 7) * 60 + (eM || 0);

    if (startMinutes > endMinutes) {
      // Crosses midnight (e.g. 23:00 to 07:00)
      return curMinutes >= startMinutes || curMinutes < endMinutes;
    } else {
      return curMinutes >= startMinutes && curMinutes < endMinutes;
    }
  }

  /**
   * Gets current time normalized to Asia/Dhaka (UTC+6).
   */
  public getDhakaDate(): Date {
    const now = timeManager.getNow();
    // Format to Asia/Dhaka timezone
    try {
      const dhakaString = now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' });
      return new Date(dhakaString);
    } catch {
      // Fallback: UTC + 6 hours
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      return new Date(utc + 3600000 * 6);
    }
  }

  /**
   * Gets current period in Asia/Dhaka.
   */
  public getDhakaTimePeriod(): 'morning' | 'afternoon' | 'evening' | 'night' {
    const hour = this.getDhakaDate().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
  }
}

export const activitySelector = new ActivitySelector();
