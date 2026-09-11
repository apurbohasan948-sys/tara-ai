/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  Terminal,
  Hand,
  Sparkles,
  Bot,
  Gamepad2,
  Music,
  Radio,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Tv,
  Heart,
} from 'lucide-react';
import { Header } from './components/Header';
import { OledSimulator } from './components/OledSimulator';
import { SimulationControls } from './components/SimulationControls';
import { TabFaceDebug } from './components/TabFaceDebug';
import { ArmVisualizer } from './components/ArmVisualizer';
import { TabFaceCustomizer } from './components/TabFaceCustomizer';
import { AiChatCompanion } from './components/AiChatCompanion';
import { GameDeck } from './components/GameDeck';
import { MusicPlayerDeck } from './components/MusicPlayerDeck';
import { PresenceRadar } from './components/PresenceRadar';
import { FirmwareHub } from './components/FirmwareHub';
import { SecurityDeck } from './components/SecurityDeck';
import { PersonalityDeck } from './components/PersonalityDeck';
import { AutonomousLifeDeck } from './components/AutonomousLifeDeck';

type NavTab =
  | 'AUTONOMOUS'
  | 'SIMULATION'
  | 'PERSONALITY'
  | 'SECURITY'
  | 'DEBUGGER'
  | 'ARMS'
  | 'EXPRESSIONS'
  | 'CHAT'
  | 'GAMES'
  | 'MUSIC'
  | 'RADAR'
  | 'FIRMWARE';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('AUTONOMOUS');

  const navItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'AUTONOMOUS', label: 'Autonomous Life System', icon: Sparkles },
    { id: 'SIMULATION', label: 'Simulation & Tests', icon: Tv },
    { id: 'PERSONALITY', label: 'Personality & Shy System', icon: Heart },
    { id: 'SECURITY', label: 'Security & Hardening (17 Tests)', icon: ShieldCheck },
    { id: 'DEBUGGER', label: 'Visual Debugger', icon: Terminal },
    { id: 'ARMS', label: 'Visual Arms', icon: Hand },
    { id: 'EXPRESSIONS', label: 'Face Gallery (34)', icon: Activity },
    { id: 'CHAT', label: 'Talk to TARA', icon: Bot },
    { id: 'GAMES', label: 'Companion Games', icon: Gamepad2 },
    { id: 'MUSIC', label: 'Lo-Fi Player', icon: Music },
    { id: 'RADAR', label: 'Human Radar', icon: Radio },
    { id: 'FIRMWARE', label: 'ESP32 Code', icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Application Bar */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Core Display & Zero-Head Movement Verification Banner */}
        <div className="flex flex-col items-center">
          {/* Important Design Banner */}
          <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Fixed Face Design:</strong> Face canvas stays stable. All animations occur
              inside display via eyes, mouth, props & visual arms.
            </span>
          </div>

          {/* Central Stable OLED Screen Component */}
          <OledSimulator />
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto pb-1 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panes */}
        <div className="transition-opacity duration-200">
          {activeTab === 'AUTONOMOUS' && <AutonomousLifeDeck />}
          {activeTab === 'SIMULATION' && <SimulationControls />}
          {activeTab === 'PERSONALITY' && <PersonalityDeck />}
          {activeTab === 'SECURITY' && <SecurityDeck />}
          {activeTab === 'DEBUGGER' && <TabFaceDebug />}
          {activeTab === 'ARMS' && <ArmVisualizer />}
          {activeTab === 'EXPRESSIONS' && <TabFaceCustomizer />}
          {activeTab === 'CHAT' && <AiChatCompanion />}
          {activeTab === 'GAMES' && <GameDeck />}
          {activeTab === 'MUSIC' && <MusicPlayerDeck />}
          {activeTab === 'RADAR' && <PresenceRadar />}
          {activeTab === 'FIRMWARE' && <FirmwareHub />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-4 px-6 text-center text-xs text-slate-500 font-mono flex flex-wrap justify-between items-center gap-2 max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>TARA Framework v2.4 • Non-Moving Head OLED Architecture</span>
        </div>
        <div>Engineered for ESP32-S3 / Dual-Core FreeRTOS / SSD1306 OLED</div>
      </footer>
    </div>
  );
}

