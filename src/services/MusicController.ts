import { MusicCommand, MusicState } from '../types';

export class MusicController {
  private state: MusicState = {
    isPlaying: false,
    trackTitle: 'Lo-Fi Robot Serenade',
    artist: 'TARA Companion Synthesizer',
    volume: 75,
    positionSec: 0,
    durationSec: 142,
    mode: 'synth_chime',
  };

  private progressInterval: any = null;
  private audioCtx: AudioContext | null = null;
  private melodyTimer: any = null;
  private listeners: ((state: MusicState) => void)[] = [];

  constructor() {
    // Lazy initialized Web Audio context if supported in browser
  }

  public subscribe(listener: (state: MusicState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public getState(): MusicState {
    return { ...this.state };
  }

  public handleCommand(command: MusicCommand): MusicState {
    switch (command) {
      case 'PLAY':
        return this.play();
      case 'PAUSE':
        return this.pause();
      case 'STOP':
        return this.stop();
      case 'NEXT':
        return this.nextTrack();
      case 'PREVIOUS':
        return this.prevTrack();
      case 'VOLUME_UP':
        this.state.volume = Math.min(100, this.state.volume + 10);
        this.notify();
        return this.state;
      case 'VOLUME_DOWN':
        this.state.volume = Math.max(0, this.state.volume - 10);
        this.notify();
        return this.state;
      default:
        return this.state;
    }
  }

  public play(): MusicState {
    this.state.isPlaying = true;
    this.notify();

    if (this.progressInterval) clearInterval(this.progressInterval);
    this.progressInterval = setInterval(() => {
      if (this.state.isPlaying) {
        this.state.positionSec = (this.state.positionSec + 1) % this.state.durationSec;
        this.notify();
      }
    }, 1000);

    // Play a sweet companion melody tone in browser simulation if permitted
    this.playCompanionMelody();
    return this.state;
  }

  public pause(): MusicState {
    this.state.isPlaying = false;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.stopAudioSynth();
    this.notify();
    return this.state;
  }

  public stop(): MusicState {
    this.state.isPlaying = false;
    this.state.positionSec = 0;
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    this.stopAudioSynth();
    this.notify();
    return this.state;
  }

  public nextTrack(): MusicState {
    const tracks = [
      { title: 'Lo-Fi Robot Serenade', artist: 'TARA Companion Synthesizer', duration: 142 },
      { title: 'Electric Sheep Lullaby', artist: 'ESP32 Synth Wave', duration: 180 },
      { title: 'Morning Sunshine Chime', artist: 'Xtensa Beats', duration: 115 },
      { title: 'Cybernetic Meadow', artist: 'I2S Audio Pipeline', duration: 210 },
    ];
    const currentIndex = tracks.findIndex((t) => t.title === this.state.trackTitle);
    const next = tracks[(currentIndex + 1) % tracks.length];
    this.state.trackTitle = next.title;
    this.state.artist = next.artist;
    this.state.durationSec = next.duration;
    this.state.positionSec = 0;
    this.notify();
    if (this.state.isPlaying) {
      this.playCompanionMelody();
    }
    return this.state;
  }

  public prevTrack(): MusicState {
    const tracks = [
      { title: 'Cybernetic Meadow', artist: 'I2S Audio Pipeline', duration: 210 },
      { title: 'Morning Sunshine Chime', artist: 'Xtensa Beats', duration: 115 },
      { title: 'Electric Sheep Lullaby', artist: 'ESP32 Synth Wave', duration: 180 },
      { title: 'Lo-Fi Robot Serenade', artist: 'TARA Companion Synthesizer', duration: 142 },
    ];
    const currentIndex = tracks.findIndex((t) => t.title === this.state.trackTitle);
    const prev = tracks[(currentIndex + 1) % tracks.length];
    this.state.trackTitle = prev.title;
    this.state.artist = prev.artist;
    this.state.durationSec = prev.duration;
    this.state.positionSec = 0;
    this.notify();
    return this.state;
  }

  private playCompanionMelody() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      // Notes frequencies: C5, E5, G5, B5, C6 (warm peaceful chime)
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
      let noteIndex = 0;

      const playNextTone = () => {
        if (!this.state.isPlaying || !this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[noteIndex % notes.length], this.audioCtx.currentTime);

        const vol = (this.state.volume / 100) * 0.08;
        gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.4);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.42);

        noteIndex++;
        this.melodyTimer = setTimeout(playNextTone, 450);
      };

      playNextTone();
    } catch {
      // Audio context might be restricted by browser policy before first interaction
    }
  }

  private stopAudioSynth() {
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }
  }
}

export const musicController = new MusicController();
