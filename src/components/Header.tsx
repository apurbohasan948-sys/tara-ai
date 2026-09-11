import React from 'react';
import { Cpu, Wifi, Battery, Code2, Sliders, Terminal, ShieldCheck, LogOut, Lock, ToggleLeft, ToggleRight, Radio } from 'lucide-react';
import { RobotState, WiFiInfo, AppMode } from '../types';

interface HeaderProps {
  activeView: 'config' | 'firmware' | 'api' | 'security';
  onViewChange: (view: 'config' | 'firmware' | 'api' | 'security') => void;
  wifiInfo: WiFiInfo;
  robotState: RobotState;
  appMode: AppMode;
  onToggleMode: () => void;
  isAuthenticated: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  wifiInfo,
  robotState,
  appMode,
  onToggleMode,
  isAuthenticated,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Logo & Hardware/Mode Identifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-emerald-500/20">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-wide">TARA</h1>
                <span className="text-[11px] font-mono font-semibold bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/50">
                  ESP32 v0.1.0
                </span>

                {/* Mode Indicator Pill */}
                {appMode === 'simulation' ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                    <Radio className="w-2.5 h-2.5 text-amber-400 animate-pulse" />
                    SIMULATION MODE
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                    PRODUCTION
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Standard ESP32 Companion Robot • Secure Authenticated Firmware
              </p>
            </div>
          </div>

          {/* Mobile State Pill */}
          <div className="lg:hidden flex items-center gap-1.5 bg-slate-800/90 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            {robotState}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start lg:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onViewChange('config')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'config'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Companion Web UI
          </button>

          <button
            onClick={() => onViewChange('security')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'security'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Security Audit (14 Tests)
          </button>

          <button
            onClick={() => onViewChange('firmware')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'firmware'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Firmware Repository (.ZIP)
          </button>

          <button
            onClick={() => onViewChange('api')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'api'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            REST API Console
          </button>
        </div>

        {/* Mode Toggle & Auth Controls */}
        <div className="flex items-center gap-2 self-end lg:self-auto">
          {/* Mode Switcher */}
          <button
            type="button"
            onClick={onToggleMode}
            title="Toggle between Hardware-Free Simulation and Real ESP32 Production Mode"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-colors"
          >
            <span className="text-[11px] text-slate-400">Mode:</span>
            <span className={appMode === 'simulation' ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
              {appMode === 'simulation' ? 'Simulation' : 'Production'}
            </span>
          </button>

          {/* Auth Logout */}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 px-2.5 py-1.5 rounded-xl text-xs transition-colors"
              title="Logout session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/40 border border-amber-800/50 px-2 py-1 rounded-lg">
              <Lock className="w-3 h-3" />
              <span>Unauthenticated</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
