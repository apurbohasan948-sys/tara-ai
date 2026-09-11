import React, { useEffect, useState } from 'react';
import { MusicState } from '../types';
import { musicController } from '../services/MusicController';
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, Music, Disc } from 'lucide-react';

export const MusicPlayerDeck: React.FC = () => {
  const [state, setState] = useState<MusicState>(musicController.getState());

  useEffect(() => {
    return musicController.subscribe((s) => setState(s));
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Audio & Music Companion Controller
          </h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-800/60">
          Mode: {state.mode === 'synth_chime' ? 'ESP32 Synthesizer / WebAudio' : state.mode}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 mb-3">
        {/* Animated Album Art / Disc */}
        <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-tr from-purple-900 via-indigo-900 to-cyan-900 flex items-center justify-center shadow-inner border border-purple-700/50 flex-shrink-0 ${
          state.isPlaying ? 'animate-pulse' : ''
        }`}>
          <Disc className={`w-7 h-7 text-purple-300 ${state.isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
        </div>

        {/* Track Metadata & Progress */}
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white truncate">{state.trackTitle}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{state.artist}</div>
            </div>
            <div className="text-[10px] font-mono text-cyan-400">
              {formatTime(state.positionSec)} / {formatTime(state.durationSec)}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${(state.positionSec / Math.max(1, state.durationSec)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => musicController.handleCommand('PREVIOUS')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs"
            title="Previous"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {state.isPlaying ? (
            <button
              type="button"
              onClick={() => musicController.handleCommand('PAUSE')}
              className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all text-xs flex items-center gap-1 shadow-sm"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => musicController.handleCommand('PLAY')}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-all text-xs flex items-center gap-1 shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Play</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => musicController.handleCommand('STOP')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => musicController.handleCommand('NEXT')}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all text-xs"
            title="Next"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="range"
            min="0"
            max="100"
            value={state.volume}
            onChange={(e) => {
              state.volume = Number(e.target.value);
              setState({ ...state });
            }}
            className="w-20 accent-cyan-500 h-1.5 rounded-lg bg-slate-800 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-400 w-7 text-right">
            {state.volume}%
          </span>
        </div>
      </div>
    </div>
  );
};
