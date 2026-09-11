import { RobotState, VoiceSettings } from '../types';

export type VoiceManagerState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'INTERRUPTED' | 'ERROR';

export interface TTSChunk {
  index: number;
  totalChunks: number;
  textChunk: string;
  audioUrl?: string;
}

export class TTSManager {
  private endpoint: string = 'https://translate.google.com/translate_tts';
  private language: string = 'en';
  private volume: number = 80;
  private speechRate: number = 1.0;
  private isSpeaking: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  public configure(settings: Partial<VoiceSettings>) {
    if (settings.ttsEndpoint) this.endpoint = settings.ttsEndpoint;
    if (settings.ttsLanguage) this.language = settings.ttsLanguage;
    if (settings.volume !== undefined) this.volume = settings.volume;
  }

  /**
   * Chunks large texts to preserve standard ESP32 RAM limit (< 150KB safe heap)
   * Splits into natural sentence chunks of <= 120 chars
   */
  public chunkText(fullText: string): string[] {
    const sentences = fullText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [fullText];
    const chunks: string[] = [];

    for (const s of sentences) {
      const trimmed = s.trim();
      if (!trimmed) continue;
      if (trimmed.length <= 120) {
        chunks.push(trimmed);
      } else {
        // Sub-chunk by commas or spaces
        const words = trimmed.split(' ');
        let current = '';
        for (const w of words) {
          if ((current + ' ' + w).length > 120) {
            chunks.push(current.trim());
            current = w;
          } else {
            current = (current + ' ' + w).trim();
          }
        }
        if (current) chunks.push(current.trim());
      }
    }
    return chunks;
  }

  public speak(
    text: string,
    onStart: () => void,
    onChunk: (chunk: TTSChunk) => void,
    onEnd: () => void,
    onError: (err: string) => void
  ): { cancel: () => void } {
    this.cancel();
    this.isSpeaking = true;

    const chunks = this.chunkText(text);
    let cancelled = false;

    // Use Web Speech API if available in browser for immediate high quality audio playback
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      let currentChunkIndex = 0;

      const speakNextChunk = () => {
        if (cancelled || currentChunkIndex >= chunks.length) {
          this.isSpeaking = false;
          onEnd();
          return;
        }

        const chunkText = chunks[currentChunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        utterance.lang = this.language;
        utterance.volume = this.volume / 100;
        utterance.rate = this.speechRate;
        this.activeUtterance = utterance;

        utterance.onstart = () => {
          if (currentChunkIndex === 0) onStart();
          onChunk({
            index: currentChunkIndex,
            totalChunks: chunks.length,
            textChunk: chunkText,
          });
        };

        utterance.onend = () => {
          currentChunkIndex++;
          speakNextChunk();
        };

        utterance.onerror = (e) => {
          if (cancelled) return;
          console.warn('TTS chunk error:', e);
          currentChunkIndex++;
          speakNextChunk();
        };

        window.speechSynthesis.speak(utterance);
      };

      speakNextChunk();
    } else {
      // Simulation mode fallback timer
      onStart();
      let idx = 0;
      const timer = setInterval(() => {
        if (cancelled || idx >= chunks.length) {
          clearInterval(timer);
          this.isSpeaking = false;
          onEnd();
          return;
        }
        onChunk({
          index: idx,
          totalChunks: chunks.length,
          textChunk: chunks[idx],
        });
        idx++;
      }, 1400);
    }

    return {
      cancel: () => {
        cancelled = true;
        this.cancel();
      },
    };
  }

  public cancel() {
    this.isSpeaking = false;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.activeUtterance = null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export class STTManager {
  private isListening: boolean = false;
  private recognition: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public startListening(
    onResult: (text: string, isFinal: boolean) => void,
    onError: (err: string) => void
  ): { stop: () => void } {
    this.isListening = true;

    if (this.recognition) {
      try {
        this.recognition.onresult = (event: any) => {
          let transcript = '';
          let isFinal = false;
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
            if (event.results[i].isFinal) isFinal = true;
          }
          onResult(transcript, isFinal);
        };

        this.recognition.onerror = (e: any) => {
          onError(e.error || 'STT recognition error');
        };

        this.recognition.start();
      } catch (e) {
        // Already started or permission issue
      }
    }

    return {
      stop: () => this.stopListening(),
    };
  }

  public stopListening() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export class AudioManager {
  private volume: number = 80;
  private micMuted: boolean = false;
  private speakerMuted: boolean = false;

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol));
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMic(): boolean {
    this.micMuted = !this.micMuted;
    return !this.micMuted;
  }

