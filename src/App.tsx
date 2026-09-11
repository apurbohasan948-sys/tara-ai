import React, { useState, useEffect } from 'react';
import {
  RobotState,
  RobotEmotion,
  RobotActivity,
  ConfigTab,
  WiFiInfo,
  BrainSettings,
  VoiceSettings,
  PersonalitySettings,
  SystemInfo,
  AppMode,
} from './types';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { SimulationControls } from './components/SimulationControls';
import { SecurityTestPanel } from './components/SecurityTestPanel';
import { OledSimulator } from './components/OledSimulator';
import { TabDashboard } from './components/TabDashboard';
import { TabBehavior } from './components/TabBehavior';
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
import { TabGames } from './components/TabGames';
import { TabFaceDebug } from './components/TabFaceDebug';
import { FirmwareHub } from './components/FirmwareHub';
import { ApiConsole } from './components/ApiConsole';
import { apiService } from './services/apiService';
import { autonomyManager } from './services/AutonomyManager';

import {
  LayoutDashboard,
  Sparkles,
  Gamepad2,
  Bug,
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
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Top-level View Mode: 'config' | 'firmware' | 'api' | 'security'
  const [activeView, setActiveView] = useState<'config' | 'firmware' | 'api' | 'security'>('config');

  // App Execution Mode: 'production' | 'simulation'
  const [appMode, setAppMode] = useState<AppMode>('simulation');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(apiService.isAuthenticated());

  // Robot State & Emotion
  const [robotState, setRobotState] = useState<RobotState>('IDLE');
  const [emotion, setEmotion] = useState<RobotEmotion>('NEUTRAL');
  const [activity, setActivity] = useState<RobotActivity>('IDLE');
  const [faceMessage, setFaceMessage] = useState<string | null>(null);

  // Active Tab inside Companion Config View
  const [activeTab, setActiveTab] = useState<ConfigTab>('dashboard');

  useEffect(() => {
    autonomyManager.setCallback((st, em) => {
      setRobotState(st);
      setEmotion(em);
    });
  }, []);

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
    providerType: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey: '',
    hasKey: true,
    allowCustom: false,
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
    firmwareVersion: '0.1.0',
    hardwarePlatform: 'Standard ESP32-WROOM-32 (Xtensa LX6 Dual-Core)',
    uptimeSeconds: 1980,
    freeHeapBytes: 198420,
    totalHeapBytes: 327680,
    cpuFreqMhz: 240,
    batteryMv: 4180,
    batteryPercent: 94,
  });

  // Mode change handler
  const handleToggleMode = () => {
    const nextMode = appMode === 'simulation' ? 'production' : 'simulation';
    setAppMode(nextMode);
    apiService.setMode(nextMode);
  };

  // Logout handler
  const handleLogout = async () => {
    await apiService.logout();
    setIsAuthenticated(false);
  };

  // Robot State Handlers
  const handleTriggerSpeech = (text: string) => {
    setRobotState('SPEAKING');
    setEmotion('JOY');
    setFaceMessage(text);
    setTimeout(() => {
      setRobotState('IDLE');
      setEmotion('CALM');
      setFaceMessage(null);
    }, 3500);
  };

  const handleTriggerListen = () => {
    setRobotState('LISTENING');
    setEmotion('CURIOSITY');
    setFaceMessage('Listening...');
    setTimeout(() => {
      setRobotState('THINKING');
      setFaceMessage('Processing audio...');
      setTimeout(() => {
        setRobotState('IDLE');
        setEmotion('CALM');
        setFaceMessage(null);
      }, 2000);
    }, 2500);
  };

  const handleTriggerBrainResponse = (state: RobotState, targetEmotion: RobotEmotion, replyText: string) => {
    setRobotState(state);
    setEmotion(targetEmotion);
    setFaceMessage(replyText);
    if (state === 'SPEAKING') {
      setTimeout(() => {
        setRobotState('IDLE');
        setEmotion('CALM');
        setFaceMessage(null);
      }, 4000);
    }
  };

  const handleRestart = () => {
    setRobotState('CONNECTING');
    setEmotion('CALM');
    setFaceMessage('Rebooting...');
    setTimeout(() => {
      setRobotState('IDLE');
      setFaceMessage(null);
    }, 3000);
  };

  const handleFactoryReset = () => {
    setRobotState('CONNECTING');
    setEmotion('CALM');
    setFaceMessage('Resetting NVS...');
    setTimeout(() => {
      setWifiInfo((prev) => ({
        ...prev,
        state: 'AP_MODE',
        ssid: 'TARA-ROBOT-AP',
        ip: '192.168.4.1',
        hasInternet: false,
      }));
      setRobotState('IDLE');
      setFaceMessage('SoftAP Mode');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Universal Header */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        wifiInfo={wifiInfo}
        robotState={robotState}
        appMode={appMode}
        onToggleMode={handleToggleMode}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If user is not authenticated on the local companion portal, show LoginPage */}
        {!isAuthenticated && activeView === 'config' ? (
          <LoginPage
            onLoginSuccess={() => setIsAuthenticated(true)}
            isSimulationMode={appMode === 'simulation'}
          />
        ) : (
          <>
            {/* VIEW 1: COMPANION CONFIG & LIVE DASHBOARD */}
            {activeView === 'config' && (
              <>
                {/* Simulation Mode Action Bar & Speech Simulator */}
                {appMode === 'simulation' && (
                  <SimulationControls
                    currentState={robotState}
                    currentEmotion={emotion}
                    currentActivity={activity}
                    onStateChange={(st, em) => {
                      setRobotState(st);
                      if (em) setEmotion(em);
                    }}
                    onActivityChange={setActivity}
                    onSimulateSpeech={(text) => {
                      setFaceMessage(text);
                    }}
                  />
                )}

                {/* Primary Dual View: Procedural OLED Simulator + Tab Navigation */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
                  {/* Left Column: OLED Display Hardware Simulator */}
                  <div className="lg:col-span-4 flex flex-col">
                    <OledSimulator
                      state={robotState}
                      emotion={emotion}
                      activity={activity}
                      onStateChange={setRobotState}
                    />
                  </div>

                  {/* Right Column: Tab Bar & Active Tab Content */}
                  <div className="lg:col-span-8 flex flex-col">
                    {/* Navigation Tabs Bar */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1 overflow-x-auto mb-6 shadow-xs">
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'dashboard'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        Dashboard
                      </button>

                      <button
                        onClick={() => setActiveTab('behavior')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'behavior'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Behavior Studio
                      </button>

                      <button
                        onClick={() => setActiveTab('games')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'games'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-cyan-300" />
                        Games
                      </button>

                      <button
                        onClick={() => setActiveTab('debug')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'debug'
                            ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Bug className="w-3.5 h-3.5 text-emerald-300" />
                        Face Debug
                      </button>

                      <button
                        onClick={() => setActiveTab('wifi')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'wifi'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Wifi className="w-3.5 h-3.5" />
                        Wi-Fi
                      </button>

                      <button
                        onClick={() => setActiveTab('brain')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'brain'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        AI Brain
                      </button>

                      <button
                        onClick={() => setActiveTab('voice')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'voice'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Voice & Audio
                      </button>

                      <button
                        onClick={() => setActiveTab('personality')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'personality'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        Personality
                      </button>

                      <button
                        onClick={() => setActiveTab('memory')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'memory'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Database className="w-3.5 h-3.5" />
                        Memory
                      </button>

                      <button
                        onClick={() => setActiveTab('face')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'face'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Smile className="w-3.5 h-3.5" />
                        Face
                      </button>

                      <button
                        onClick={() => setActiveTab('hardware')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'hardware'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        Hardware
                      </button>

                      <button
                        onClick={() => setActiveTab('cloud')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'cloud'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        Cloud
                      </button>

                      <button
                        onClick={() => setActiveTab('system')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'system'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        System
                      </button>

                      <button
                        onClick={() => setActiveTab('ota')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                          activeTab === 'ota'
                            ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        OTA
                      </button>
                    </div>

                    {/* Tab Contents */}
                    <div>
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
                          onNavigateTab={setActiveTab}
                          onTriggerSpeech={handleTriggerSpeech}
                          onTriggerListen={handleTriggerListen}
                        />
                      )}

                      {activeTab === 'behavior' && (
                        <TabBehavior
                          robotState={robotState}
                          emotion={emotion}
                          activity={activity}
                          onSetState={setRobotState}
                          onSetEmotion={setEmotion}
                          onSetActivity={setActivity}
                        />
                      )}

                      {activeTab === 'games' && <TabGames />}

                      {activeTab === 'debug' && (
                        <TabFaceDebug
                          currentEmotion={emotion}
                          currentActivity={activity}
                          onEmotionChange={setEmotion}
                          onActivityChange={setActivity}
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
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: SECURITY VULNERABILITY AUDIT SUITE (14 Tests) */}
            {activeView === 'security' && <SecurityTestPanel />}

            {/* VIEW 3: FIRMWARE CODE REPOSITORY & DOWNLOAD */}
            {activeView === 'firmware' && <FirmwareHub />}

            {/* VIEW 4: REST API CONSOLE */}
            {activeView === 'api' && (
              <ApiConsole
                robotState={robotState}
                emotion={emotion}
                wifiInfo={wifiInfo}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            TARA Framework &bull; Standard ESP32 Dual-Core (Xtensa LX6) &bull; Authenticated & SSRF-Protected
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            I2C: 21/22 &bull; I2S: 26/25/19/34 &bull; LED: 2 &bull; Touch: 4
          </div>
        </div>
      </footer>
    </div>
  );
}
