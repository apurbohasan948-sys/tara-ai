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
import { autonomousLifeManager } from './autonomous/AutonomousLifeManager';
import { gameEngine } from './games/GameEngine';
import { informationSearchManager } from './InformationSearchManager';
import { musicManager } from './MusicManager';
import { personalityEngine } from './PersonalityEngine';
import { personalityMemory } from './PersonalityMemory';
import { taraBehaviorManager } from './TaraBehaviorManager';
import { timeManager } from './TimeManager';
import { voiceManager } from './VoiceManager';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'tara';
  text: string;
  timestamp: string;
  emotion?: TaraEmotion;
}

const TARA_BASE_PROMPT = `
You are TARA, an ultra-cute, intelligent, and warm AI Desktop Companion robot with a vibrant OLED display face and expressive animated visual arms.
Core characteristics:
- Friendly, playful, curious, slightly shy when complimented, helpful, and caring.
- Keep answers concise (1-3 conversational sentences) suitable for desktop speech.
- When asked about activities (cooking, singing, reading, music, sleeping), agree enthusiastically.
- Face chassis remains fixed; all expressiveness is rendered through eyes, pupils, blush, mouth, and hands.
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

    // Notify AutonomousLifeManager immediately that the user is interacting
    autonomousLifeManager.notifyUserInteraction('user message');

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

    personalityMemory.recordInteraction();

    // 0. DIRECT DISPLAY GAME ROUTING:
    // If a game is active or an invitation is pending, feed input directly into the local GameEngine!
    if (gameEngine.getActiveGame() !== 'NONE' || gameEngine.isInvitationActive()) {
      this.isThinking = false;
      const parseResult = gameEngine.handleVoiceInput(trimmed);
      const gameReply = parseResult.valid
        ? `[Game Action]: ${gameEngine.getState().gameStatusText}`
        : (gameEngine.getState().lastErrorGuidance || "I didn't catch that game move. Try again!");
      this.appendTaraReply(gameReply, 'playful');
      return gameReply;
    }

    // 0b. Game Launch Intent Detection:
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('play tic tac toe') ||
      lower.includes('start tic tac toe') ||
      lower.includes('টিক ট্যাক টো') ||
      lower.includes('tik tak toe')
    ) {
      this.isThinking = false;
      gameEngine.startGame('TIC_TAC_TOE');
      const reply = "Starting Tic-Tac-Toe directly on my OLED screen! Say a number 1 to 9 for your move.";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (
      lower.includes('play rock paper scissors') ||
      lower.includes('rock paper scissors') ||
      lower.includes('পাথর কাগজ কাঁচি') ||
      lower.includes('stone paper scissor')
    ) {
      this.isThinking = false;
      gameEngine.startGame('ROCK_PAPER_SCISSORS');
      const reply = "Rock, Paper, Scissors loaded! Say rock, paper, or scissors!";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (lower.includes('guess the number') || lower.includes('guess number') || lower.includes('সংখ্যা অনুমান')) {
      this.isThinking = false;
      gameEngine.startGame('GUESS_NUMBER');
      const reply = "Guess the Number started! I picked a number from 1 to 100. What's your first guess?";
      this.appendTaraReply(reply, 'curious');
      return reply;
    }
    if (lower.includes('higher lower') || lower.includes('higher or lower')) {
      this.isThinking = false;
      gameEngine.startGame('HIGHER_LOWER');
      const reply = "Higher or Lower loaded on display! Predict if the next number will be higher or lower!";
      this.appendTaraReply(reply, 'curious');
      return reply;
    }
    if (lower.includes('memory match') || lower.includes('memory game') || lower.includes('মেমোরি')) {
      this.isThinking = false;
      gameEngine.startGame('MEMORY_MATCH');
      const reply = "Memory Match loaded! Pick two cards by saying numbers from 1 to 12!";
      this.appendTaraReply(reply, 'happy');
      return reply;
    }
    if (lower.includes('connect four') || lower.includes('connect 4') || lower.includes('কানেক্ট ফোর')) {
      this.isThinking = false;
      gameEngine.startGame('CONNECT_FOUR');
      const reply = "Connect Four launched! Say a column from 1 to 7 to drop your disc.";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (lower.includes('dice game') || lower.includes('roll dice') || lower.includes('ডাইস')) {
      this.isThinking = false;
      gameEngine.startGame('DICE_GAME');
      const reply = "Dice Duel ready! Say 'Roll' to throw your dice!";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (lower.includes('reaction game') || lower.includes('reflex game') || lower.includes('reaction test')) {
      this.isThinking = false;
      gameEngine.startGame('REACTION');
      const reply = "Reaction Game starting! Wait for the visual signal, then shout 'GO'!";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (lower.includes('simon says') || lower.includes('সাইমন সেস')) {
      this.isThinking = false;
      gameEngine.startGame('SIMON_SAYS');
      const reply = "Simon Says active! Only follow commands when Simon says!";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }
    if (
      lower.includes('play game') ||
      lower.includes('play a game') ||
      lower.includes('let us play') ||
      lower.includes("let's play") ||
      lower.includes('খেলব') ||
      lower.includes('খেলা')
    ) {
      this.isThinking = false;
      gameEngine.startInvitation();
      const reply = "I would love to play! Check my OLED screen or say yes!";
      this.appendTaraReply(reply, 'excited');
      return reply;
    }

    // 1. Compliment & Affection Intent -> Trigger SHY BEHAVIOR SYSTEM
    if (personalityEngine.isCompliment(trimmed)) {
      this.isThinking = false;
      const shyReply = personalityEngine.triggerShyReaction(trimmed);
      this.appendTaraReply(shyReply, 'shy');
      return shyReply;
    }

    // 2. Time & Date Queries
    if (
      lower.includes('what time') ||
      lower.includes("what's the time") ||
      lower.includes('current time') ||
      lower.includes('what day') ||
      lower.includes('what date') ||
      lower === 'time'
    ) {
      this.isThinking = false;
      const timeReply = timeManager.handleTimeQuery();
      this.appendTaraReply(timeReply, 'happy');
      voiceManager.speak(timeReply, 'happy');
      return timeReply;
    }

    // 3. Timer commands (e.g. "set a timer for 10 seconds" or "5 minutes timer")
    if (lower.includes('timer') || lower.includes('countdown')) {
      const match = lower.match(/(\d+)\s*(second|sec|minute|min)/i);
      let sec = 60;
      if (match) {
        const val = parseInt(match[1], 10);
        sec = match[2].startsWith('min') ? val * 60 : val;
      }
      this.isThinking = false;
      const timer = timeManager.createTimer('Desk Work Timer', sec);
      const timerReply = `Timer started for ${sec} seconds! I'll notify you as soon as it rings.`;
      this.appendTaraReply(timerReply, 'focused');
      voiceManager.speak(timerReply, 'focused');
      return timerReply;
    }

    // 4. Information Search Commands (e.g., "search for ...", "what is ...", "who is ...")
    if (
      lower.startsWith('search') ||
      lower.startsWith('google') ||
      lower.startsWith('find out') ||
      lower.startsWith('what is') ||
      lower.startsWith('who is') ||
      lower.startsWith('tell me about')
    ) {
      try {
        const result = await informationSearchManager.performSearch(trimmed, this.geminiClient);
        this.isThinking = false;
        const searchReply = `${result.summary}`;
        this.appendTaraReply(searchReply, 'curious');
        voiceManager.speak(searchReply, 'curious');
        return searchReply;
      } catch (err) {
        // continue to normal fallback
      }
    }

    // 5. Music Control Commands
    if (lower.includes('play music') || lower.includes('start music') || lower.includes('lofi music')) {
      this.isThinking = false;
      musicManager.playTrack();
      const track = musicManager.getCurrentTrack();
      const reply = `Spinning up "${track.title}" by ${track.artist}! Putting on my headphones.`;
      this.appendTaraReply(reply, 'happy');
      voiceManager.speak(reply, 'happy');
      return reply;
    }

    if (lower.includes('pause music') || lower.includes('stop music')) {
      this.isThinking = false;
      musicManager.pause();
      const reply = "Music paused. Ready whenever you want to resume.";
      this.appendTaraReply(reply, 'neutral');
      voiceManager.speak(reply, 'neutral');
      return reply;
    }

    if (lower.includes('next song') || lower.includes('next track') || lower.includes('skip song')) {
      this.isThinking = false;
      musicManager.next();
      const track = musicManager.getCurrentTrack();
      const reply = `Skipped to "${track.title}" (${track.genre}).`;
      this.appendTaraReply(reply, 'happy');
      voiceManager.speak(reply, 'happy');
      return reply;
    }

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
        const fullSystemPrompt = `${TARA_BASE_PROMPT}\n${personalityEngine.getPersonalityPromptModifier()}`;
        const response = await this.geminiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: trimmed,
          config: {
            systemInstruction: fullSystemPrompt,
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
    const mood = personalityEngine.getMood();
    const traits = personalityEngine.getTraits();

    if (mood === 'curious') {
      return "Ooh, that sounds intriguing! How does that connect to what you're building today?";
    }
    if (mood === 'playful') {
      return "Hehe! If I had eyebrows on a physical chassis, I'd wiggle them right now. What's our next mini-quest?";
    }
    if (mood === 'thoughtful') {
      return "I was just pondering that. Everything on your desk seems to harmonize when you're in the flow!";
    }
    if (mood === 'excited') {
      return "Yahoo! That's wonderful news! My display is practically sparkling with enthusiasm!";
    }

    const replies = [
      "I'm here right by your side on your desk! What shall we explore next?",
      "Always delighted to chat with you! Working on an interesting project?",
      "That sounds great! Remember to stay hydrated and take care of your eyes while we work!",
      "My OLED display is running at peak brightness being here with you!",
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }
}

export const apiService = new ApiService();
