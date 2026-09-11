/**
 * MusicManager.ts
 * Manages Lo-Fi, Spotify & YouTube Companion Music integration.
 *
 * Provides:
 * - Playback control states: PLAYING, PAUSED, STOPPED, BUFFERING.
 * - Lo-Fi playlist with artist, duration, progress, genre.
 * - Procedural spectrum equalizer & musical note generator for OLED display.
 * - Synchronizes with ActivitySceneManager & AnimationCoordinator.
 */

import { MusicPlaybackState, TrackInfo } from '../types';
import { activitySceneManager } from './ActivitySceneManager';
import { animationCoordinator } from './AnimationCoordinator';
import { armController } from './ArmController';
import { voiceManager } from './VoiceManager';

export const COMPANION_PLAYLIST: TrackInfo[] = [
  {
    id: 'lofi-1',
    title: 'Warm Desk Lamp & Green Tea',
    artist: 'TARA Chill Beats',
    duration: 180,
    genre: 'Lo-Fi Chillhop',
  },
  {
    id: 'lofi-2',
    title: 'Midnight Code Architecture',
    artist: 'Silicon Dreamscape',
    duration: 210,
    genre: 'Synthwave Ambient',
  },
  {
    id: 'lofi-3',
    title: 'Raindrops on Windowpane',
    artist: 'Cozy Desktop Trio',
    duration: 165,
    genre: 'Acoustic Lo-Fi',
  },
  {
    id: 'lofi-4',
    title: 'Starlight Through the Blinds',
    artist: 'OLED Glow Sessions',
    duration: 195,
    genre: 'Downtempo Electronic',
  },
];

export class MusicManager {
  private playbackState: MusicPlaybackState = 'IDLE';
  private currentTrackIdx: number = 0;
  private currentTimeSec: number = 0;
  private volume: number = 80;
  private source: 'YOUTUBE_SIM' | 'SPOTIFY_SIM' | 'LOCAL_LOFI' = 'LOCAL_LOFI';
  private timer: any = null;
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

  public getPlaybackState(): MusicPlaybackState {
    return this.playbackState;
  }

  public isPlaying(): boolean {
    return this.playbackState === 'PLAYING';
  }

  public play() {
    this.playTrack();
  }

  public getCurrentTrack(): TrackInfo {
    return COMPANION_PLAYLIST[this.currentTrackIdx];
  }

  public getPlaylist(): TrackInfo[] {
    return COMPANION_PLAYLIST;
  }

  public getCurrentTime(): number {
    return this.currentTimeSec;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol));
    this.notify();
  }

  public playTrack(index?: number) {
    if (typeof index === 'number' && index >= 0 && index < COMPANION_PLAYLIST.length) {
      this.currentTrackIdx = index;
      this.currentTimeSec = 0;
    }

    this.playbackState = 'PLAYING';
    activitySceneManager.setActivity('MUSIC');
    animationCoordinator.setEmotion('happy');
    animationCoordinator.setExpression('happy');
    armController.setGesture('IDLE');

    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.playbackState === 'PLAYING') {
        this.currentTimeSec += 1;
        if (this.currentTimeSec >= this.getCurrentTrack().duration) {
          this.next();
        }
        this.notify();
      }
    }, 1000);

    this.notify();
  }

  public pause() {
    this.playbackState = 'PAUSED';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  public stop() {
    this.playbackState = 'STOPPED';
    this.currentTimeSec = 0;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (activitySceneManager.getActivity() === 'MUSIC') {
      activitySceneManager.setActivity('IDLE');
    }
    this.notify();
  }

  public toggle() {
    if (this.playbackState === 'PLAYING') {
      this.pause();
    } else {
      this.playTrack();
    }
  }

  public next() {
    this.currentTrackIdx = (this.currentTrackIdx + 1) % COMPANION_PLAYLIST.length;
    this.currentTimeSec = 0;
    this.playTrack();
  }

  public prev() {
    this.currentTrackIdx =
      (this.currentTrackIdx - 1 + COMPANION_PLAYLIST.length) % COMPANION_PLAYLIST.length;
    this.currentTimeSec = 0;
    this.playTrack();
  }

  public seek(seconds: number) {
    this.currentTimeSec = Math.max(0, Math.min(this.getCurrentTrack().duration, seconds));
    this.notify();
  }
}

export const musicManager = new MusicManager();
