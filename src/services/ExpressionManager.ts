import {
  RobotEmotion,
  EmotionProfile,
  MouthShape,
  EyeBlinkPattern,
  ActivityPriority,
} from '../types';

export interface VisualExpression {
  emotion: RobotEmotion;
  eyeShape: string;
  leftEyeWidth: number;
  leftEyeHeight: number;
  rightEyeWidth: number;
  rightEyeHeight: number;
  pupilDilation: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  blinkPattern: EyeBlinkPattern;
  squintRatio: number;
  eyebrowTiltLeft: number;
  eyebrowTiltRight: number;
  eyebrowOffsetLeft: number;
  eyebrowOffsetRight: number;
  mouthShape: MouthShape;
  mouthWidth: number;
  mouthHeight: number;
  mouthYOffset: number;
  headTilt: number;     // -0.15 to +0.15 rad
  headBounce: number;   // 0 to 4 px
  headSway: number;     // -4 to +4 px
  cheeksBlush: boolean;
  particles: 'hearts' | 'stars' | 'sweat' | 'tears' | 'notes' | 'zzz' | 'sparks' | 'none';
  voicePitch: number;
  voiceRate: number;
}

export interface LayerState {
  baseFace: { eyeShape: string; mouthShape: MouthShape };
  emotionLayer: { emotion: RobotEmotion; intensity: number };
  activityLayer?: { activityName: string; expressionOverride?: RobotEmotion };
  speakingListeningLayer?: { state: 'SPEAKING' | 'LISTENING' | 'IDLE'; mouthModulation?: number };
  temporaryEffectLayer?: { emotion: RobotEmotion; expiresAt: number; durationMs: number };
}

export class ExpressionManager {
  private baseEmotion: RobotEmotion = 'NEUTRAL';
  private currentIntensity: number = 0.85;
  private temporaryExpression: { emotion: RobotEmotion; expiresAt: number; durationMs: number } | null = null;
  private tempTimer: any = null;

  // Listeners for expression state changes
  private listeners: ((emotion: RobotEmotion, isTemp: boolean) => void)[] = [];

