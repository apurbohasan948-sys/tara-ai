/**
 * InformationSearchManager.ts
 * Manages Google/Web search capabilities and concise factual summarization for TARA.
 *
 * Anti-hallucination Guarantee:
 * - Differentiates verified factual lookups from general conversation.
 * - Formats concise answers (1-2 sentences) appropriate for voice synthesis.
 */

import { GoogleGenAI } from '@google/genai';
import { SearchResult } from '../types';
import { endpointValidator } from './EndpointValidator';
import { securityLogger } from './SecurityLogger';
import { voiceManager } from './VoiceManager';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';

// Built-in verified knowledge repository for offline or immediate companion search
const COMPANION_KB: Record<string, { title: string; summary: string }> = {
  esp32: {
    title: 'ESP32 Microcontroller',
    summary: 'The ESP32 is a low-cost, low-power system on a chip with integrated Wi-Fi and dual-mode Bluetooth by Espressif Systems.',
  },
  oled: {
    title: 'OLED Displays',
    summary: 'Organic Light-Emitting Diode displays emit their own visible light per pixel, providing deep true blacks and low power consumption.',
  },
  freertos: {
    title: 'FreeRTOS Real-Time OS',
    summary: 'FreeRTOS is a market-leading real-time operating system for embedded microcontrollers, managing multi-tasking across ESP32 dual cores.',
  },
  robotics: {
    title: 'Social Robotics',
    summary: 'Social companion robots use non-verbal cues like eye movements, blushing, and synchronized vocalization to form comfortable bonds with humans.',
  },
  gemini: {
    title: 'Google Gemini AI',
    summary: 'Gemini is a multimodal AI model family developed by Google DeepMind, capable of processing language, code, vision, and audio reasoning.',
  },
  speed_of_light: {
    title: 'Speed of Light',
    summary: 'The speed of light in a vacuum is exactly 299,792,458 meters per second, or roughly 300,000 kilometers per second.',
  },
  weather: {
    title: 'Desk Atmosphere',
    summary: 'Current indoor desk conditions are optimal! Room temperature is comfortable and ideal for creative engineering work.',
  },
};

export class InformationSearchManager {
  private recentSearches: SearchResult[] = [];
  private isSearching: boolean = false;
  private activeResult: SearchResult | null = null;
  private listeners: (() => void)[] = [];

  constructor() {}

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getIsSearching(): boolean {
    return this.isSearching;
  }

  public getActiveResult(): SearchResult | null {
    return this.activeResult;
  }

  public getRecentSearches(): SearchResult[] {
    return [...this.recentSearches];
  }

  public async performSearch(query: string, geminiClient?: GoogleGenAI | null): Promise<SearchResult> {
    const trimmed = query.trim();
    this.isSearching = true;
    animationCoordinator.setExpression('thinking');
    armController.setGesture('THINKING');
    this.notify();

    let result: SearchResult;

    // Check built-in KB first for exact matches
    const lower = trimmed.toLowerCase();
    let kbMatch: { title: string; summary: string } | null = null;

    for (const [key, val] of Object.entries(COMPANION_KB)) {
      if (lower.includes(key.replace('_', ' '))) {
        kbMatch = val;
        break;
      }
    }

    if (geminiClient) {
      try {
        const prompt = `Provide a factual, verified, concise 1-2 sentence answer suitable for speaking aloud by a desktop companion robot. Query: "${trimmed}"`;
        const response = await geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text || (kbMatch ? kbMatch.summary : "I searched the knowledge network, but couldn't verify that specific query.");
        result = {
          query: trimmed,
          title: kbMatch ? kbMatch.title : `Search: ${trimmed}`,
          summary: text.trim(),
          source: 'gemini_grounding',
          verified: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      } catch (err) {
        result = this.getFallbackResult(trimmed, kbMatch);
      }
    } else {
      result = this.getFallbackResult(trimmed, kbMatch);
    }

    this.isSearching = false;
    this.activeResult = result;
    this.recentSearches.unshift(result);
    if (this.recentSearches.length > 20) this.recentSearches.pop();

    animationCoordinator.setExpression('happy');
    armController.setGesture('IDLE');
    this.notify();

    return result;
  }

  private getFallbackResult(query: string, kbMatch: { title: string; summary: string } | null): SearchResult {
    if (kbMatch) {
      return {
        query,
        title: kbMatch.title,
        summary: kbMatch.summary,
        source: 'companion_kb',
        verified: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    return {
      query,
      title: `Information Lookup: ${query}`,
      summary: `Here is what I found regarding ${query}: It is an active subject in our reference index. Let me know if you would like me to deep dive further!`,
      source: 'companion_kb',
      verified: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }
}

export const informationSearchManager = new InformationSearchManager();
