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

// 14 Core Emotions + Extended Expressive States + Game Reactions + Aliases
export type RobotEmotion = 
  // Core Existing
  | 'NEUTRAL'
  | 'HAPPY'
  | 'EXCITED'
  | 'CURIOUS'
  | 'CONFUSED'
  | 'SURPRISED'
  | 'SAD'
  | 'ANGRY'
  | 'SLEEPY'
  | 'FOND'
  | 'LOVE'
  | 'PLAYFUL'
  | 'WORRIED'
  | 'PROUD'
  | 'BORED'
  // Extended Expressive Additions
  | 'LAUGHING'
  | 'GIGGLING'
  | 'SMILING'
  | 'BIG_SMILE'
  | 'BLUSHING'
  | 'SHY'
  | 'EMBARRASSED'
  | 'LOVE_HEART'
  | 'SUSPICIOUS'
  | 'SCARED'
  | 'DIZZY'
  | 'FRUSTRATED'
  | 'TIRED'
  | 'FOCUSED'
  | 'CONCENTRATED'
  | 'DREAMING'
  | 'AMAZED'
  | 'CELEBRATING'
  | 'DISAPPOINTED'
  | 'EVIL_PLAYFUL'
  | 'SLEEP_DEEP'
  | 'WINK'
  | 'EYE_ROLL'
  | 'TEASING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'THINKING_HARD'
  // Game Reactions
  | 'GAME_THINKING'
  | 'GAME_SURPRISED'
  | 'GAME_HAPPY'
  | 'GAME_SAD'
  | 'GAME_CELEBRATE'
  | 'GAME_CONFUSED'
  | 'GAME_TAUNT_PLAYFUL'
  // Legacy aliases
  | 'CALM'
  | 'JOY'
  | 'CURIOSITY'
  | 'EXCITEMENT'
  | 'EMPATHY'
  | 'DROWSY'
  | 'CONCERN';

export type MouthShape =
  | 'MOUTH_CLOSED'
  | 'MOUTH_SMALL'
  | 'MOUTH_MEDIUM'
  | 'MOUTH_OPEN'
  | 'MOUTH_WIDE'
  | 'MOUTH_SMILE'
  | 'MOUTH_O'
  | 'MOUTH_A'
  | 'MOUTH_E'
  | 'talking'
  | 'neutral'
  | 'smile'
  | 'wide_grin'
  | 'open_o'
  | 'sad_frown'
  | 'thinking_pucker'
  | 'worried_wiggle'
  | 'pout';

export type EyeBlinkPattern =
  | 'NORMAL'
  | 'FAST'
  | 'SLOW'
  | 'DOUBLE'
  | 'WINK'
  | 'SLEEP'
  | 'NONE';

export type EyeGazeMode =
  | 'FORWARD'
  | 'LEFT'
  | 'RIGHT'
  | 'UP'
  | 'DOWN'
  | 'LOOK_AT_ACTIVITY'
  | 'LOOK_AT_POT'
  | 'LOOK_AT_BOOK'
  | 'LOOK_AT_MIC'
  | 'CURIOUS_LOOK'
  | 'DREAMY';

export type ActivityPriority =
  | 'SYSTEM_ERROR'
  | 'CRITICAL_EVENT'
  | 'USER_COMMAND'
  | 'ACTIVE_ACTIVITY'
  | 'SPEAKING_LISTENING'
  | 'EMOTION_REACTION'
  | 'IDLE';

export type RobotActivity =
  | 'IDLE'
  | 'READING'
  | 'SINGING'
  | 'COOKING'
  | 'LISTENING_MUSIC'
  | 'TALKING'
  | 'THINKING'
  | 'PLAYING'
  | 'RESTING'
  | 'SLEEPING';

export type RobotActionName =
  | 'GreetingAction'
  | 'ConversationAction'
  | 'ReadingAction'
  | 'SingingAction'
  | 'MusicAction'
  | 'CookingAction'
  | 'ThinkingAction'
  | 'IdleAction'
  | 'SleepAction'
  | 'WakeAction'
  | 'CelebrationAction'
  | 'NotificationAction';

export type ArmGesture =
  | 'IDLE'
  | 'WAVE'
  | 'POINT'
  | 'THUMBS_UP'
  | 'HAPPY_MOVE'
  | 'SAD_MOVE'
  | 'THINKING'
  | 'READING'
  | 'COOKING'
  | 'SINGING'
  | 'GREETING'
  // Abstract ARM_* commands requested
  | 'ARM_IDLE'
  | 'ARM_WAVE'
  | 'ARM_HOLD_MIC'
  | 'ARM_STIR'
  | 'ARM_HOLD_BOOK'
  | 'ARM_CELEBRATE'
  | 'ARM_THINK'
  | 'ARM_GREETING'
  | 'ARM_POINT'
  | 'ARM_THUMBS_UP'
  | 'ARM_SAD_MOVE'
  | 'ARM_HAPPY_MOVE';

export type GameType =
  | 'TIC_TAC_TOE'
  | 'ROCK_PAPER_SCISSORS'
  | 'MEMORY_MATCH'
  | 'GUESS_NUMBER'
  | 'REACTION_TAP'
  | 'SIMON_SAYS';

export type GameDifficulty = 'EASY' | 'NORMAL' | 'HARD';

