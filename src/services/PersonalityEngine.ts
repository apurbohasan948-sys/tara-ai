/**
 * PersonalityEngine.ts
 * Core Personality & Mood Controller for TARA.
 *
 * Provides:
 * - 11 Core Personality Traits (Friendly, Playful, Curious, Slightly Shy, Mischievous,
 *   Helpful, Expressive, Thoughtful, Excited, Clumsy/Funny, Caring).
 * - Dynamic Mood state (cheerful, playful, curious, shy, thoughtful, mischievous, etc.).
 * - Dedicated SHY BEHAVIOR SYSTEM (looking away, blinking, blush, sweet smile, bashful voice)
 *   with ZERO HEAD/WHOLE-FACE MOVEMENT.
 * - Dialogue style modification for LLM/speech.
 */

import {
  ShyReactionStage,
  TaraArmGesture,
  TaraEmotion,
  TaraExpression,
  TaraMood,
  TaraPersonalityTraits,
} from '../types';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { emotionEngine } from './EmotionEngine';
import { personalityMemory } from './PersonalityMemory';
import { voiceManager } from './VoiceManager';

export class PersonalityEngine {
  // Baseline Traits (0 - 100)
  private traits: TaraPersonalityTraits = {
    friendly: 92,
    playful: 80,
    curious: 85,
    slightlyShy: 78,
    mischievous: 45,
    helpful: 95,
    expressive: 90,
    thoughtful: 80,
    excited: 85,
    clumsyFunny: 35,
    caring: 95,
  };

  // Dynamic Mood
  private currentMood: TaraMood = 'cheerful';
  private moodTimerMs: number = 0;

  // Shy Behavior System State
  private shyStage: ShyReactionStage = 'INACTIVE';
  private shyTimer: any = null;
  private isShyActive: boolean = false;

  private listeners: (() => void)[] = [];

