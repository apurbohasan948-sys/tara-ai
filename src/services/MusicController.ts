/**
 * MusicController.ts
 * Lo-fi desktop music player deck
 */

import { activitySceneManager } from './ActivitySceneManager';
import { animationCoordinator } from './AnimationCoordinator';
import { voiceManager } from './VoiceManager';

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  genre: string;
}

export const PLAYLIST: TrackInfo[] = [
  { id: '1', title: 'Desktop Rain & Warm Tea', artist: 'TARA Chill Beats', duration: 145, genre: 'Lo-Fi Hip Hop' },
  { id: '2', title: 'Cybernetic Sunrise', artist: 'Desk Companion Studio', duration: 180, genre: 'Synthwave' },
  { id: '3', title: 'Late Night Coding Flow', artist: 'Silicon Dreamers', duration: 160, genre: 'Ambient Chill' },
  { id: '4', title: 'Cafe Window Starlight', artist: 'TARA Trio', duration: 155, genre: 'Acoustic Lo-Fi' },
];

export class MusicController {
  private currentTrackIndex: number = 0;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private volume: number = 75;
  private listeners: (() => void)[] = [];
  private timer: number | null = null;

  public subscribe(cb: () => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public getTrack(): TrackInfo {
    return PLAYLIST[this.currentTrackIndex];
  }

  public getPlaylist(): TrackInfo[] {
    return PLAYLIST;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(100, vol));
    this.notify();
  }

  public play() {
    this.isPlaying = true;
    activitySceneManager.setActivity('MUSIC');
    animationCoordinator.setEmotion('happy');

    if (this.timer) clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      if (this.isPlaying) {
        this.currentTime += 1;
        if (this.currentTime >= this.getTrack().duration) {
          this.next();
        }
        this.notify();
      }
    }, 1000);
    this.notify();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.notify();
  }

  public toggle() {
    if (this.isPlaying) this.pause();
    else this.play();
  }

  public next() {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % PLAYLIST.length;
    this.currentTime = 0;
    voiceManager.speak(`Now playing: ${this.getTrack().title}`, 'happy');
    this.notify();
  }

  public prev() {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    this.currentTime = 0;
    this.notify();
  }
}

export const musicController = new MusicController();
