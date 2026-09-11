/**
 * Header.tsx - TARA Desktop Companion Top Bar
 */

import React, { useEffect, useState } from 'react';
import {
  Activity,
  BatteryCharging,
  Cpu,
  Mic,
  MicOff,
  Volume2,
  Wifi,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { activitySceneManager } from '../services/ActivitySceneManager';
import { animationCoordinator } from '../services/AnimationCoordinator';
import { voiceManager } from '../services/VoiceManager';
import { TaraActivity, TaraEmotion } from '../types';
import { apiService } from '../services/apiService';
import { authManager } from '../services/AuthManager';
import { AppMode, SecurityState } from '../services/SecurityTypes';
import { ShieldAlert, Lock, Unlock, Server } from 'lucide-react';

export const Header: React.FC = () => {
  const [activity, setActivity] = useState<TaraActivity>('IDLE');
  const [emotion, setEmotion] = useState<TaraEmotion>('happy');
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [batteryLevel] = useState<number>(98);
  const [appMode, setAppMode] = useState<AppMode>(apiService.getAppMode());
  const [deviceAddress, setDeviceAddress] = useState<string>(apiService.getDeviceAddress());
  const [securityState, setSecurityState] = useState<SecurityState>(authManager.getState());

  useEffect(() => {
    const unsubVoice = voiceManager.subscribe((st) => {
      setIsVoiceActive(st.voiceState === 'VOICE_SPEAKING');
    });

    const unsubAuth = authManager.subscribe(() => {
      setSecurityState(authManager.getState());
    });

    const unsubApi = apiService.subscribe(() => {
      setAppMode(apiService.getAppMode());
      setDeviceAddress(apiService.getDeviceAddress());
    });

    const timer = setInterval(() => {
      setActivity(activitySceneManager.getActivity());
      setEmotion(animationCoordinator.getEmotion());
    }, 200);

    return () => {
      unsubVoice();
      unsubAuth();
      unsubApi();
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 text-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-lg shadow-black/20">
      {/* Brand & Companion Info */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-lg shadow-inner">
          T
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base font-bold tracking-tight text-white">TARA</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-500/30">
              Desktop AI Companion
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Fixed Head Design
            </span>

            {/* Prominent System Mode Display (Requirement 1 & 2) */}
            {appMode === 'simulation' ? (
              <span
                id="tara-mode-badge"
                className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/50 flex items-center gap-1.5 shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                MODE: SIMULATION — No ESP32 connected
              </span>
            ) : (
              <span
                id="tara-mode-badge"
                className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold border border-blue-500/50 flex items-center gap-1.5 shadow-sm"
              >
                <Server className="w-3.5 h-3.5 text-blue-400" />
                MODE: ESP32 — {deviceAddress}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">Layered OLED Display Animation Engine • Zero Motor Shaking</p>
        </div>
      </div>

      {/* Real-time Status Badges */}
      <div className="flex items-center gap-2 sm:gap-4 text-xs">
        {/* Activity Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">Activity:</span>
          <span className="font-semibold text-cyan-300">{activity}</span>
        </div>

        {/* Emotion Chip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Emotion:</span>
          <span className="font-semibold text-amber-300 capitalize">{emotion}</span>
        </div>

        {/* Voice Speech Indicator */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors ${
            isVoiceActive
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
              : 'bg-slate-800/80 text-slate-400 border-slate-700/80'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{isVoiceActive ? 'Speaking' : 'Voice Idle'}</span>
        </div>

        {/* Hardware Telemetry Icons */}
        <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-700/60 text-slate-400">
          <div className="flex items-center gap-1" title="Wi-Fi Signal: Strong (-48dBm)">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Online</span>
          </div>
          <div className="flex items-center gap-1" title="Target: ESP32-S3 Dual Core 240MHz">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-mono text-[11px]">ESP32</span>
          </div>
          <div className="flex items-center gap-1" title={`Battery: ${batteryLevel}% Charging`}>
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-[11px]">{batteryLevel}%</span>
          </div>
        </div>
      </div>
    </header>
  );
};
