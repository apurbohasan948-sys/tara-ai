import React from 'react';
import { Cpu, Wifi, Battery, Code2, Sliders, Terminal, ExternalLink } from 'lucide-react';
import { RobotState, WiFiInfo } from '../types';

interface HeaderProps {
  activeView: 'config' | 'firmware' | 'api';
  onViewChange: (view: 'config' | 'firmware' | 'api') => void;
  wifiInfo: WiFiInfo;
  robotState: RobotState;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  wifiInfo,
  robotState,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Logo & Hardware Identifier */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-wide">TARA</h1>
                <span className="text-[11px] font-mono font-semibold bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded border border-cyan-800/50">
                  ESP32 v0.1.0
                </span>
              </div>
              <p className="text-[12px] text-slate-400 hidden sm:block">
                Modular Physical AI Companion Robot Framework
              </p>
            </div>
          </div>

          {/* Mobile State Pill */}
          <div className="md:hidden flex items-center gap-1.5 bg-slate-800/90 text-cyan-400 text-xs px-2.5 py-1 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {robotState}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => onViewChange('config')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'config'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Companion Web UI
          </button>

          <button
            onClick={() => onViewChange('firmware')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'firmware'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            ESP32 Firmware (.ino / C++)
          </button>

          <button
            onClick={() => onViewChange('api')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeView === 'api'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            REST API Console
          </button>
        </div>

        {/* Telemetry Hardware Pills */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">Xtensa LX6 240MHz</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs text-slate-300">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-[11px]">
              {wifiInfo.state === 'AP_MODE' ? 'SoftAP 192.168.4.1' : wifiInfo.ip}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 px-2.5 py-1 rounded-lg text-xs text-slate-300">
            <Battery className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-[11px]">4.18V (94%)</span>
          </div>
        </div>
      </div>
    </header>
  );
};
