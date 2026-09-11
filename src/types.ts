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
  | 'REACTION'
  | 'SIMON_SAYS'
  | 'TRIVIA';

export type TaraActivity =
  | 'IDLE'
  | 'SINGING'
  | 'COOKING'
  | 'READING'
  | 'MUSIC'
  | 'SLEEPING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'GAMING';

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

export interface TaraPersonality {
  cheerfulness: number; // 0 - 100
  curiosity: number;
  sassiness: number;
  energy: number;
  empathy: number;
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
