import { ArmGesture, ArmState } from '../types';

export class ArmController {
  private state: ArmState = {
    leftAngle: 0,
    rightAngle: 0,
    leftHand: 'OPEN',
    rightHand: 'OPEN',
    activeGesture: 'IDLE',
    isMoving: false,
    hardwareAttached: true, // In simulation mode, mock hardware is active
  };

  private armsVisible: boolean = false;
  private gestureTimeout: any = null;
  private animationInterval: any = null;
  private listeners: ((state: ArmState) => void)[] = [];

  // Safe mechanical servo angle bounds (degrees from rest)
  public static readonly MIN_ANGLE = -80;
  public static readonly MAX_ANGLE = 90;
  public static readonly REST_ANGLE = 0;

  constructor() {
    this.resetToSafePosition();
  }

  public subscribe(listener: (state: ArmState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener({ ...this.state });
    }
  }

  public getState(): ArmState {
    return { ...this.state };
  }

  public setHardwareAttached(attached: boolean) {
    this.state.hardwareAttached = attached;
    this.notify();
  }

  public setArmsVisible(visible: boolean) {
    this.armsVisible = visible;
    this.notify();
  }

  public getArmsVisible(): boolean {
    return this.armsVisible || this.state.isMoving || this.state.activeGesture !== 'IDLE';
  }

  public triggerGesture(gesture: ArmGesture, durationMs: number = 3000): void {
    this.executeGesture(gesture, durationMs);
  }

  public resetToSafePosition() {
    this.stopMovement();
    this.state.leftAngle = ArmController.REST_ANGLE;
    this.state.rightAngle = ArmController.REST_ANGLE;
    this.state.leftHand = 'OPEN';
    this.state.rightHand = 'OPEN';
    this.state.activeGesture = 'IDLE';
    this.state.isMoving = false;
    this.notify();
  }

  public stopMovement() {
    if (this.gestureTimeout) {
      clearTimeout(this.gestureTimeout);
      this.gestureTimeout = null;
    }
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
      this.animationInterval = null;
    }
    this.state.isMoving = false;
    this.notify();
  }

  /**
   * Execute an expressive gesture safely with mechanical limits and automatic timeout return to rest
   */
  public executeGesture(gesture: ArmGesture, durationMs: number = 3000): void {
    this.stopMovement();

    // If no hardware is attached, we record the gesture in state without errors
    this.state.activeGesture = gesture;
    this.state.isMoving = true;

    // Normalize abstract ARM_* commands to internal patterns
    let normGesture: string = gesture;
    if (gesture.startsWith('ARM_')) {
      const suffix = gesture.substring(4);
      if (suffix === 'HOLD_MIC') normGesture = 'SINGING';
      else if (suffix === 'STIR') normGesture = 'COOKING';
      else if (suffix === 'HOLD_BOOK') normGesture = 'READING';
      else if (suffix === 'CELEBRATE') normGesture = 'HAPPY_MOVE';
      else if (suffix === 'GREETING') normGesture = 'WAVE';
      else normGesture = suffix;
    }

    switch (normGesture) {
      case 'WAVE':
        // Wave right arm smoothly between 45 and 80 degrees
        let waveDir = 1;
        let step = 0;
        this.state.leftAngle = 0;
        this.state.rightAngle = 60;
        this.state.rightHand = 'OPEN';
        this.notify();

        this.animationInterval = setInterval(() => {
          step++;
          if (step % 4 === 0) waveDir = -waveDir;
          this.state.rightAngle = Math.min(85, Math.max(40, this.state.rightAngle + waveDir * 10));
          this.notify();
        }, 80);
        break;

      case 'POINT':
        this.state.leftAngle = 0;
        this.state.rightAngle = 55;
        this.state.rightHand = 'POINT';
        this.notify();
        break;

      case 'THUMBS_UP':
        this.state.leftAngle = 0;
        this.state.rightAngle = 45;
        this.state.rightHand = 'THUMBS_UP';
        this.notify();
        break;

      case 'HAPPY_MOVE':
        // Both arms raised excitedly
        this.state.leftAngle = 50;
        this.state.rightAngle = 50;
        this.state.leftHand = 'OPEN';
        this.state.rightHand = 'OPEN';
        this.notify();
        break;

      case 'SAD_MOVE':
        // Arms drooping slightly backwards/down
        this.state.leftAngle = -20;
        this.state.rightAngle = -20;
        this.state.leftHand = 'FIST';
        this.state.rightHand = 'FIST';
        this.notify();
        break;

      case 'THINKING':
        // Right hand up near chin
        this.state.leftAngle = 0;
        this.state.rightAngle = 70;
        this.state.rightHand = 'FIST';
        this.notify();
        break;

      case 'READING':
        // Both arms forward as if holding a book
        this.state.leftAngle = 35;
        this.state.rightAngle = 35;
        this.state.leftHand = 'OPEN';
        this.state.rightHand = 'OPEN';
        this.notify();
        break;

      case 'COOKING':
        // Alternating stirring/chopping arm movements
        let stirStep = 0;
        this.state.leftAngle = 25;
        this.state.rightAngle = 40;
        this.notify();

        this.animationInterval = setInterval(() => {
          stirStep++;
          this.state.rightAngle = 30 + Math.sin(stirStep * 0.5) * 20;
          this.state.leftAngle = 20 + Math.cos(stirStep * 0.5) * 15;
          this.notify();
        }, 120);
        break;

      case 'SINGING':
        // Rhythmic gentle sway
        let singStep = 0;
        this.animationInterval = setInterval(() => {
          singStep++;
          this.state.leftAngle = Math.sin(singStep * 0.4) * 25;
          this.state.rightAngle = Math.cos(singStep * 0.4) * 25;
          this.notify();
        }, 100);
        break;

      case 'GREETING':
        this.executeGesture('WAVE', durationMs);
        return;

      case 'IDLE':
      default:
        this.resetToSafePosition();
        return;
    }

    // Safety timeout: automatically return to safe resting position
    this.gestureTimeout = setTimeout(() => {
      this.resetToSafePosition();
    }, durationMs);
  }
}

export const armController = new ArmController();