  // Complete registry of all 45+ expressions
  private static readonly PROFILES: Record<string, Omit<EmotionProfile, 'emotion' | 'intensity' | 'durationMs'>> = {
    // 1. NEUTRAL
    NEUTRAL: {
      eyeShape: 'normal',
      pupilDilation: 1.0,
      mouthShape: 'MOUTH_CLOSED',
      voicePitch: 1.0,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0,
      eyebrowOffset: 0,
      blush: false,
      eyeBlinkPattern: 'NORMAL',
      particles: 'none',
      headTilt: 0,
    },
    // 2. HAPPY
    HAPPY: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.15,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.15,
      voiceRate: 1.05,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.1,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'none',
      headTilt: 0.04,
    },
    // 3. EXCITED
    EXCITED: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.35,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.25,
      voiceRate: 1.18,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.2,
      eyebrowOffset: -4,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: -0.06,
    },
    // 4. CURIOUS
    CURIOUS: {
      eyeShape: 'curious_tilt',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.1,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: 0.25,
      eyebrowOffset: -3,
      blush: false,
      eyeBlinkPattern: 'NORMAL',
      particles: 'none',
      headTilt: 0.12,
    },
    // 5. CONFUSED
    CONFUSED: {
      eyeShape: 'confused_asym',
      pupilDilation: 0.9,
      mouthShape: 'thinking_pucker',
      voicePitch: 0.95,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.22,
      eyebrowOffset: 3,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: -0.1,
    },
    // 6. SURPRISED
    SURPRISED: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.45,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.25,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.28,
      eyebrowOffset: -5,
      blush: false,
      eyeBlinkPattern: 'NONE',
      particles: 'sparks',
      headTilt: 0,
    },
    // 7. SAD
    SAD: {
      eyeShape: 'sad_droop',
      pupilDilation: 0.8,
      mouthShape: 'sad_frown',
      voicePitch: 0.85,
      voiceRate: 0.85,
      suggestedArmGesture: 'ARM_SAD_MOVE',
      eyebrowTilt: -0.25,
      eyebrowOffset: 3,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'tears',
      headTilt: -0.05,
    },
    // 8. ANGRY
    ANGRY: {
      eyeShape: 'angry',
      pupilDilation: 0.7,
      mouthShape: 'worried_wiggle',
      voicePitch: 0.9,
      voiceRate: 1.15,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.35,
      eyebrowOffset: 4,
      blush: false,
      eyeBlinkPattern: 'FAST',
      particles: 'none',
      headTilt: 0,
    },
    // 9. SLEEPY
    SLEEPY: {
      eyeShape: 'sleep_arc',
      pupilDilation: 0.6,
      mouthShape: 'MOUTH_SMALL',
      voicePitch: 0.8,
      voiceRate: 0.8,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'zzz',
      headTilt: 0.08,
    },
    // 10. FOND / LOVE
    FOND: {
      eyeShape: 'love_hearts',
      pupilDilation: 1.25,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.12,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.1,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'hearts',
      headTilt: 0.06,
    },
    LOVE: {
      eyeShape: 'love_hearts',
      pupilDilation: 1.3,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.15,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.12,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'hearts',
      headTilt: 0.08,
    },
    // 11. PLAYFUL
    PLAYFUL: {
      eyeShape: 'squint',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.2,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_WAVE',
      eyebrowTilt: 0.15,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: -0.09,
    },
    // 12. WORRIED
    WORRIED: {
      eyeShape: 'worried',
      pupilDilation: 1.1,
      mouthShape: 'pout',
      voicePitch: 1.05,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.2,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'FAST',
      particles: 'sweat',
      headTilt: 0.03,
    },
    // 13. PROUD
    PROUD: {
      eyeShape: 'proud',
      pupilDilation: 1.05,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.12,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_THUMBS_UP',
      eyebrowTilt: 0.15,
      eyebrowOffset: -3,
      blush: false,
      eyeBlinkPattern: 'NORMAL',
      particles: 'sparks',
      headTilt: -0.05,
    },
    // 14. BORED
    BORED: {
      eyeShape: 'squint',
      pupilDilation: 0.75,
      mouthShape: 'MOUTH_CLOSED',
      voicePitch: 0.9,
      voiceRate: 0.85,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.05,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.08,
    },

    // EXTENDED EXPRESSIONS REQUESTED
    LAUGHING: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.25,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.3,
      voiceRate: 1.2,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.2,
      eyebrowOffset: -4,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: 0.05,
    },
    GIGGLING: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.15,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.25,
      voiceRate: 1.15,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.15,
      eyebrowOffset: -3,
      blush: true,
      eyeBlinkPattern: 'DOUBLE',
      particles: 'notes',
      headTilt: -0.07,
    },
    SMILING: {
      eyeShape: 'normal',
      pupilDilation: 1.1,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.08,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0.08,
      eyebrowOffset: -1,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'none',
      headTilt: 0.03,
    },
    BIG_SMILE: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.15,
      voiceRate: 1.05,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.18,
      eyebrowOffset: -3,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'sparks',
      headTilt: 0.05,
    },
    BLUSHING: {
      eyeShape: 'squint',
      pupilDilation: 1.1,
      mouthShape: 'MOUTH_SMALL',
      voicePitch: 1.05,
      voiceRate: 0.92,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: 0.1,
      eyebrowOffset: -1,
      blush: true,
      eyeBlinkPattern: 'SLOW',
      particles: 'hearts',
      headTilt: -0.08,
    },
    SHY: {
      eyeShape: 'sad_droop',
      pupilDilation: 0.95,
      mouthShape: 'MOUTH_SMALL',
      voicePitch: 0.95,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.1,
      eyebrowOffset: 1,
      blush: true,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.1,
    },
    EMBARRASSED: {
      eyeShape: 'confused_asym',
      pupilDilation: 1.1,
      mouthShape: 'worried_wiggle',
      voicePitch: 1.05,
      voiceRate: 1.05,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.15,
      eyebrowOffset: 2,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sweat',
      headTilt: -0.06,
    },
    LOVE_HEART: {
      eyeShape: 'love_hearts',
      pupilDilation: 1.35,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.2,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.15,
      eyebrowOffset: -3,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'hearts',
      headTilt: 0.08,
    },
    SUSPICIOUS: {
      eyeShape: 'suspicious',
      pupilDilation: 0.85,
      mouthShape: 'thinking_pucker',
      voicePitch: 0.92,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.28,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: -0.09,
    },
    SCARED: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.45,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.3,
      voiceRate: 1.25,
      suggestedArmGesture: 'ARM_SAD_MOVE',
      eyebrowTilt: -0.3,
      eyebrowOffset: -4,
      blush: false,
      eyeBlinkPattern: 'FAST',
      particles: 'sweat',
      headTilt: 0,
    },
    DIZZY: {
      eyeShape: 'dizzy_spiral',
      pupilDilation: 0.9,
      mouthShape: 'worried_wiggle',
      voicePitch: 0.9,
      voiceRate: 0.8,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0,
      eyebrowOffset: 1,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'stars',
      headTilt: 0.12,
    },
    FRUSTRATED: {
      eyeShape: 'angry',
      pupilDilation: 0.8,
      mouthShape: 'pout',
      voicePitch: 1.05,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.32,
      eyebrowOffset: 3,
      blush: false,
      eyeBlinkPattern: 'FAST',
      particles: 'none',
      headTilt: -0.05,
    },
    TIRED: {
      eyeShape: 'sleep_arc',
      pupilDilation: 0.7,
      mouthShape: 'MOUTH_SMALL',
      voicePitch: 0.85,
      voiceRate: 0.82,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.1,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'zzz',
      headTilt: 0.08,
    },
    FOCUSED: {
      eyeShape: 'focused',
      pupilDilation: 1.05,
      mouthShape: 'MOUTH_CLOSED',
      voicePitch: 1.0,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.15,
      eyebrowOffset: 1,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.02,
    },
    CONCENTRATED: {
      eyeShape: 'focused',
      pupilDilation: 1.1,
      mouthShape: 'thinking_pucker',
      voicePitch: 1.0,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.2,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: -0.04,
    },
    DREAMING: {
      eyeShape: 'sleep_arc',
      pupilDilation: 0.9,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 0.95,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0.1,
      eyebrowOffset: -1,
      blush: true,
      eyeBlinkPattern: 'SLOW',
      particles: 'stars',
      headTilt: 0.1,
    },
    AMAZED: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.5,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.25,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.25,
      eyebrowOffset: -5,
      blush: true,
      eyeBlinkPattern: 'NONE',
      particles: 'sparks',
      headTilt: 0,
    },
    CELEBRATING: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.3,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.3,
      voiceRate: 1.2,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.22,
      eyebrowOffset: -4,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: 0.06,
    },
    DISAPPOINTED: {
      eyeShape: 'sad_droop',
      pupilDilation: 0.85,
      mouthShape: 'sad_frown',
      voicePitch: 0.88,
      voiceRate: 0.85,
      suggestedArmGesture: 'ARM_SAD_MOVE',
      eyebrowTilt: -0.2,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: -0.07,
    },
    EVIL_PLAYFUL: {
      eyeShape: 'angry',
      pupilDilation: 1.15,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.15,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_WAVE',
      eyebrowTilt: -0.28,
      eyebrowOffset: 3,
      blush: false,
      eyeBlinkPattern: 'NORMAL',
      particles: 'sparks',
      headTilt: 0.08,
    },
    SLEEP_DEEP: {
      eyeShape: 'sleep_arc',
      pupilDilation: 0.5,
      mouthShape: 'MOUTH_CLOSED',
      voicePitch: 0.75,
      voiceRate: 0.75,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0,
      eyebrowOffset: 3,
      blush: false,
      eyeBlinkPattern: 'SLEEP',
      particles: 'zzz',
      headTilt: 0.12,
    },
    WINK: {
      eyeShape: 'wink',
      pupilDilation: 1.15,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.15,
      voiceRate: 1.05,
      suggestedArmGesture: 'ARM_THUMBS_UP',
      eyebrowTilt: 0.15,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'WINK',
      particles: 'sparks',
      headTilt: -0.08,
    },
    EYE_ROLL: {
      eyeShape: 'eye_roll',
      pupilDilation: 0.9,
      mouthShape: 'thinking_pucker',
      voicePitch: 0.95,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: -0.1,
      eyebrowOffset: 1,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.07,
    },
    TEASING: {
      eyeShape: 'wink',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.2,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_WAVE',
      eyebrowTilt: 0.18,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'notes',
      headTilt: 0.09,
    },
    LISTENING: {
      eyeShape: 'normal',
      pupilDilation: 1.15,
      mouthShape: 'MOUTH_CLOSED',
      voicePitch: 1.0,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_IDLE',
      eyebrowTilt: 0.1,
      eyebrowOffset: -2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.05,
    },
    SPEAKING: {
      eyeShape: 'normal',
      pupilDilation: 1.1,
      mouthShape: 'talking',
      voicePitch: 1.05,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_GREETING',
      eyebrowTilt: 0.1,
      eyebrowOffset: -1,
      blush: false,
      eyeBlinkPattern: 'NORMAL',
      particles: 'none',
      headTilt: 0.02,
    },
    THINKING_HARD: {
      eyeShape: 'curious_tilt',
      pupilDilation: 1.25,
      mouthShape: 'thinking_pucker',
      voicePitch: 1.0,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: 0.22,
      eyebrowOffset: -3,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'sparks',
      headTilt: -0.12,
    },

    // GAME TEMPORARY REACTION EXPRESSIONS
    GAME_THINKING: {
      eyeShape: 'curious_tilt',
      pupilDilation: 1.2,
      mouthShape: 'thinking_pucker',
      voicePitch: 1.0,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: 0.2,
      eyebrowOffset: -2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: 0.08,
    },
    GAME_SURPRISED: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.4,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.25,
      voiceRate: 1.15,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.25,
      eyebrowOffset: -4,
      blush: false,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: -0.06,
    },
    GAME_HAPPY: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.25,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.2,
      voiceRate: 1.1,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
      eyebrowTilt: 0.18,
      eyebrowOffset: -3,
      blush: true,
      eyeBlinkPattern: 'NORMAL',
      particles: 'sparks',
      headTilt: 0.05,
    },
    GAME_SAD: {
      eyeShape: 'sad_droop',
      pupilDilation: 0.85,
      mouthShape: 'sad_frown',
      voicePitch: 0.85,
      voiceRate: 0.85,
      suggestedArmGesture: 'ARM_SAD_MOVE',
      eyebrowTilt: -0.22,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'tears',
      headTilt: -0.06,
    },
    GAME_CELEBRATE: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.35,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.3,
      voiceRate: 1.2,
      suggestedArmGesture: 'ARM_CELEBRATE',
      eyebrowTilt: 0.25,
      eyebrowOffset: -5,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'sparks',
      headTilt: 0.07,
    },
    GAME_CONFUSED: {
      eyeShape: 'confused_asym',
      pupilDilation: 0.95,
      mouthShape: 'thinking_pucker',
      voicePitch: 0.95,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
      eyebrowTilt: -0.2,
      eyebrowOffset: 2,
      blush: false,
      eyeBlinkPattern: 'SLOW',
      particles: 'none',
      headTilt: -0.08,
    },
    GAME_TAUNT_PLAYFUL: {
      eyeShape: 'wink',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.2,
      voiceRate: 1.15,
      suggestedArmGesture: 'ARM_WAVE',
      eyebrowTilt: 0.18,
      eyebrowOffset: -2,
      blush: true,
      eyeBlinkPattern: 'FAST',
      particles: 'notes',
      headTilt: 0.09,
    },

    // Legacy Aliases
    CALM: {
      eyeShape: 'normal',
      pupilDilation: 1.0,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 1.0,
      voiceRate: 1.0,
      suggestedArmGesture: 'ARM_IDLE',
    },
    JOY: {
      eyeShape: 'happy_arc',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.15,
      voiceRate: 1.05,
      suggestedArmGesture: 'ARM_HAPPY_MOVE',
    },
    CURIOSITY: {
      eyeShape: 'curious_tilt',
      pupilDilation: 1.2,
      mouthShape: 'MOUTH_O',
      voicePitch: 1.1,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_THINK',
    },
    EXCITEMENT: {
      eyeShape: 'wide_surprised',
      pupilDilation: 1.3,
      mouthShape: 'MOUTH_WIDE',
      voicePitch: 1.25,
      voiceRate: 1.15,
      suggestedArmGesture: 'ARM_CELEBRATE',
    },
    EMPATHY: {
      eyeShape: 'normal',
      pupilDilation: 1.05,
      mouthShape: 'MOUTH_SMILE',
      voicePitch: 0.95,
      voiceRate: 0.95,
      suggestedArmGesture: 'ARM_IDLE',
    },
    DROWSY: {
      eyeShape: 'sleep_arc',
      pupilDilation: 0.65,
      mouthShape: 'MOUTH_SMALL',
      voicePitch: 0.85,
      voiceRate: 0.85,
      suggestedArmGesture: 'ARM_IDLE',
    },
    CONCERN: {
      eyeShape: 'worried',
      pupilDilation: 1.05,
      mouthShape: 'pout',
      voicePitch: 1.0,
      voiceRate: 0.9,
      suggestedArmGesture: 'ARM_THINK',
    },
  };

  /**
   * Set the primary base emotion (persists across activities/idle)
   */
  public setBaseEmotion(emotion: RobotEmotion, intensity: number = 0.85) {
    this.baseEmotion = emotion;
    this.currentIntensity = Math.max(0.1, Math.min(1.0, intensity));
    this.notify(this.getCurrentEffectiveEmotion(), false);
  }

  public getBaseEmotion(): RobotEmotion {
    return this.baseEmotion;
  }

  /**
   * Push a temporary reaction expression with controlled duration (e.g. game win, surprise, touch)
   * Automatically returns to base emotion without permanently destroying the lower layer.
   */
  public pushTemporaryExpression(emotion: RobotEmotion, durationMs: number = 2500) {
    if (this.tempTimer) {
      clearTimeout(this.tempTimer);
      this.tempTimer = null;
    }

    const expiresAt = Date.now() + durationMs;
    this.temporaryExpression = { emotion, expiresAt, durationMs };
    this.notify(emotion, true);

    this.tempTimer = setTimeout(() => {
      this.temporaryExpression = null;
      this.tempTimer = null;
      this.notify(this.baseEmotion, false);
    }, durationMs);
  }

  /**
   * Clear any active temporary expression immediately
   */
  public clearTemporaryExpression() {
    if (this.tempTimer) {
      clearTimeout(this.tempTimer);
      this.tempTimer = null;
    }
    this.temporaryExpression = null;
    this.notify(this.baseEmotion, false);
  }

  /**
   * Returns current visible emotion taking temporary overlay into account
   */
  public getCurrentEffectiveEmotion(): RobotEmotion {
    if (this.temporaryExpression && Date.now() < this.temporaryExpression.expiresAt) {
      return this.temporaryExpression.emotion;
    }
    return this.baseEmotion;
  }

  public isTemporaryActive(): boolean {
    return !!this.temporaryExpression && Date.now() < this.temporaryExpression.expiresAt;
  }

  /**
   * Get full visual geometry & parametric profile for any emotion
   */
  public getProfile(emotion?: RobotEmotion): EmotionProfile {
    const target = emotion || this.getCurrentEffectiveEmotion();
    const base = ExpressionManager.PROFILES[target] || ExpressionManager.PROFILES['NEUTRAL'];
    return {
      emotion: target,
      intensity: this.currentIntensity,
      durationMs: 0,
      ...base,
    };
  }

  /**
   * Converts the emotion into a full parameterized visual expression
   */
  public computeVisualExpression(emotion?: RobotEmotion): VisualExpression {
    const profile = this.getProfile(emotion);
    const eyeShape = profile.eyeShape || 'normal';

    let leftW = 28;
    let leftH = 34;
    let rightW = 28;
    let rightH = 34;
    let mouthW = 26;
    let mouthH = 4;
    let mouthYOff = 0;
    let squint = 0;
    let gazeX = profile.gazeOffset?.x || 0;
    let gazeY = profile.gazeOffset?.y || 0;

    switch (eyeShape) {
      case 'wide_surprised':
        leftW = 32; leftH = 44;
        rightW = 32; rightH = 44;
        break;
      case 'happy_arc':
        leftW = 28; leftH = 14;
        rightW = 28; rightH = 14;
        break;
      case 'sleep_arc':
        leftW = 26; leftH = 12;
        rightW = 26; rightH = 12;
        squint = 1.0;
        break;
      case 'squint':
        leftW = 26; leftH = 18;
        rightW = 26; rightH = 18;
        squint = 0.6;
        break;
      case 'curious_tilt':
        leftW = 30; leftH = 36;
        rightW = 28; rightH = 32;
        gazeY = -4;
        break;
      case 'confused_asym':
        leftW = 32; leftH = 38;
        rightW = 24; rightH = 26;
        gazeX = -3;
        break;
      case 'suspicious':
        leftW = 28; leftH = 14;
        rightW = 28; rightH = 14;
        squint = 0.7;
        gazeX = -5;
        break;
      case 'focused':
        leftW = 27; leftH = 28;
        rightW = 27; rightH = 28;
        squint = 0.3;
        break;
      case 'love_hearts':
        leftW = 30; leftH = 30;
        rightW = 30; rightH = 30;
        break;
      case 'dizzy_spiral':
        leftW = 28; leftH = 28;
        rightW = 28; rightH = 28;
        break;
      case 'eye_roll':
        gazeY = -8;
        break;
    }

    switch (profile.mouthShape) {
      case 'MOUTH_WIDE':
      case 'wide_grin':
        mouthW = 34; mouthH = 12; mouthYOff = 1;
        break;
      case 'MOUTH_SMILE':
      case 'smile':
        mouthW = 28; mouthH = 8; mouthYOff = 0;
        break;
      case 'MOUTH_O':
      case 'open_o':
        mouthW = 16; mouthH = 16; mouthYOff = 1;
        break;
      case 'MOUTH_SMALL':
        mouthW = 14; mouthH = 3; mouthYOff = 0;
        break;
      case 'MOUTH_CLOSED':
      case 'neutral':
        mouthW = 22; mouthH = 2; mouthYOff = 0;
        break;
      case 'sad_frown':
        mouthW = 24; mouthH = 6; mouthYOff = 3;
        break;
      case 'thinking_pucker':
        mouthW = 16; mouthH = 4; mouthYOff = -1;
        break;
      case 'worried_wiggle':
        mouthW = 26; mouthH = 5; mouthYOff = 2;
        break;
      case 'pout':
        mouthW = 18; mouthH = 5; mouthYOff = 2;
        break;
      default:
        mouthW = 24; mouthH = 4; mouthYOff = 0;
    }

    return {
      emotion: profile.emotion,
      eyeShape,
      leftEyeWidth: leftW,
      leftEyeHeight: leftH,
      rightEyeWidth: rightW,
      rightEyeHeight: rightH,
      pupilDilation: profile.pupilDilation,
      pupilOffsetX: gazeX,
      pupilOffsetY: gazeY,
      blinkPattern: profile.eyeBlinkPattern || 'NORMAL',
      squintRatio: squint,
      eyebrowTiltLeft: profile.eyebrowTilt || 0,
      eyebrowTiltRight: -(profile.eyebrowTilt || 0),
      eyebrowOffsetLeft: profile.eyebrowOffset || 0,
      eyebrowOffsetRight: profile.eyebrowOffset || 0,
      mouthShape: profile.mouthShape,
      mouthWidth: mouthW,
      mouthHeight: mouthH,
      mouthYOffset: mouthYOff,
      headTilt: profile.headTilt || 0,
      headBounce: 0,
      headSway: 0,
      cheeksBlush: !!profile.blush,
      particles: profile.particles || 'none',
      voicePitch: profile.voicePitch,
      voiceRate: profile.voiceRate,
    };
  }

  public getAvailableEmotions(): RobotEmotion[] {
    return Object.keys(ExpressionManager.PROFILES) as RobotEmotion[];
  }

  public subscribe(cb: (emotion: RobotEmotion, isTemp: boolean) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(emotion: RobotEmotion, isTemp: boolean) {
    for (const cb of this.listeners) {
      cb(emotion, isTemp);
    }
  }

  public getLayerState(): LayerState {
    const eff = this.getCurrentEffectiveEmotion();
    const prof = this.getProfile(eff);
    return {
      baseFace: { eyeShape: 'normal', mouthShape: 'MOUTH_CLOSED' },
      emotionLayer: { emotion: this.baseEmotion, intensity: this.currentIntensity },
      temporaryEffectLayer: this.temporaryExpression
        ? {
            emotion: this.temporaryExpression.emotion,
            expiresAt: this.temporaryExpression.expiresAt,
            durationMs: this.temporaryExpression.durationMs,
          }
        : undefined,
    };
  }
}

export const expressionManager = new ExpressionManager();
