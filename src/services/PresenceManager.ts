import { PresenceInfo, PresenceSensorType, PresenceState } from '../types';

export interface IPresenceSensor {
  getType(): PresenceSensorType;
  pollDistance(): number; // Distance in cm (negative if unsupported)
  isTriggered(): boolean;
}

export class MockPresenceSensor implements IPresenceSensor {
  private distance: number = 250; // cm
  private triggered: boolean = false;
  private type: PresenceSensorType = 'MOCK';

  constructor(type: PresenceSensorType = 'MOCK') {
    this.type = type;
  }

  public setSimulatedState(distanceCm: number, triggered: boolean) {
    this.distance = distanceCm;
    this.triggered = triggered;
  }

  public getType(): PresenceSensorType {
    return this.type;
  }

  public pollDistance(): number {
    return this.distance;
  }

  public isTriggered(): boolean {
    return this.triggered;
  }
}

export class RealPresenceSensor implements IPresenceSensor {
  private type: PresenceSensorType;
  private gpioPin: number;

  constructor(type: PresenceSensorType, gpioPin: number) {
    this.type = type;
    this.gpioPin = gpioPin;
  }

  public getType(): PresenceSensorType {
    return this.type;
  }

  public pollDistance(): number {
    // Hardware reading would occur via ESP32 ADC or I2C sensor driver
    return -1;
  }

  public isTriggered(): boolean {
    // DigitalRead(gpioPin) == HIGH on real ESP32
    return false;
  }
}

export class PresenceManager {
  private sensor: IPresenceSensor;
  private info: PresenceInfo;
  private onPresenceChangeCallback?: (state: PresenceState, info: PresenceInfo) => void;
  private onAutonomousGreetingTrigger?: () => void;
  private listeners: ((info: PresenceInfo) => void)[] = [];

  constructor() {
    this.sensor = new MockPresenceSensor('ULTRASONIC');
    this.info = {
      state: 'NO_PERSON',
      sensorType: 'ULTRASONIC',
      distanceCm: 300,
      lastDetectionTime: 0,
      lastGreetingTime: 0,
      greetingCooldownMs: 5 * 60 * 1000, // 5 minutes default
      hasHardwareSensor: true, // Simulation has mock sensor
      audioActivityDetected: false,
    };
  }

  public subscribe(listener: (info: PresenceInfo) => void): () => void {
    this.listeners.push(listener);
    listener(this.info);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) {
      l({ ...this.info });
    }
  }

  public getInfo(): PresenceInfo {
    return { ...this.info };
  }

  public setSensor(sensor: IPresenceSensor) {
    this.sensor = sensor;
    this.info.sensorType = sensor.getType();
    this.info.hasHardwareSensor = sensor.getType() !== 'NONE';
    this.notify();
  }

  public setGreetingCooldownMinutes(minutes: number) {
    this.info.greetingCooldownMs = Math.max(1, minutes) * 60 * 1000;
    this.notify();
  }

  public setCallbacks(
    onPresenceChange?: (state: PresenceState, info: PresenceInfo) => void,
    onAutonomousGreeting?: () => void
  ) {
    this.onPresenceChangeCallback = onPresenceChange;
    this.onAutonomousGreetingTrigger = onAutonomousGreeting;
  }

  /**
   * Called when a physical or simulated presence transition occurs
   */
  public triggerPersonDetected(distanceCm: number = 45) {
    if (!this.info.hasHardwareSensor) {
      // In No-Sensor mode, physical proximity detection is not possible!
      return;
    }

    const previousState = this.info.state;
    const newState: PresenceState = distanceCm <= 60 ? 'PERSON_NEAR' : 'PERSON_DETECTED';

    this.info.state = newState;
    this.info.distanceCm = distanceCm;
    this.info.lastDetectionTime = Date.now();
    this.notify();

    if (this.onPresenceChangeCallback) {
      this.onPresenceChangeCallback(newState, this.info);
    }

    // Check autonomous greeting cooldown
    if (previousState === 'NO_PERSON' || previousState === 'PERSON_LEFT') {
      const now = Date.now();
      const elapsedSinceLastGreeting = now - this.info.lastGreetingTime;

      if (elapsedSinceLastGreeting >= this.info.greetingCooldownMs) {
        this.info.lastGreetingTime = now;
        this.notify();
        if (this.onAutonomousGreetingTrigger) {
          this.onAutonomousGreetingTrigger();
        }
      }
    }
  }

  public triggerPersonLeft() {
    this.info.state = 'PERSON_LEFT';
    this.info.distanceCm = 350;
    this.notify();

    setTimeout(() => {
      this.info.state = 'NO_PERSON';
      this.notify();
      if (this.onPresenceChangeCallback) {
        this.onPresenceChangeCallback('NO_PERSON', this.info);
      }
    }, 2000);
  }

  /**
   * Audio activity detection: Distinct from physical human proximity!
   */
  public triggerAudioActivity(noiseLevelDb: number = 68) {
    this.info.audioActivityDetected = true;
    this.notify();

    setTimeout(() => {
      this.info.audioActivityDetected = false;
      this.notify();
    }, 1800);
  }
}

export const presenceManager = new PresenceManager();
