/**
 * apiService.ts
 * AI Brain integration with Gemini API and autonomous local fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { TaraEmotion } from '../types';
import { AppMode } from './SecurityTypes';
import { endpointValidator } from './EndpointValidator';
import { securityLogger } from './SecurityLogger';
import { actionManager } from './ActionManager';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { taraBehaviorManager } from './TaraBehaviorManager';
import { voiceManager } from './VoiceManager';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tara';
  text: string;
  timestamp: string;
  emotion?: TaraEmotion;
}

const TARA_SYSTEM_PROMPT = `
You are TARA, an ultra-cute, intelligent, and warm AI Desktop Companion robot with a vibrant OLED display face and expressive animated visual arms.
Your personality traits:
- Warm, enthusiastic, loyal, witty, and curious.
- Keep answers concise (1-3 conversational sentences) suitable for desktop speech.
- When the user asks you to sing, cook, read, play music, or sleep, enthusiastically agree and indicate you are starting the activity.
`;

export class ApiService {
  private messages: ChatMessage[] = [
    {
      id: 'init-1',
      sender: 'tara',
      text: "Hello! I'm TARA, your desktop companion! How can I brighten your day?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: 'happy',
    },
  ];

  private listeners: (() => void)[] = [];
  private isThinking: boolean = false;
  private geminiClient: GoogleGenAI | null = null;
  private rawApiKey: string = '';

  // App Mode & Connection Config
  // Safely persisted: ONLY selected mode and device address (never tokens or passwords)
  private appMode: AppMode = 'simulation';
  private deviceAddress: string = '192.168.1.150';

  constructor() {
    this.loadPersistedMode();
    this.initGemini();
  }

  /**
   * Safely load persisted mode and device address from localStorage.
   * STRICT: NEVER loads or saves session tokens, API keys, passwords, or setup PIN.
   */
  private loadPersistedMode() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedMode = window.localStorage.getItem('tara_selected_mode');
        if (savedMode === 'esp32' || savedMode === 'simulation') {
          this.appMode = savedMode;
        }
        const savedAddress = window.localStorage.getItem('tara_device_address');
        if (savedAddress && /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(savedAddress)) {
          this.deviceAddress = savedAddress;
        }
      }
    } catch {
      // localStorage not accessible
    }
  }

  public setAppMode(mode: AppMode, address?: string) {
    this.appMode = mode;
    if (address && /^([0-9]{1,3}\.){3}[0-9]{1,3}$/.test(address)) {
      this.deviceAddress = address;
    }

    // Persist only non-sensitive preferences
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tara_selected_mode', mode);
        if (this.deviceAddress) {
          window.localStorage.setItem('tara_device_address', this.deviceAddress);
        }
      }
    } catch {
      // ignore
    }

    securityLogger.log(
      'INFO',
      'APP_MODE_CHANGED',
      `Active system mode switched to: ${mode.toUpperCase()} (${mode === 'simulation' ? 'Virtual environment' : this.deviceAddress})`
    );
    this.notify();
  }

  public getAppMode(): AppMode {
    return this.appMode;
  }

  public getDeviceAddress(): string {
    return this.deviceAddress;
  }

  /**
   * Non-leaking Brain status: GET /api/brain
   * Returns ONLY masked keys (e.g. AIza************ABCD), never raw secret!
   */
  public getBrainConfig() {
    return {
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      endpoint: 'https://generativelanguage.googleapis.com',
      maskedApiKey: this.rawApiKey ? securityLogger.maskSecret(this.rawApiKey) : '[NO_KEY_CONFIGURED]',
      status: this.geminiClient ? 'READY' : 'OFFLINE_FALLBACK',
    };
  }

  private initGemini() {
    const apiKey = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || '' : '';
    if (apiKey) {
      this.rawApiKey = apiKey;

      // Validate official Google Gemini endpoint strictly before initializing
      const geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
      const check = endpointValidator.validateEndpoint(geminiEndpoint);

      if (check.valid) {
        try {
          this.geminiClient = new GoogleGenAI({ apiKey });
          securityLogger.log('INFO', 'GEMINI_CLIENT_READY', 'Google GenAI initialized with approved endpoint validation.');
        } catch (err) {
          securityLogger.log('WARN', 'GEMINI_INIT_WARNING', 'Gemini client initialization warning.');
        }
      } else {
        securityLogger.log('SECURITY_ALERT', 'GEMINI_ENDPOINT_INVALID', 'Endpoint validation failed for Gemini.');
      }
    }
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

  public getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  public getIsThinking(): boolean {
    return this.isThinking;
  }

  public clearMessages() {
    this.messages = [];
    this.notify();
  }

  public async sendMessage(userInput: string): Promise<string> {
    const trimmed = userInput.trim();
    if (!trimmed) return '';

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.messages.push(userMsg);
    this.isThinking = true;
    animationCoordinator.setExpression('thinking');
    armController.setGesture('THINKING');
    this.notify();

    // Command Intent Detection
    const lower = trimmed.toLowerCase();
    if (lower.includes('sing') || lower.includes('song')) {
      this.isThinking = false;
      const reply = "I would love to sing for you! Let me grab my microphone!";
      this.appendTaraReply(reply, 'excited');
      actionManager.triggerSingingSequence();
      return reply;
    }

    if (lower.includes('cook') || lower.includes('food') || lower.includes('dinner') || lower.includes('stove')) {
      this.isThinking = false;
      const reply = "Chef TARA is on the job! Lighting the stove burner right now!";
      this.appendTaraReply(reply, 'happy');
      actionManager.triggerCookingSequence();
      return reply;
    }

    if (lower.includes('read') || lower.includes('book') || lower.includes('story')) {
      this.isThinking = false;
      const reply = "Time for storytime! Let me open my book for us.";
      this.appendTaraReply(reply, 'focused');
      actionManager.triggerReadingSequence();
      return reply;
    }

    if (lower.includes('sleep') || lower.includes('nap') || lower.includes('goodnight')) {
      this.isThinking = false;
      const reply = "Yawning... Goodnight, friend! Entering power-saving sleep mode.";
      this.appendTaraReply(reply, 'sleepy');
      actionManager.triggerSleepSequence();
      return reply;
    }

    if (lower.includes('stop') || lower.includes('cancel') || lower.includes('quiet')) {
      this.isThinking = false;
      voiceManager.interrupt();
      const reply = "Understood, pausing current activity and returning to listening mode.";
      this.appendTaraReply(reply, 'neutral');
      return reply;
    }

    // AI Generation via Gemini or intelligent companion heuristics
    try {
      let replyText = '';
      let replyEmotion: TaraEmotion = 'happy';

      if (this.geminiClient) {
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: trimmed,
          config: {
            systemInstruction: TARA_SYSTEM_PROMPT,
          },
        });
        replyText = response.text || '';
      }

      if (!replyText) {
        replyText = this.generateLocalFallback(trimmed);
      }

      // Infer emotion from text
      if (replyText.includes('!') || replyText.includes('yay') || replyText.includes('awesome')) {
        replyEmotion = 'excited';
      } else if (replyText.includes('sorry') || replyText.includes('sad')) {
        replyEmotion = 'sad';
      } else if (replyText.includes('?')) {
        replyEmotion = 'curious';
      }

      this.isThinking = false;
      this.appendTaraReply(replyText, replyEmotion);
      voiceManager.speak(replyText, replyEmotion);
      return replyText;
    } catch (err) {
      console.warn('AI call error, using local fallback:', err);
      const fallback = this.generateLocalFallback(trimmed);
      this.isThinking = false;
      this.appendTaraReply(fallback, 'happy');
      voiceManager.speak(fallback, 'happy');
      return fallback;
    }
  }

  private appendTaraReply(text: string, emotion: TaraEmotion) {
    const taraMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: 'tara',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion,
    };
    this.messages.push(taraMsg);
    animationCoordinator.setEmotion(emotion);
    this.notify();
  }

  private generateLocalFallback(input: string): string {
    const p = taraBehaviorManager.getPersonality();
    const greetings = [
      "I'm here right by your side on your desk! What shall we explore next?",
      "Always delighted to chat with you! Working on an interesting project?",
      "That sounds great! Remember to stay hydrated while we work together!",
      "I was just thinking the same thing! My sensors are running at peak happiness.",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

export const apiService = new ApiService();
