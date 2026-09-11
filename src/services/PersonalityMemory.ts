/**
 * PersonalityMemory.ts
 * Manages non-sensitive interaction patterns, preferences, and companion relationship data.
 *
 * STRICT SECURITY MANDATE:
 * - NEVER stores passwords, API keys, bearer tokens, PINs, or confidential secrets.
 * - All inputs pass through an anti-secret sanitization filter before persistence.
 */

import { PersonalityMemoryItem } from '../types';
import { securityLogger } from './SecurityLogger';

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/i,                          // Google API Keys
  /sk-[a-zA-Z0-9]{20,}/i,                           // OpenAI / secret keys
  /bearer\s+[a-zA-Z0-9._~+/-]+=*/i,                 // Bearer tokens
  /password\s*[:=]\s*\S+/i,                         // Password patterns
  /pin\s*[:=]\s*\d{4,8}/i,                          // PINs
  /api[_-]?key\s*[:=]\s*\S+/i,                      // API key assignments
  /token\s*[:=]\s*\S+/i,                            // Auth tokens
  /[0-9a-f]{32,64}/i,                               // Hex secrets/hashes
];

export class PersonalityMemory {
  private items: Map<string, PersonalityMemoryItem> = new Map();
  private complimentCount: number = 0;
  private interactionCount: number = 0;
  private storageKey: string = 'tara_personality_memory_v1';
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
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

  /**
   * Sanitizes text to strip out any passwords, secrets, or API tokens.
   */
  public sanitize(text: string): { sanitizedText: string; hadSecrets: boolean } {
    let hadSecrets = false;
    let result = text;

    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(result)) {
        hadSecrets = true;
        result = result.replace(pattern, '[REDACTED_SECRET]');
        securityLogger.log(
          'WARN',
          'MEMORY_SECRET_BLOCKED',
          'Sensitive credential pattern detected and blocked from personality memory.'
        );
      }
    }

    return { sanitizedText: result, hadSecrets };
  }

  public rememberFact(
    category: PersonalityMemoryItem['category'],
    key: string,
    value: string,
    confidence: number = 1.0
  ): boolean {
    const keySanitized = this.sanitize(key);
    const valueSanitized = this.sanitize(value);

    // If key or value contained raw secrets, do not store
    if (keySanitized.hadSecrets || valueSanitized.hadSecrets) {
      return false;
    }

    const item: PersonalityMemoryItem = {
      id: `${category}-${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      category,
      key: keySanitized.sanitizedText.trim(),
      value: valueSanitized.sanitizedText.trim(),
      confidence,
      lastUpdatedMs: Date.now(),
      sanitized: true,
    };

    this.items.set(item.id, item);
    this.saveToStorage();
    this.notify();
    return true;
  }

  public getFact(category: PersonalityMemoryItem['category'], key: string): string | null {
    const id = `${category}-${key.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const item = this.items.get(id);
    return item ? item.value : null;
  }

  public getAllItems(): PersonalityMemoryItem[] {
    return Array.from(this.items.values()).sort((a, b) => b.lastUpdatedMs - a.lastUpdatedMs);
  }

  public recordCompliment() {
    this.complimentCount += 1;
    this.rememberFact('compliment', 'compliment_history', `${this.complimentCount} compliments received`);
    this.notify();
  }

  public recordInteraction() {
    this.interactionCount += 1;
    this.saveToStorage();
    this.notify();
  }

  public getComplimentCount(): number {
    return this.complimentCount;
  }

  public getInteractionCount(): number {
    return this.interactionCount;
  }

  public clearAllMemories() {
    this.items.clear();
    this.complimentCount = 0;
    this.interactionCount = 0;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.storageKey);
      }
    } catch {
      // ignore
    }
    this.seedDefaultNonSensitiveMemories();
    this.notify();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed.items)) {
            parsed.items.forEach((it: PersonalityMemoryItem) => {
              // Re-check sanitization upon load
              const checkKey = this.sanitize(it.key);
              const checkVal = this.sanitize(it.value);
              if (!checkKey.hadSecrets && !checkVal.hadSecrets) {
                this.items.set(it.id, it);
              }
            });
          }
          this.complimentCount = typeof parsed.complimentCount === 'number' ? parsed.complimentCount : 0;
          this.interactionCount = typeof parsed.interactionCount === 'number' ? parsed.interactionCount : 0;
          return;
        }
      }
    } catch {
      // ignore
    }
    this.seedDefaultNonSensitiveMemories();
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const payload = {
          items: Array.from(this.items.values()),
          complimentCount: this.complimentCount,
          interactionCount: this.interactionCount,
        };
        window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
      }
    } catch {
      // ignore
    }
  }

  private seedDefaultNonSensitiveMemories() {
    this.rememberFact('preference', 'favorite_activity', 'Listening to Lo-Fi music & cooking virtual meals');
    this.rememberFact('preference', 'greeting_style', 'Warm, cheerful, and enthusiastic');
    this.rememberFact('topic', 'favorite_topics', 'Robotics, space exploration, and creative coding');
    this.rememberFact('activity', 'companion_mode', 'Desktop Assistant');
  }
}

export const personalityMemory = new PersonalityMemory();
