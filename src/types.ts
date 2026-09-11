/**
 * TARA - AI Desktop Companion Shared Types
 */

export type TaraEmotion =
  | 'happy'
  | 'neutral'
  | 'excited'
  | 'curious'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'confused'
  | 'surprised'
  | 'shy'
  | 'proud'
  | 'bored'
  | 'playful'
  | 'scared'
  | 'worried'
  | 'focused';

export type TaraExpression =
  | 'happy'
  | 'big_smile'
  | 'laughing'
  | 'giggling'
  | 'excited'
  | 'curious'
  | 'confused'
  | 'surprised'
  | 'sad'
  | 'angry'
  | 'sleepy'
  | 'deep_sleep'
  | 'shy'
  | 'embarrassed'
  | 'blushing'
  | 'scared'
  | 'worried'
  | 'suspicious'
  | 'dizzy'
  | 'focused'
  | 'thinking'
  | 'amazed'
  | 'proud'
  | 'bored'
  | 'playful'
  | 'teasing'
  | 'wink'
  | 'listening'
  | 'speaking'
  | 'singing'
  | 'celebrating'
  | 'disappointed'
  | 'frustrated'
  | 'tired'
  | 'neutral';

export type TaraMouthState =
  | 'CLOSED'
  | 'SMALL'
  | 'SMILE'
  | 'OPEN_SMALL'
  | 'OPEN_MEDIUM'
  | 'OPEN_WIDE'
  | 'O_SHAPE'
  | 'A_SHAPE'
  | 'E_SHAPE'
  | 'SPEAKING'
  | 'LAUGHING'
  | 'SINGING';

export type TaraEyeState =
  | 'normal'
  | 'blink'
  | 'open'
  | 'look_left'
  | 'look_right'
  | 'look_down'
  | 'look_up'
  | 'squint'
  | 'wide'
  | 'wink'
  | 'closed'
  | 'half_closed'
  | 'dizzy_spiral'
  | 'hearts'
  | 'tears'
  | 'sparkle'
  | 'sleepy_eyes';

export type TaraArmGesture =
  | 'IDLE'
  | 'WAVE'
  | 'GREETING'
  | 'POINT_LEFT'
  | 'POINT_RIGHT'
  | 'POINT_UP'
  | 'POINT'
  | 'THUMBS_UP'
  | 'CLAP'
  | 'OPEN_HAND'
  | 'CLOSE_HAND'
  | 'HOLD_MIC'
  | 'HOLD_BOOK'
  | 'STIR'
  | 'CELEBRATE'
  | 'THINKING'
  | 'LISTENING'
  | 'PLAYING'
  | 'RAISE_HAND';

export type TaraHandShape =
  | 'open_5_fingers'
  | 'fist'
  | 'thumbs_up'
  | 'point_up'
  | 'point_side'
  | 'grip'
  | 'pinch'
  | 'wave'
  | 'clap'
  | 'scissors'
  | 'open'
  | 'point';

export type TaraGameType =
  | 'NONE'
  | 'TIC_TAC_TOE'
  | 'ROCK_PAPER_SCISSORS'
  | 'MEMORY_MATCH'
  | 'GUESS_NUMBER'
  | 'HIGHER_LOWER'
  | 'CONNECT_FOUR'
  | 'PATTERN_MEMORY'
  | 'REACTION'
  | 'SIMON_SAYS'
  | 'DICE_GAME'
  | 'QUICK_REACTION'
  | 'TRIVIA';

export type GameVoiceState =
  | 'GAME_IDLE'
  | 'GAME_STARTING'
  | 'GAME_ASKING'
  | 'GAME_LISTENING'
  | 'GAME_PROCESSING'
  | 'GAME_INVALID_INPUT'
  | 'GAME_ACTION_ACCEPTED'
  | 'GAME_TURN_TARA'
  | 'GAME_TURN_PLAYER'
  | 'GAME_RESULT'
  | 'GAME_FINISHED';

export type TaraActivity =
  | 'IDLE'
  | 'SINGING'
  | 'COOKING'
  | 'READING'
  | 'MUSIC'
  | 'SLEEPING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'GAMING'
  | 'THINKING'
  | 'OBSERVING'
  | 'RELAXING'
  | 'DANCING'
  | 'LEARNING'
  | 'CHECKING_TIME'
  | 'GREETING';

export type VoiceState =
  | 'VOICE_IDLE'
  | 'VOICE_STARTING'
  | 'VOICE_SPEAKING'
  | 'VOICE_PAUSE'
  | 'VOICE_ENDING';

