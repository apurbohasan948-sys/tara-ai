/**
 * VoiceManager.ts
 * Complete synchronized voice playback, queue, envelope analyzer,
 * VoiceAnimationController, and mouth shape mapping.
 */

import { QueuedVoiceItem, TaraEmotion, TaraMouthState, VoiceQueueState, VoiceState } from '../types';

export interface VoiceEnvelopeConfig {
  attack: number;     // attack smoothing factor (0.1 - 0.9)
  release: number;    // release smoothing factor (0.1 - 0.9)
  minOpenMs: number;  // min duration mouth remains open
  minCloseMs: number; // min duration mouth remains closed
}

export class VoiceManager {
  private queue: QueuedVoiceItem[] = [];
  private queueState: VoiceQueueState = 'IDLE';
  private voiceState: VoiceState = 'VOICE_IDLE';

  // Audio Context & Envelope
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private currentAmplitude: number = 0;
  private smoothedAmplitude: number = 0;
  private currentMouthState: TaraMouthState = 'CLOSED';

  // Timing & Smoothing
  private lastOpenTime: number = 0;
  private lastCloseTime: number = 0;
  private speechStartTime: number = 0;
  private activeItem: QueuedVoiceItem | null = null;
  private currentSpeechEmotion: TaraEmotion = 'happy';

  // Config
  private envelopeConfig: VoiceEnvelopeConfig = {
    attack: 0.35,
    release: 0.15,
    minOpenMs: 90,
    minCloseMs: 60,
  };

  private listeners: ((state: {
    voiceState: VoiceState;
    queueState: VoiceQueueState;
    mouthState: TaraMouthState;
    amplitude: number;
    activeText: string | null;
  }) => void)[] = [];

