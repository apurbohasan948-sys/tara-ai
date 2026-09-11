import React from 'react';
import {
  RobotState,
  RobotEmotion,
  WiFiInfo,
  SystemInfo,
  VoiceSettings,
  BrainSettings,
} from '../types';
import {
  Activity,
  Wifi,
  Radio,
  Mic,
  Volume2,
  Tv,
  Clock,
  HardDrive,
  Smile,
  ShieldCheck,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface TabDashboardProps {
  robotState: RobotState;
  emotion: RobotEmotion;
  wifiInfo: WiFiInfo;
  systemInfo: SystemInfo;
  voiceSettings?: VoiceSettings;
  brainSettings?: BrainSettings;
  onSetState?: (st: RobotState) => void;
  onSetEmotion?: (em: RobotEmotion) => void;
  onNavigateTab?: (tab: any) => void;
  onTriggerSpeech?: (text: string) => void;
  onTriggerListen?: () => void;
}

const defaultVoiceSettings: VoiceSettings = {
  volume: 80,
  ttsLanguage: 'en',
  sampleRate: 16000,
  ttsEndpoint: 'https://translate.google.com/translate_tts',
  micEnabled: true,
  speakerEnabled: true,
};

const defaultBrainSettings: BrainSettings = {
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
};

export const TabDashboard: React.FC<TabDashboardProps> = ({
  robotState,
  emotion,
  wifiInfo,
  systemInfo,
  voiceSettings = defaultVoiceSettings,
  brainSettings = defaultBrainSettings,
  onSetState,
  onSetEmotion,
  onNavigateTab,
  onTriggerSpeech,
  onTriggerListen,
}) => {
  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const heapPercent = Math.round(
    ((systemInfo.totalHeapBytes - systemInfo.freeHeapBytes) / systemInfo.totalHeapBytes) * 100
  );

  return (
    <div className="space-y-6">
      {/* Primary Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Robot State
            </div>
            <div className="text-xl font-black text-cyan-400 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              {robotState}
            </div>
          </div>
          <Activity className="w-8 h-8 text-cyan-500/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Current Emotion
            </div>
            <div className="text-xl font-black text-amber-400 mt-1 flex items-center gap-2">
              <Smile className="w-5 h-5 text-amber-400" />
              {emotion}
            </div>
          </div>
          <Smile className="w-8 h-8 text-amber-500/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Wi-Fi Connection
            </div>
            <div className="text-sm font-bold text-slate-100 mt-1 font-mono">
              {wifiInfo.state === 'AP_MODE' ? 'SoftAP (Setup)' : wifiInfo.ssid}
            </div>
            <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
              IPv4: {wifiInfo.ip}
            </div>
          </div>
          <Wifi className="w-8 h-8 text-emerald-500/30" />
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              ESP32 Uptime
            </div>
            <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
              {formatUptime(systemInfo.uptimeSeconds)}
            </div>
            <div className="text-[11px] text-slate-400">
              Free RAM: {Math.round(systemInfo.freeHeapBytes / 1024)} KB
            </div>
          </div>
          <Clock className="w-8 h-8 text-purple-500/30" />
        </div>
      </div>

      {/* Subsystem Hardware & Service Health Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Subsystem Readiness & Telemetry
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>OLED Display</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              SSD1306 (0x3C)
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">I2C 21/22</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Mic className="w-4 h-4 text-cyan-400" />
              <span>Microphone</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {(voiceSettings?.micEnabled ?? true) ? 'INMP441 I2S' : 'Disabled'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">GPIO 34 (DIN)</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span>Speaker DAC</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              MAX98357A
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">Vol: {voiceSettings?.volume ?? 80}%</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>Internet WAN</span>
            </div>
            <div
              className={`text-xs font-semibold flex items-center gap-1.5 ${
                wifiInfo.hasInternet ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  wifiInfo.hasInternet ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              ></span>
              {wifiInfo.hasInternet ? 'ONLINE' : 'LOCAL ONLY'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">{wifiInfo.rssi} dBm</div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>AI Brain</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {brainSettings?.provider === 'cloud' ? 'Cloud LLM' : 'Local Ollama'}
            </div>
            <div className="text-[10px] text-slate-500 mt-1 truncate font-mono">
              {brainSettings?.model ?? 'gpt-4o-mini'}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>NVS Storage</span>
            </div>
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Preferences
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono">Part: nvs (20KB)</div>
          </div>
        </div>
      </div>

      {/* Heap Memory & System Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SRAM Gauge */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Standard ESP32 Internal SRAM Allocation
            </h4>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              {Math.round(systemInfo.freeHeapBytes / 1024)} KB Free /{' '}
              {Math.round(systemInfo.totalHeapBytes / 1024)} KB Total
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${heapPercent}%` }}
            ></div>
          </div>

          <div className="mt-3 flex justify-between text-[11px] text-slate-400">
            <span>Allocated: {heapPercent}%</span>
            <span className="text-emerald-400">Healthy (Lightweight Stack)</span>
            <span>Target: &lt; 280KB used</span>
          </div>
          <p className="mt-2 text-[12px] text-slate-400">
            Engineered with strict zero-fragmentation static buffers. Fully fits inside standard ESP32
            520KB SRAM without requiring PSRAM.
          </p>
        </div>

        {/* Emotion Switcher */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Emotion & State Trigger Playground
          </h4>
          <p className="text-[12px] text-slate-400 mb-3">
            Manually trigger companion emotional transitions to observe OLED face updates in real-time.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {(
              [
                'CALM',
                'JOY',
                'CURIOSITY',
                'EXCITEMENT',
                'EMPATHY',
                'DROWSY',
                'CONCERN',
              ] as RobotEmotion[]
            ).map((em) => (
              <button
                key={em}
                onClick={() => onSetEmotion?.(em)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  emotion === em
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