export type VoiceQueueState =
  | 'IDLE'
  | 'QUEUED'
  | 'PLAYING'
  | 'PAUSED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'FAILED';

export type TaraProp =
  | 'NONE'
  | 'MICROPHONE'
  | 'COOKING_POT'
  | 'STOVE'
  | 'UTENSIL'
  | 'BOOK'
  | 'HEADPHONES'
  | 'MUSIC_NOTES'
  | 'ZZZ';

export interface QueuedVoiceItem {
  id: string;
  text: string;
  emotion?: TaraEmotion;
  expression?: TaraExpression;
  priority?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

export interface ArmJoints {
  shoulderAngle: number; // degrees
  elbowAngle: number;    // degrees
  handAngle: number;     // degrees
  x: number;             // display coords
  y: number;
  openFingers: boolean;
  holdingProp: TaraProp;
}

export interface ExpressionConfig {
  name: TaraExpression;
  label: string;
  eyeState: TaraEyeState;
  mouthState: TaraMouthState;
  pupilOffsetX: number; // -1 to 1
  pupilOffsetY: number; // -1 to 1
  pupilScale: number;   // 0.5 to 1.5
  eyebrowAngle: number; // -30 to 30
  eyebrowOffset: number; // vertical shift
  blush: boolean;
  blushIntensity: number; // 0 to 1
  sweatDrop?: boolean;
  sparkle?: boolean;
  tears?: boolean;
  hearts?: boolean;
  dizzySpiral?: boolean;
  eyelidCurve: number; // -1 (sad) to 1 (happy arc)
  description: string;
}

export interface CookingSceneState {
  stage:
    | 'COOKING_START'
    | 'STOVE_ON'
    | 'FLAME_ON'
    | 'POT_APPEAR'
    | 'STEAM_START'
    | 'STIR'
    | 'CHECK_FOOD'
    | 'STEAM_CONTINUE'
    | 'HAPPY_FOCUSED'
    | 'COOKING_COMPLETE';
  flameFrame: number;
  steamParticles: { id: number; x: number; y: number; opacity: number; size: number }[];
  stirAngle: number;
  burnerHeat: number;
}

export interface SingingSceneState {
  stage: 'IDLE' | 'PREPARE_SINGING' | 'MICROPHONE_APPEAR' | 'SINGING' | 'ENDING';
  micHeight: number; // 0 to 1
  notes: { id: number; x: number; y: number; opacity: number; symbol: string }[];
  rhythmBeat: number;
  micWobble: number;
}

export interface ReadingSceneState {
  bookOpenAngle: number;
  pageFlip: number;
  readingLine: number;
}

export interface MusicSceneState {
  bars: number[];
  notes: { id: number; x: number; y: number; opacity: number }[];
  headphonePulse: number;
}

export interface SleepingSceneState {
  zzzParticles: { id: number; x: number; y: number; scale: number; opacity: number }[];
  breathCycle: number;
}

export interface ThinkingSceneState {
  bubblePulse: number;
  stage: 'CONSIDERING' | 'PONDERING' | 'EVALUATING' | 'EUREKA';
  thoughtTopic: string;
}

export interface ObservingSceneState {
  lookAngle: number;
  saccadeProgress: number;
  observedTarget: string;
}

export interface DancingSceneState {
  rhythmBeat: number;
  bounceOffset: number;
  energyLevel: number;
}

export interface LearningSceneState {
  scanLineY: number;
  dataProgress: number;
  subject: string;
}

export interface CheckingTimeSceneState {
  clockVisible: boolean;
  timeString: string;
}

export interface TaraPersonality {
  cheerfulness: number; // 0 - 100
  curiosity: number;
  sassiness: number;
  energy: number;
  empathy: number;
}

export type TaraMood =
  | 'cheerful'
  | 'playful'
  | 'curious'
  | 'shy'
  | 'thoughtful'
  | 'mischievous'
  | 'excited'
  | 'caring'
  | 'sleepy'
  | 'focused'
  | 'clumsy';

export interface TaraPersonalityTraits {
  friendly: number;       // 0 - 100 (Default: 90)
  playful: number;        // 0 - 100 (Default: 80)
  curious: number;        // 0 - 100 (Default: 85)
  slightlyShy: number;    // 0 - 100 (Default: 75)
  mischievous: number;    // 0 - 100 (Default: 45)
  helpful: number;        // 0 - 100 (Default: 95)
  expressive: number;     // 0 - 100 (Default: 90)
  thoughtful: number;     // 0 - 100 (Default: 80)
  excited: number;        // 0 - 100 (Default: 85)
  clumsyFunny: number;    // 0 - 100 (Default: 35)
  caring: number;         // 0 - 100 (Default: 95)
}

export type ShyReactionStage =
  | 'INACTIVE'
  | 'GLANCE_AWAY'
  | 'FLUTTER_BLINK'
  | 'BLUSH_INTENSIFY'
  | 'SWEET_SMILE'
  | 'FIDGET_ARM'
  | 'BASHFUL_SPEECH'
  | 'WARM_RECOVERY';

export type ActionStatus =
  | 'IDLE'
  | 'STARTED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export interface CompanionAction {
  id: string;
  name: string;
  type: 'HARDWARE' | 'ANIMATION' | 'VOICE' | 'MUSIC' | 'SEARCH' | 'TIME' | 'GAME' | 'SYSTEM';
  status: ActionStatus;
  progress: number; // 0 - 100
  startedAt: number;
  completedAt?: number;
  summary: string;
  isHardwareVerified: boolean;
  error?: string;
}

