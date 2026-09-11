/**
 * MockAuthManager.ts
 * Dedicated Simulation Mode Authentication Manager.
 *
 * Enforces:
 * - Clear identification: "Simulation — No ESP32 connected"
 * - Never claims user is authenticated to a real device
 * - Explicitly labeled simulation tokens prefixed with 'sim-mock-*'
 * - Simulation tokens are structurally incompatible with real ESP32 tokens
 * - No fake passwords like 'tara-admin' or 'tara-robot'
 */

import { SessionInfo } from './SecurityTypes';
import { securityLogger } from './SecurityLogger';

export class MockAuthManager {
  private static instance: MockAuthManager;
  private isSimulationSessionActive: boolean = true;
  private mockSession: SessionInfo;

  private constructor() {
    this.mockSession = {
      sessionId: 'sim-mock-guest',
      role: 'operator',
      permissions: ['READ_ONLY', 'CONFIGURE'],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };
  }

  public static getInstance(): MockAuthManager {
    if (!MockAuthManager.instance) {
      MockAuthManager.instance = new MockAuthManager();
    }
    return MockAuthManager.instance;
  }

  public isSimulated(): boolean {
    return true;
  }

  public getSimulationStatusText(): string {
    return 'Simulation — No ESP32 connected';
  }

  public getMockSession(): SessionInfo {
    return { ...this.mockSession };
  }

  /**
   * Simulation mode toggle / operator switch
   * Does NOT use any passwords. Explicitly acknowledges simulation scope.
   */
  public activateSimulationRole(role: 'operator' | 'admin'): { success: boolean; label: string } {
    this.mockSession = {
      sessionId: `sim-mock-${role}-${Math.random().toString(36).substring(2, 6)}`,
      role,
      permissions:
        role === 'admin'
          ? ['READ_ONLY', 'CONFIGURE', 'PROVIDER_CONFIG', 'SYSTEM_CONTROL', 'FACTORY_RESET']
          : ['READ_ONLY', 'CONFIGURE'],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    securityLogger.log(
      'INFO',
      'SIMULATION_MODE_ACTIVE',
      `Simulation active with mock role: ${role}. Note: No real ESP32 is attached.`
    );

    return {
      success: true,
      label: `Simulation Mode (${role}) — Virtual Environment Only`,
    };
  }
}

export const mockAuthManager = MockAuthManager.getInstance();