  public toggleSpeaker(): boolean {
    this.speakerMuted = !this.speakerMuted;
    return !this.speakerMuted;
  }
}

export class VoiceManager {
  public readonly tts: TTSManager;
  public readonly stt: STTManager;
  public readonly audio: AudioManager;

  private voiceState: VoiceManagerState = 'IDLE';
  private currentSpeechCancel?: () => void;
  private stateChangeCallback?: (state: RobotState) => void;
  private previousRobotState: RobotState = 'IDLE';
  private listeners: ((state: VoiceManagerState, text?: string) => void)[] = [];

  constructor() {
    this.tts = new TTSManager();
    this.stt = new STTManager();
    this.audio = new AudioManager();
  }

  public subscribe(listener: (state: VoiceManagerState, text?: string) => void): () => void {
    this.listeners.push(listener);
    listener(this.voiceState);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(state: VoiceManagerState, text?: string) {
    this.voiceState = state;
    for (const l of this.listeners) {
      l(state, text);
    }
  }

  public setStateCallback(cb: (state: RobotState) => void) {
    this.stateChangeCallback = cb;
  }

  public getVoiceState(): VoiceManagerState {
    return this.voiceState;
  }

  /**
   * Trigger speaking with full chunked pipeline and speech cancellation/interruption support
   */
  public speak(
    text: string,
    onFinish?: () => void,
    onError?: (err: string) => void
  ) {
    // If user was speaking or already speaking, interrupt cleanly
    this.interrupt();

    this.notify('SPEAKING', text);
    if (this.stateChangeCallback) {
      this.stateChangeCallback('SPEAKING');
    }

    const { cancel } = this.tts.speak(
      text,
      () => {
        this.notify('SPEAKING', text);
      },
      (chunk) => {
        this.notify('SPEAKING', chunk.textChunk);
      },
      () => {
        this.notify('IDLE');
        if (this.stateChangeCallback) {
          this.stateChangeCallback(this.previousRobotState || 'IDLE');
        }
        if (onFinish) onFinish();
      },
      (err) => {
        this.notify('ERROR', err);
        if (this.stateChangeCallback) {
          this.stateChangeCallback('ERROR');
        }
        if (onError) onError(err);
      }
    );

    this.currentSpeechCancel = cancel;
  }

  /**
   * User Interruption Handler:
   * When user speaks while TARA is speaking, immediately stop TTS, enter LISTENING state
   */
  public interrupt() {
    if (this.tts.getIsSpeaking()) {
      if (this.currentSpeechCancel) {
        this.currentSpeechCancel();
        this.currentSpeechCancel = undefined;
      }
      this.tts.cancel();
      this.notify('INTERRUPTED');
    }
  }

  public startListening(onRecognized: (text: string) => void) {
    this.interrupt();
    this.notify('LISTENING');
    if (this.stateChangeCallback) {
      this.stateChangeCallback('LISTENING');
    }

    this.stt.startListening(
      (text, isFinal) => {
        if (isFinal && text.trim()) {
          this.notify('PROCESSING');
          if (this.stateChangeCallback) {
            this.stateChangeCallback('THINKING');
          }
          onRecognized(text);
        }
      },
      (err) => {
        console.warn('Voice listening error:', err);
        this.notify('IDLE');
        if (this.stateChangeCallback) {
          this.stateChangeCallback('IDLE');
        }
      }
    );
  }

  public stopListening() {
    this.stt.stopListening();
    this.notify('IDLE');
    if (this.stateChangeCallback) {
      this.stateChangeCallback('IDLE');
    }
  }
}

export const voiceManager = new VoiceManager();