export type SceneType =
  | 'IdleScene'
  | 'CookingScene'
  | 'SingingScene'
  | 'ReadingScene'
  | 'MusicScene'
  | 'ThinkingScene'
  | 'SleepingScene';

export interface ScenePropsState {
  flame: boolean;
  steam: boolean;
  microphone: boolean;
  book: boolean;
  musicNotes: boolean;
  spoonStirring: boolean;
  potCooking: boolean;
  speaker: boolean;
  thoughtCloud: boolean;
}

export interface AnimationEventLogEntry {
  id: string;
  timestamp: string;
  message: string;
  category: 'EMOTION' | 'ACTIVITY' | 'SCENE' | 'PROP' | 'ARM' | 'GAME' | 'PRIORITY' | 'SYSTEM';
}

export interface ArmState {
  leftAngle: number;    // -90 to +90 deg (0 = resting at side)
  rightAngle: number;   // -90 to +90 deg (0 = resting at side)
  leftHand: 'OPEN' | 'FIST' | 'POINT' | 'THUMBS_UP';
  rightHand: 'OPEN' | 'FIST' | 'POINT' | 'THUMBS_UP';
  activeGesture: ArmGesture;
  isMoving: boolean;
  hardwareAttached: boolean;
}

export type PresenceState =
  | 'NO_PERSON'
  | 'PERSON_DETECTED'
  | 'PERSON_NEAR'
  | 'PERSON_LEFT';

export type PresenceSensorType =
  | 'NONE'
  | 'MOCK'
  | 'PIR'
  | 'ULTRASONIC'
  | 'TOF'
  | 'IR_PROXIMITY'
  | 'AUDIO_ACTIVITY';

export interface PresenceInfo {
  state: PresenceState;
  sensorType: PresenceSensorType;
  distanceCm: number;
  lastDetectionTime: number;
  lastGreetingTime: number;
  greetingCooldownMs: number;
  hasHardwareSensor: boolean;
  audioActivityDetected: boolean;
}

export type MusicCommand =
  | 'PLAY'
  | 'PAUSE'
  | 'STOP'
  | 'NEXT'
  | 'PREVIOUS'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN';

export interface MusicState {
  isPlaying: boolean;
  trackTitle: string;
  artist: string;
  volume: number;
  positionSec: number;
  durationSec: number;
  mode: 'cloud_stream' | 'phone_bridge' | 'synth_chime' | 'mock';
}

export interface AutonomyConfig {
  enabled: boolean;
  idleFrequencySeconds: number; // e.g. 20-60s
  greetingEnabled: boolean;
  greetingCooldownMinutes: number; // 5-15 min
  voiceEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
}

export interface EmotionProfile {
  emotion: RobotEmotion;
  intensity: number; // 0.0 to 1.0
  durationMs: number;
  eyeShape: string;
  pupilDilation: number; // 0.4 to 1.6
  mouthShape: MouthShape;
  voicePitch: number; // 0.8 to 1.3
  voiceRate: number;  // 0.8 to 1.3
  suggestedArmGesture: ArmGesture;
  // Visual nuances
  eyebrowTilt?: number;
  eyebrowOffset?: number;
  blush?: boolean;
  eyeBlinkPattern?: EyeBlinkPattern;
  particles?: 'hearts' | 'stars' | 'sweat' | 'tears' | 'notes' | 'zzz' | 'sparks' | 'none';
  headTilt?: number;
  gazeOffset?: { x: number; y: number };
}

export interface ActionTimelineStep {
  offsetMs: number;
  subsystem: 'face' | 'mouth' | 'arm' | 'voice' | 'audio' | 'led' | 'prop';
  action: string;
  payload?: any;
  durationMs?: number;
}

export interface ActionTimeline {
  name: RobotActionName | string;
  durationMs: number;
  steps: ActionTimelineStep[];
}

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
  providerType: 'openai' | 'gemini' | 'deepseek' | 'local_ollama' | 'custom';
  endpoint: string;
  apiKey: string;
  hasKey: boolean;
  allowCustom?: boolean;
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
  | 'behavior'
  | 'games'
  | 'debug'
  | 'wifi'
  | 'brain'
  | 'voice'
  | 'personality'
  | 'memory'
  | 'face'
  | 'hardware'
  | 'cloud'
  | 'system'
  | 'ota'
  | 'security';

export type AppMode = 'production' | 'simulation';

export interface AuthSession {
  authenticated: boolean;
  token: string | null;
  expiresIn: number;
  isFirstBoot: boolean;
  lockedOut?: boolean;
  lockoutRemaining?: number;
}

export interface SecurityLogEntry {
  event: string;
  timestamp: number;
  ip: string;
  details: string;
}

export interface SecurityTestResult {
  id: number;
  name: string;
  description: string;
  expected: string;
  actual: string;
  status: 'pending' | 'running' | 'pass' | 'fail';
  detail?: string;
}

export interface SimulationState {
  enabled: boolean;
  simulatedState: RobotState;
  simulatedEmotion: RobotEmotion;
  lastSimulatedSpeechInput: string;
  lastSimulatedReply: string;
  simulatedBatteryMv: number;
  mockDisplayFrames: number;
  simulatedWiFiConnected: boolean;
}

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