  // Synth state
  private speechSynth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private synthInterval: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.speechSynth = window.speechSynthesis;
      }
    }
  }

  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public subscribe(cb: (state: {
    voiceState: VoiceState;
    queueState: VoiceQueueState;
    mouthState: TaraMouthState;
    amplitude: number;
    activeText: string | null;
  }) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    const s = {
      voiceState: this.voiceState,
      queueState: this.queueState,
      mouthState: this.currentMouthState,
      amplitude: this.smoothedAmplitude,
      activeText: this.activeItem?.text || null,
    };
    for (const cb of this.listeners) {
      cb(s);
    }
  }

  public getVoiceState(): VoiceState {
    return this.voiceState;
  }

  public isSpeaking(): boolean {
    return this.voiceState === 'VOICE_SPEAKING' || this.queueState === 'PLAYING';
  }

  public getQueueState(): VoiceQueueState {
    return this.queueState;
  }

  public getAmplitude(): number {
    return this.smoothedAmplitude;
  }

  public getMouthState(): TaraMouthState {
    return this.currentMouthState;
  }

  public getQueue(): QueuedVoiceItem[] {
    return [...this.queue];
  }

  /**
   * Enqueue a speech item. Plays immediately if queue is idle.
   */
  public speak(
    text: string,
    emotion: TaraEmotion = 'happy',
    priority: number = 1,
    onStart?: () => void,
    onEnd?: () => void
  ): string {
    const item: QueuedVoiceItem = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      emotion,
      priority,
      onStart,
      onEnd,
    };

    this.queue.push(item);
    if (this.queueState === 'IDLE' || this.queueState === 'COMPLETED') {
      this.processQueue();
    } else {
      this.queueState = 'QUEUED';
      this.notify();
    }
    return item.id;
  }

  private processQueue() {
    if (this.queue.length === 0) {
      this.queueState = 'IDLE';
      this.voiceState = 'VOICE_IDLE';
      this.currentMouthState = 'CLOSED';
      this.smoothedAmplitude = 0;
      this.notify();
      return;
    }

    const next = this.queue.shift()!;
    this.activeItem = next;
    this.currentSpeechEmotion = next.emotion || 'happy';
    this.queueState = 'PLAYING';
    this.voiceState = 'VOICE_STARTING';
    this.notify();

    this.initAudio();

    // Small preparation phase (50ms)
    setTimeout(() => {
      this.executePlayback(next);
    }, 50);
  }

  private executePlayback(item: QueuedVoiceItem) {
    this.voiceState = 'VOICE_SPEAKING';
    this.speechStartTime = Date.now();
    item.onStart?.();
    this.notify();

    // Check if Web Speech Synthesis is available
    if (this.speechSynth) {
      this.speechSynth.cancel(); // clear stale utterances
      const utterance = new SpeechSynthesisUtterance(item.text);
      this.currentUtterance = utterance;

      // Select female or companion voice if present
      const voices = this.speechSynth.getVoices();
      const preferred = voices.find(
        (v) => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.lang.startsWith('en')
      );
      if (preferred) utterance.voice = preferred;

      // Adjust pitch and rate depending on emotion
      if (item.emotion === 'excited') {
        utterance.pitch = 1.3;
        utterance.rate = 1.2;
      } else if (item.emotion === 'sad' || item.emotion === 'sleepy') {
        utterance.pitch = 0.85;
        utterance.rate = 0.85;
      } else {
        utterance.pitch = 1.15;
        utterance.rate = 1.05;
      }

      // Procedural audio tone sync for natural acoustic envelope
      this.playAcousticChime(item.text.length);

      // Start procedural envelope ticker
      this.startEnvelopeSimulation(item.text);

      utterance.onend = () => {
        this.stopEnvelopeSimulation();
        this.finishPlayback(item);
      };

      utterance.onerror = () => {
        this.stopEnvelopeSimulation();
        this.finishPlayback(item);
      };

      this.speechSynth.speak(utterance);
    } else {
      // Fallback procedural voice simulation with Web Audio
      const durationMs = Math.max(1200, item.text.length * 75);
      this.playProceduralBeeps(item.text);
      this.startEnvelopeSimulation(item.text);

      setTimeout(() => {
        this.stopEnvelopeSimulation();
        this.finishPlayback(item);
      }, durationMs);
    }
  }

  private finishPlayback(item: QueuedVoiceItem) {
    this.voiceState = 'VOICE_ENDING';
    this.currentMouthState = 'CLOSED';
    this.currentAmplitude = 0;
    this.smoothedAmplitude = 0;
    this.notify();

    item.onEnd?.();
    this.activeItem = null;

    setTimeout(() => {
      if (this.queue.length > 0) {
        this.processQueue();
      } else {
        this.queueState = 'COMPLETED';
        this.voiceState = 'VOICE_IDLE';
        this.currentMouthState = 'CLOSED';
        this.notify();
      }
    }, 150);
  }

  /**
   * Instant interruption: halts audio, clears queue, resets mouth to closed.
   */
  public interrupt() {
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    this.stopEnvelopeSimulation();
    this.queue = [];
    this.activeItem = null;
    this.queueState = 'CANCELLED';
    this.voiceState = 'VOICE_IDLE';
    this.currentMouthState = 'CLOSED';
    this.currentAmplitude = 0;
    this.smoothedAmplitude = 0;
    this.notify();

    setTimeout(() => {
      this.queueState = 'IDLE';
      this.notify();
    }, 100);
  }

  /**
   * Envelope simulation reacting to syllabic bursts & speech phonemes
   */
  private startEnvelopeSimulation(text: string) {
    this.stopEnvelopeSimulation();
    const words = text.split(/\s+/);
    let wordIdx = 0;
    let subTick = 0;

    this.synthInterval = window.setInterval(() => {
      if (this.voiceState !== 'VOICE_SPEAKING') return;

      subTick++;
      const now = Date.now();

      // Formant rhythm based on syllables
      const word = words[wordIdx % words.length] || 'a';
      const isPunctuation = /[.,!?;:]/.test(word);

      let targetAmp = 0;
      if (isPunctuation && subTick % 8 === 0) {
        // Pauses at commas/periods
        targetAmp = 0;
        this.voiceState = 'VOICE_PAUSE';
      } else {
        this.voiceState = 'VOICE_SPEAKING';
        // Organic sinusoidal vowel variation
        const vowelFactor = (Math.sin(subTick * 0.8) + 1) * 0.45;
        const randomFlutter = Math.random() * 0.25;
        targetAmp = Math.min(1.0, 0.25 + vowelFactor + randomFlutter);
      }

      if (subTick % 5 === 0) {
        wordIdx++;
      }

      // Attack / Release smoothing
      if (targetAmp > this.smoothedAmplitude) {
        this.smoothedAmplitude += (targetAmp - this.smoothedAmplitude) * this.envelopeConfig.attack;
      } else {
        this.smoothedAmplitude += (targetAmp - this.smoothedAmplitude) * this.envelopeConfig.release;
      }

      // Map smoothed amplitude to mouth shape
      this.updateMouthShape(now);
      this.notify();
    }, 40);
  }

  private stopEnvelopeSimulation() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.currentMouthState = 'CLOSED';
    this.currentAmplitude = 0;
    this.smoothedAmplitude = 0;
  }

  /**
   * Maps amplitude + speech emotion to expressive mouth shapes:
   * CLOSED, SMALL, SMILE, OPEN_SMALL, OPEN_MEDIUM, OPEN_WIDE, O_SHAPE, A_SHAPE, E_SHAPE, SPEAKING, LAUGHING, SINGING
   */
  private updateMouthShape(now: number) {
    const amp = this.smoothedAmplitude;

    if (amp < 0.08) {
      if (now - this.lastOpenTime > this.envelopeConfig.minOpenMs) {
        this.currentMouthState = this.currentSpeechEmotion === 'happy' ? 'SMILE' : 'CLOSED';
        this.lastCloseTime = now;
      }
      return;
    }

    if (now - this.lastCloseTime < this.envelopeConfig.minCloseMs && this.currentMouthState === 'CLOSED') {
      return;
    }

    this.lastOpenTime = now;

    // Emotion-specific mouth nuances
    if (this.currentSpeechEmotion === 'excited') {
      if (amp > 0.6) this.currentMouthState = 'OPEN_WIDE';
      else if (amp > 0.3) this.currentMouthState = 'A_SHAPE';
      else this.currentMouthState = 'OPEN_SMALL';
    } else if (this.currentSpeechEmotion === 'happy') {
      if (amp > 0.65) this.currentMouthState = 'OPEN_MEDIUM';
      else if (amp > 0.35) this.currentMouthState = 'E_SHAPE';
      else this.currentMouthState = 'SMILE';
    } else if (this.currentSpeechEmotion === 'sad') {
      if (amp > 0.5) this.currentMouthState = 'OPEN_SMALL';
      else this.currentMouthState = 'SMALL';
    } else {
      // General natural speaking modulation
      if (amp > 0.75) {
        this.currentMouthState = 'OPEN_WIDE';
      } else if (amp > 0.5) {
        this.currentMouthState = 'O_SHAPE';
      } else if (amp > 0.3) {
        this.currentMouthState = 'OPEN_MEDIUM';
      } else if (amp > 0.15) {
        this.currentMouthState = 'OPEN_SMALL';
      } else {
        this.currentMouthState = 'SMALL';
      }
    }
  }

  /**
   * Subtle pleasant companion audio chime
   */
  private playAcousticChime(intensity: number) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.15);
    } catch {
      // audio context muted or user has not clicked yet
    }
  }

  private playProceduralBeeps(text: string) {
    if (!this.audioCtx) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.4);
    } catch {}
  }
}

export const voiceManager = new VoiceManager();