export interface PersonalityMemoryItem {
  id: string;
  category: 'preference' | 'activity' | 'topic' | 'habit' | 'stat' | 'compliment';
  key: string;
  value: string;
  confidence: number;
  lastUpdatedMs: number;
  sanitized: boolean;
}

export type MusicPlaybackState =
  | 'IDLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'STOPPED'
  | 'BUFFERING';

export interface TrackInfo {
  id: string;
  title: string;
  artist: string;
  duration: number;
  genre: string;
}

export interface TimeManagerConfig {
  ntpServer: string;
  synced: boolean;
  offsetMs: number;
  lastSyncTime: number;
  timezone: string;
  use24Hour: boolean;
  activeTimers: CompanionTimer[];
}

export interface CompanionTimer {
  id: string;
  label: string;
  totalSec: number;
  remainingSec: number;
  active: boolean;
}

export interface SearchResult {
  query: string;
  title: string;
  summary: string;
  source: 'google_web' | 'gemini_grounding' | 'companion_kb';
  verified: boolean;
  timestamp: string;
}

export interface PresenceState {
  detected: boolean;
  distanceCm: number;
  motionScore: number;
  lastDetectedMs: number;
}

export interface OledDisplayConfig {
  palette: 'cyan' | 'amber' | 'white' | 'green';
  scanlines: boolean;
  glow: boolean;
  pixelGrid: boolean;
  fps: number;
}

export interface AutonomousLifeConfig {
  enabled: boolean;
  minIdleTime: number; // in seconds before considering next autonomous activity
  maxIdleTime: number; // in seconds
  minActivityDuration: number; // in seconds
  maxActivityDuration: number; // in seconds
  activityCooldown: number; // in seconds before same activity can repeat
  sleepStart: string; // "23:00"
  sleepEnd: string; // "07:00"
  allowMusic: boolean;
  allowGames: boolean;
  allowSinging: boolean;
  allowCooking: boolean;
  allowReading: boolean;
  allowDancing: boolean;
  allowThinking: boolean;
  allowObserving: boolean;
  allowRelaxing: boolean;
  allowLearning: boolean;
}

export type AutonomousPriority =
  | 'SYSTEM_ERROR'
  | 'USER_INTERACTION'
  | 'LISTENING'
  | 'USER_RESPONSE'
  | 'USER_REQUESTED_ACTIVITY'
  | 'AUTONOMOUS_ACTIVITY'
  | 'REST_IDLE';

export type ActivityExecutionState =
  | 'IDLE'
  | 'STARTING'
  | 'RUNNING'
  | 'PAUSED'
  | 'STOPPING'
  | 'COMPLETED';

export interface ActivityHistoryItem {
  id: string;
  activity: TaraActivity;
  startTime: number;
  endTime?: number;
  durationSec: number;
  reason: string;
  personalityState: string;
  interrupted: boolean;
  interruptedBy?: string;
}

export interface AutonomousCandidate {
  activity: TaraActivity;
  score: number;
  reason: string;
  recommendedDuration: number;
}

export interface AutonomousStatus {
  enabled: boolean;
  currentPriority: AutonomousPriority;
  executionState: ActivityExecutionState;
  currentActivity: TaraActivity;
  previousActivity: TaraActivity;
  nextCandidate: AutonomousCandidate | null;
  idleDurationSec: number;
  activityDurationSec: number;
  remainingDurationSec: number;
  selectionReason: string;
  isSleeping: boolean;
  personalityMood: string;
  userPresent: boolean;
  lastUserInteractionSecAgo: number;
}