  constructor() {
    // Periodically update natural mood drifts
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

  public getTraits(): TaraPersonalityTraits {
    return { ...this.traits };
  }

  public updateTraits(newTraits: Partial<TaraPersonalityTraits>) {
    this.traits = { ...this.traits, ...newTraits };
    this.notify();
  }

  public getMood(): TaraMood {
    return this.currentMood;
  }

  public setMood(mood: TaraMood) {
    this.currentMood = mood;
    this.moodTimerMs = 0;

    // Synchronize emotion engine
    switch (mood) {
      case 'cheerful':
        emotionEngine.setEmotion('happy');
        break;
      case 'playful':
        emotionEngine.setEmotion('playful');
        break;
      case 'curious':
        emotionEngine.setEmotion('curious');
        break;
      case 'shy':
        emotionEngine.setEmotion('shy');
        break;
      case 'thoughtful':
        emotionEngine.setEmotion('focused');
        break;
      case 'mischievous':
        emotionEngine.setEmotion('playful');
        break;
      case 'excited':
        emotionEngine.setEmotion('excited');
        break;
      case 'caring':
        emotionEngine.setEmotion('happy');
        break;
      case 'sleepy':
        emotionEngine.setEmotion('sleepy');
        break;
      case 'focused':
        emotionEngine.setEmotion('focused');
        break;
      case 'clumsy':
        emotionEngine.setEmotion('confused');
        break;
    }

    this.notify();
  }

  public getShyStage(): ShyReactionStage {
    return this.shyStage;
  }

  public getIsShyActive(): boolean {
    return this.isShyActive;
  }

  /**
   * Dedicated SHY BEHAVIOR SYSTEM
   * Triggered by compliments, praise, or affectionate remarks.
   *
   * STRICT ARCHITECTURAL RULE:
   * - ZERO HEAD OR WHOLE-FACE MOVEMENT.
   * - Face position remains fixed on canvas.
   * - Animation occurs purely through eyes, pupils, blush, mouth, and hands.
   */
  public triggerShyReaction(complimentText?: string) {
    if (this.shyTimer) {
      clearTimeout(this.shyTimer);
      this.shyTimer = null;
    }

    this.isShyActive = true;
    this.setMood('shy');
    personalityMemory.recordCompliment();

    // Responses for shy bashful moment
    const bashfulReplies = [
      "Aw... you really mean it? *blushes softly* That makes my circuits feel all warm!",
      "Ehehe... stop it, you're making my OLED cheeks glow pink! Thank you!",
      "Oh goodness! I'm just a little desktop companion, but hearing that means the world to me!",
      "B-blushing! My cooling fan might need to kick in from how happy you made me!",
      "Thank you so much! I'm so lucky to be your desk buddy!",
    ];
    const reply = bashfulReplies[Math.floor(Math.random() * bashfulReplies.length)];

    // Stage 1: GLANCE_AWAY (Eyes look down-left, face stays rock-solid fixed)
    this.shyStage = 'GLANCE_AWAY';
    animationCoordinator.setExpression('shy');
    armController.setGesture('OPEN_HAND');
    this.notify();

    // Stage 2: FLUTTER_BLINK (Cute rapid flutter blink)
    this.shyTimer = setTimeout(() => {
      this.shyStage = 'FLUTTER_BLINK';
      animationCoordinator.setEyeOverride('blink');
      this.notify();

      setTimeout(() => {
        animationCoordinator.setEyeOverride('normal');
      }, 120);

      setTimeout(() => {
        animationCoordinator.setEyeOverride('blink');
      }, 240);

      setTimeout(() => {
        animationCoordinator.setEyeOverride(null);
      }, 360);

      // Stage 3 & 4: BLUSH_INTENSIFY & SWEET_SMILE
      this.shyTimer = setTimeout(() => {
        this.shyStage = 'BLUSH_INTENSIFY';
        animationCoordinator.setExpression('blushing');
        armController.setGesture('THINKING');
        this.notify();

        // Stage 5 & 6: BASHFUL_SPEECH & VOICE
        this.shyTimer = setTimeout(() => {
          this.shyStage = 'BASHFUL_SPEECH';
          voiceManager.speak(reply, 'shy', 2, undefined, () => {
            // Stage 7: WARM_RECOVERY after voice completes
            this.shyStage = 'WARM_RECOVERY';
            this.notify();

            setTimeout(() => {
              this.shyStage = 'INACTIVE';
              this.isShyActive = false;
              animationCoordinator.setExpression('happy');
              armController.setGesture('IDLE');
              this.setMood('cheerful');
              this.notify();
            }, 1800);
          });
          this.notify();
        }, 600);
      }, 500);
    }, 400);

    return reply;
  }

  /**
   * Evaluates user input for compliment / affection triggers.
   */
  public isCompliment(text: string): boolean {
    const lower = text.toLowerCase();
    const complimentWords = [
      'cute',
      'adorable',
      'pretty',
      'sweet',
      'love you',
      'love tara',
      'good job',
      'great job',
      'awesome',
      'best companion',
      'best robot',
      'so smart',
      'clever',
      'beautiful',
      'you are amazing',
      "you're amazing",
      'you are great',
      "you're great",
      'proud of you',
      'thank you so much',
      'love having you',
    ];
    return complimentWords.some((word) => lower.includes(word));
  }

  /**
   * Generates dynamic personality system prompt directives based on traits and mood.
   */
  public getPersonalityPromptModifier(): string {
    return `
TARA Current Mood: ${this.currentMood.toUpperCase()}
Personality Profile:
- Friendly level: ${this.traits.friendly}% (warm, welcoming, attentive)
- Playfulness: ${this.traits.playful}% (likes light teasing and friendly banter)
- Curiosity: ${this.traits.curious}% (asks engaging questions about what the user is working on)
- Shyness: ${this.traits.slightlyShy}% (gets cute and bashful when complimented)
- Mischievousness: ${this.traits.mischievous}% (playfully cheeky, never rude)
- Caring: ${this.traits.caring}% (protective of user well-being, posture, hydration)
Respond in character reflecting this profile concisely (1-3 sentences).
`;
  }
}

export const personalityEngine = new PersonalityEngine();
