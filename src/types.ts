export type RobotState = 
  | 'IDLE'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING'
  | 'HAPPY'
  | 'SAD'
  | 'ANGRY'
  | 'SURPRISED'
  | 'SLEEPING'
  | 'CONNECTING'
  | 'ERROR';

export type RobotEmotion = 
  | 'CALM'
  | 'JOY'
  | 'CURIOSITY'
  | 'EXCITEMENT'
  | 'EMPATHY'
  | 'DROWSY'
  | 'CONCERN';

export interface WiFiInfo {
  state: 'CONNECTED_STA' | 'AP_MODE' | 'CONNECTING' | 'DISCONNECTED';
  ssid: string;
  ip: string;
  gateway: string;
  rssi: number;
  mac: string;
  hasInternet: boolean;
}

export interface BrainSettings {
  provider: 'cloud' | 'local';
  endpoint: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  streaming: boolean;
  enabled: boolean;
}

export interface VoiceSettings {
  ttsEndpoint: string;
  ttsLanguage: string;
  volume: number;
  sampleRate: number;
  micEnabled: boolean;
  speakerEnabled: boolean;
}

export interface PersonalitySettings {
  name: string;
  primaryTrait: string;
  speakingStyle: string;
  language: string;
  energyLevel: number;
  wakeWordEnabled: boolean;
}

export type ConfigTab =
  | 'dashboard'
  | 'wifi'
  | 'brain'
  | 'voice'
  | 'personality'
  | 'memory'
  | 'face'
  | 'hardware'
  | 'cloud'
  | 'system'
  | 'ota';

export interface SystemInfo {
  firmwareVersion: string;
  hardwarePlatform: string;
  uptimeSeconds: number;
  freeHeapBytes: number;
  totalHeapBytes: number;
  cpuFreqMhz?: number;
  batteryMv?: number;
  batteryPercent?: number;
}

export interface MemoryEntry {
  id: string;
  key: string;
  value: string;
  type: 'persistent' | 'conversation';
  timestamp: string;
}

export interface HardwarePinDef {
  label: string;
  gpio: number;
  description: string;
  functionType: 'I2C' | 'I2S' | 'GPIO' | 'ADC' | 'TOUCH';
  status: 'active' | 'standby' | 'optional';
}
