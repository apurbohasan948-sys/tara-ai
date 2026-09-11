/**
 * MusicPlayerDeck.tsx
 * Lo-Fi Companion Music Player & Waveform Deck
 */

import React, { useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Disc } from 'lucide-react';
import { musicController, TrackInfo } from '../services/MusicController';

export const MusicPlayerDeck: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(musicController.getIsPlaying());
  const [track, setTrack] = useState<TrackInfo>(musicController.getTrack());
  const [currentTime, setCurrentTime] = useState(musicController.getCurrentTime());
  const [volume, setVolume] = useState(musicController.getVolume());

  useEffect(() => {
    const unsub = musicController.subscribe(() => {
      setIsPlaying(musicController.getIsPlaying());
      setTrack(musicController.getTrack());
      setCurrentTime(musicController.getCurrentTime());
      setVolume(musicController.getVolume());
    });
    return () => unsub();
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Companion Lo-Fi Player
            </h3>
            <p className="text-xs text-slate-400">
              Plays relaxed study beats while TARA listens and grooves in MUSIC activity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Disc className={`w-4 h-4 text-pink-400 ${isPlaying ? 'animate-spin' : ''}`} />
          <span className="font-mono">{track.genre}</span>
        </div>
      </div>

      {/* Track Info & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
        <div className="text-center md:text-left">
          <div className="text-base font-bold text-white">{track.title}</div>
          <div className="text-xs text-slate-400">{track.artist}</div>
        </div>

        {/* Progress */}
        <div className="flex-1 max-w-md w-full flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 transition-all"
              style={{ width: `${(currentTime / track.duration) * 100}%` }}
            />
          </div>
          <span>{formatTime(track.duration)}</span>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => musicController.prev()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => musicController.toggle()}
            className="p-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all shadow-lg shadow-pink-900/40"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => musicController.next()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
