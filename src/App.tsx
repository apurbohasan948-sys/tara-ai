import React, { useState } from 'react';
import {
  RobotState,
  RobotEmotion,
  ConfigTab,
  WiFiInfo,
  BrainSettings,
  VoiceSettings,
  PersonalitySettings,
  SystemInfo,
} from './types';
import { Header } from './components/Header';
import { OledSimulator } from './components/OledSimulator';
import { TabDashboard } from './components/TabDashboard';
import { TabWiFi } from './components/TabWiFi';
import { TabBrain } from './components/TabBrain';
import { TabVoice } from './components/TabVoice';
import { TabPersonality } from './components/TabPersonality';
import { TabMemory } from './components/TabMemory';
import { TabFace } from './components/TabFace';
import { TabHardware } from './components/TabHardware';
import { TabCloud } from './components/TabCloud';
import { TabSystem } from './components/TabSystem';
import { TabOTA } from './components/TabOTA';
import { FirmwareHub } from './components/FirmwareHub';
import { ApiConsole } from './components/ApiConsole';

import {
  LayoutDashboard,
  Wifi,
  Brain,
  Volume2,
  Heart,
  Database,
  Smile,
  Cpu,
  Cloud,
  Settings,
  Upload,
} from 'lucide-react';

export default function App() {
  // Top-level View Mode
  const [activeView, setActiveView] = useState<'config' | 'firmware' | 'api'>('config');

  // Robot State & Emotion
  const [robotState, setRobotState] = useState<RobotState>('IDLE');
  const [emotion, setEmotion] = useState<RobotEmotion>('CALM');
  const [faceMessage, setFaceMessage] = useState<string | null>(null);

  // Active Tab inside Companion Config View
  const [activeTab, setActiveTab] = useState<ConfigTab>('dashboard');

  // Wi-Fi Telemetry State
  const [wifiInfo, setWifiInfo] = useState<WiFiInfo>({
    state: 'CONNECTED_STA',
    ssid: 'Home_Fiber_2.4G',
    ip: '192.168.1.105',
    gateway: '192.168.1.1',
    mac: '24:6F:28:B3:9E:40',
    rssi: -62,
    hasInternet: true,
  });

  // Brain Settings
  const [brainSettings, setBrainSettings] = useState<BrainSettings>({
    provider: 'cloud',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'sk-tara-live-demo-key',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 256,
    timeoutMs: 10000,
    streaming: false,
    enabled: true,
  });

  // Voice Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    volume: 80,
    ttsLanguage: 'en',
    sampleRate: 16000,
    ttsEndpoint: 'https://translate.google.com/translate_tts',
    micEnabled: true,
    speakerEnabled: true,
  });

  // Personality Settings
  const [personality, setPersonality] = useState<PersonalitySettings>({
    name: 'TARA',
    primaryTrait: 'Curious & Empathetic',
    speakingStyle: 'Warm and concise',
    language: 'en',
    energyLevel: 85,
    wakeWordEnabled: true,
  });

  // System Telemetry
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    firmwareVersion: '0.1.0-alpha',
    hardwarePlatform: 'Standard ESP32 (Xtensa LX6 Dual-Core 240MHz)',
    uptimeSeconds: 3840,
    freeHeapBytes: 198420,
    totalHeapBytes: 327680,
    batteryMv: 4180,
    batteryPercent: 94,
  });

  // Trigger Response simulation from Brain tab
  const handleTriggerBrainResponse = (
    newState: RobotState,
    newEmotion: RobotEmotion,
    msg: string
  ) => {
    setRobotState(newState);
    setEmotion(newEmotion);
    setFaceMessage(msg);

    // Revert to IDLE after 4 seconds
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 4500);
  };

  // Trigger Speech from Voice tab
  const handleTriggerSpeech = (text: string) => {
    setRobotState('SPEAKING');
    setFaceMessage(text);
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 3500);
  };

  // Trigger Listening from Voice tab
  const handleTriggerListen = () => {
    setRobotState('LISTENING');
    setFaceMessage('Listening to mic (INMP441)...');
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 3500);
  };

  // Reset simulation
  const handleFactoryReset = () => {
    setWifiInfo({
      state: 'AP_MODE',
      ssid: 'TARA-Robot-A4F2',
      ip: '192.168.4.1',
      gateway: '192.168.4.1',
      mac: '24:6F:28:B3:9E:40',
      rssi: 0,
      hasInternet: false,
    });
    setRobotState('CONNECTING');
    setFaceMessage('SoftAP: 192.168.4.1');
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 4000);
  };

  const handleRestart = () => {
    setRobotState('CONNECTING');
    setFaceMessage('Rebooting ESP32...');
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 3000);
  };

  // Navigation tab definitions
  const tabs: Array<{ id: ConfigTab; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'wifi', label: 'Wi-Fi & AP', icon: <Wifi className="w-4 h-4" /> },
    { id: 'brain', label: 'Brain (AI)', icon: <Brain className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice & TTS', icon: <Volume2 className="w-4 h-4" /> },
    { id: 'personality', label: 'Personality', icon: <Heart className="w-4 h-4" /> },
    { id: 'memory', label: 'Memory', icon: <Database className="w-4 h-4" /> },
    { id: 'face', label: 'OLED Face', icon: <Smile className="w-4 h-4" /> },
    { id: 'hardware', label: 'Hardware', icon: <Cpu className="w-4 h-4" /> },
    { id: 'cloud', label: 'Cloud Sync', icon: <Cloud className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Settings className="w-4 h-4" /> },
    { id: 'ota', label: 'OTA Flash', icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top App Header */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        wifiInfo={wifiInfo}
        robotState={robotState}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* VIEW 1: COMPANION CONFIGURATION DASHBOARD */}
        {activeView === 'config' && (
          <>
            {/* Top Interactive OLED Screen Simulator */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
                <div>
                  <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                    Live Physical OLED Face Visualizer (128x64 SSD1306)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time simulation of the procedural eye physics, blink saccades, and mouth waveform dynamics.
                  </p>
                </div>
                <div className="text-xs font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-3 py-1.5 rounded-lg">
                  State: <span className="font-bold text-slate-100">{robotState}</span> | Emotion: <span className="font-bold text-slate-100">{emotion}</span>
                </div>
              </div>

              <OledSimulator
                state={robotState}
                emotion={emotion}
                statusText={faceMessage || undefined}
                onStateChange={setRobotState}
                onEmotionChange={setEmotion}
              />
            </div>

            {/* Sub-Navigation Tabs Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 overflow-x-auto flex gap-1 shadow-md">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Body Content */}
            <div className="transition-all">
              {activeTab === 'dashboard' && (
                <TabDashboard
                  robotState={robotState}
                  emotion={emotion}
                  wifiInfo={wifiInfo}
                  systemInfo={systemInfo}
                  voiceSettings={voiceSettings}
                  brainSettings={brainSettings}
                  onSetState={setRobotState}
                  onSetEmotion={setEmotion}
                />
              )}

              {activeTab === 'wifi' && (
                <TabWiFi
                  wifiInfo={wifiInfo}
                  onUpdateWiFi={(updated) => setWifiInfo((prev) => ({ ...prev, ...updated }))}
                />
              )}

              {activeTab === 'brain' && (
                <TabBrain
                  brainSettings={brainSettings}
                  onUpdateBrain={(updated) => setBrainSettings((prev) => ({ ...prev, ...updated }))}
                  onTriggerResponse={handleTriggerBrainResponse}
                />
              )}

              {activeTab === 'voice' && (
                <TabVoice
                  voiceSettings={voiceSettings}
                  onUpdateVoice={(updated) => setVoiceSettings((prev) => ({ ...prev, ...updated }))}
                  onTriggerSpeech={handleTriggerSpeech}
                  onTriggerListen={handleTriggerListen}
                />
              )}

              {activeTab === 'personality' && (
                <TabPersonality
                  personality={personality}
                  onUpdatePersonality={(updated) =>
                    setPersonality((prev) => ({ ...prev, ...updated }))
                  }
                />
              )}

              {activeTab === 'memory' && <TabMemory />}

              {activeTab === 'face' && (
                <TabFace
                  robotState={robotState}
                  onSetState={setRobotState}
                  onSetEmotion={setEmotion}
                />
              )}

              {activeTab === 'hardware' && <TabHardware />}

              {activeTab === 'cloud' && <TabCloud />}

              {activeTab === 'system' && (
                <TabSystem
                  systemInfo={systemInfo}
                  onRestartRobot={handleRestart}
                  onFactoryReset={handleFactoryReset}
                />
              )}

              {activeTab === 'ota' && <TabOTA currentVersion={systemInfo.firmwareVersion} />}
            </div>
          </>
        )}

        {/* VIEW 2: FIRMWARE CODE REPOSITORY & DOWNLOAD */}
        {activeView === 'firmware' && <FirmwareHub />}

        {/* VIEW 3: REST API CONSOLE */}
        {activeView === 'api' && (
          <ApiConsole
            robotState={robotState}
            emotion={emotion}
            wifiInfo={wifiInfo}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            TARA Framework &bull; Designed strictly for standard ESP32 (Xtensa LX6) &bull; Open Architecture
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            I2C: 21/22 &bull; I2S: 26/25/19/34 &bull; LED: 2 &bull; Touch: 4
          </div>
        </div>
      </footer>
    </div>
  );
}
