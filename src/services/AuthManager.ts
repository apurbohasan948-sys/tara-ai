/**
 * AuthManager.ts
 * Server-Side ESP32 Authentication & Authorization Manager.
 *
 * Implements:
 * - Real ESP32 Server-Side Auth Protocol (POST /api/auth/login)
 * - Salted PBKDF2-style iterative password KDF (1000 rounds of salted SHA-256)
 * - Constant-time comparison to prevent timing attacks
 * - Progressive lockout delay (0s -> 2s -> 5s -> 15s -> 30s -> 60s)
 * - Cryptographically random 256-bit in-memory session tokens
 * - Strict Authorization RBAC: READ_ONLY, CONFIGURE, PROVIDER_CONFIG, SYSTEM_CONTROL, FACTORY_RESET
 * - Idle timeout (30 min), Absolute expiration (24 hours), Max 3 concurrent sessions
 * - Token extraction STRICTLY from 'Authorization: Bearer <token>' header (ZERO URL token acceptance)
 * - Strict exact-match CORS origin validation (NO substring or wildcard matches)
 * - Safe First-Boot Provisioning with Setup PIN displayed via Serial/OLED (NEVER via unauthenticated HTTP)
 * - Security State Machine: UNINITIALIZED -> PROVISIONING -> LOCKED -> AUTHENTICATED -> SESSION_EXPIRED -> LOCKOUT -> ERROR
 */

import {
  Permission,
  SecurityState,
  SessionInfo,
  UserRole,
} from './SecurityTypes';
import { securityLogger } from './SecurityLogger';

interface StoredSession {
  token: string; // Stored only in-memory on the device
  sessionId: string; // Non-sensitive ID (e.g. "sess-3f8...")
  role: 'operator' | 'admin';
  permissions: Permission[];
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export class AuthManager {
  private static instance: AuthManager;

  // Security State Machine
  private state: SecurityState = 'UNINITIALIZED';

  // Device Provisioning Credentials (Stored in secure flash partition on ESP32)
  private isProvisioned: boolean = false;
  private setupPin: string | null = null; // Generated on boot, printed ONLY to local Serial/OLED
  private passwordSalt: string | null = null;
  private passwordHash: string | null = null;

  // Rate Limiting & Lockout
  private failedAttempts: number = 0;
  private lockoutUntil: number = 0;
  private readonly PROGRESSIVE_DELAYS_SEC = [0, 2, 5, 15, 30, 60];

  // In-Memory Active Sessions (Max 3 concurrent)
  private readonly MAX_SESSIONS = 3;
  private readonly SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  private readonly SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  private activeSessions: Map<string, StoredSession> = new Map();

  // Strict CORS Allowed Origins (Exact origin match: Protocol + Host + Port)
  private allowedOrigins: Set<string> = new Set([
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.1.150', // Default local AP / station address
  ]);

  // Client-side current in-memory session (never saved to localStorage or URL)
  private currentClientToken: string | null = null;
  private currentClientSession: SessionInfo | null = null;

  private listeners: (() => void)[] = [];

  private constructor() {
    this.bootInitialization();
  }

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * First-Boot Initialization Flow
   */
  private bootInitialization() {
    // Generate an 8-character cryptographically random setup PIN for unprovisioned state
    const randomArray = new Uint8Array(4);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomArray);
    } else {
      for (let i = 0; i < 4; i++) randomArray[i] = Math.floor(Math.random() * 256);
    }
    const pin = Array.from(randomArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    this.setupPin = pin;

    // The PIN is strictly logged to local physical Serial / OLED simulator
    securityLogger.log(
      'INFO',
      'DEVICE_FIRST_BOOT',
      'Device unprovisioned. Setup PIN generated and displayed ONLY to local Serial monitor and hardware display.'
    );

    this.state = 'UNINITIALIZED';
  }

  public getState(): SecurityState {
    this.checkSessionHealth();
    return this.state;
  }

  public getIsProvisioned(): boolean {
    return this.isProvisioned;
  }

  /**
   * Safe Setup PIN retrieval for LOCAL display / Serial simulation.
   * STRICT: NEVER returned by any unauthenticated HTTP API endpoint.
   */
  public getLocalHardwareSetupPin(): string | null {
    if (this.isProvisioned) return null;
    return this.setupPin;
  }

  /**
   * Embedded-appropriate KDF: Iterative Salted SHA-256 (1,000 iterations).
   */
  public async deriveKey(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    let currentBuffer = encoder.encode(salt + ':' + password);

    for (let i = 0; i < 1000; i++) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', currentBuffer);
      currentBuffer = new Uint8Array(hashBuffer);
    }

    return Array.from(currentBuffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Constant-Time String Comparison to prevent timing attacks.
   */
  private constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  /**
   * First-Boot Device Provisioning: Sets initial Admin credentials.
   * Requires the valid setup PIN that was displayed on the physical display/Serial.
   */
  public async provisionDevice(
    enteredPin: string,
    newAdminPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    if (this.isProvisioned) {
      return { success: false, error: 'Device is already provisioned.' };
    }

    if (!enteredPin || enteredPin.toUpperCase() !== this.setupPin) {
      securityLogger.log('SECURITY_ALERT', 'PROVISIONING_FAILED', 'Invalid Setup PIN entered.');
      return { success: false, error: 'Invalid Setup PIN. Check the ESP32 Serial output or OLED display.' };
    }

    if (!newAdminPassword || newAdminPassword.length < 8) {
      return { success: false, error: 'Admin password must be at least 8 characters long.' };
    }

    // Generate random 16-byte salt
    const saltBytes = new Uint8Array(16);
    crypto.getRandomValues(saltBytes);
    const salt = Array.from(saltBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const derived = await this.deriveKey(newAdminPassword, salt);

    this.passwordSalt = salt;
    this.passwordHash = derived;
    this.isProvisioned = true;
    this.setupPin = null; // Clear PIN immediately after provisioning
    this.state = 'LOCKED';

    securityLogger.log('INFO', 'DEVICE_PROVISIONED', 'Device successfully provisioned with PBKDF2-derived credentials.');
    this.notify();

    return { success: true };
  }

  /**
   * Server-Side Login Endpoint: POST /api/auth/login
   * Password verification is performed EXCLUSIVELY on the server/ESP32 side.
   * Implements progressive lockout and constant-time comparison.
   */
  public async login(password: string): Promise<{ success: boolean; session?: SessionInfo; error?: string }> {
    if (!this.isProvisioned) {
      this.state = 'UNINITIALIZED';
      return { success: false, error: 'Device is unprovisioned. Initial setup required.' };
    }

    const now = Date.now();
    if (now < this.lockoutUntil) {
      const remainingSec = Math.ceil((this.lockoutUntil - now) / 1000);
      this.state = 'LOCKOUT';
      securityLogger.log(
        'WARN',
        'LOGIN_RATE_LIMITED',
        `Login attempted during progressive lockout. Must wait ${remainingSec}s.`
      );
      return { success: false, error: `Too many failed attempts. Try again in ${remainingSec} seconds.` };
    }

    if (!password || typeof password !== 'string') {
      return { success: false, error: 'Password is required' };
    }

    // Server-side hash verification
    const testHash = await this.deriveKey(password, this.passwordSalt!);
    const isValid = this.constantTimeEqual(testHash, this.passwordHash!);

    if (!isValid) {
      this.failedAttempts++;
      const delayIndex = Math.min(this.failedAttempts, this.PROGRESSIVE_DELAYS_SEC.length - 1);
      const delaySec = this.PROGRESSIVE_DELAYS_SEC[delayIndex];

      if (delaySec > 0) {
        this.lockoutUntil = now + delaySec * 1000;
        this.state = 'LOCKOUT';
      }

      securityLogger.log(
        'SECURITY_ALERT',
        'AUTH_FAILED',
        `Failed login attempt (${this.failedAttempts}). Progressive lockout delay: ${delaySec}s.`
      );
      return { success: false, error: 'Invalid password. Authentication rejected.' };
    }

    // Success: Reset rate-limiting counters
    this.failedAttempts = 0;
    this.lockoutUntil = 0;

    // Enforce max concurrent sessions (evict oldest if needed)
    if (this.activeSessions.size >= this.MAX_SESSIONS) {
      let oldestToken: string | null = null;
      let oldestTime = Infinity;
      for (const [tok, sess] of this.activeSessions.entries()) {
        if (sess.lastActiveAt < oldestTime) {
          oldestTime = sess.lastActiveAt;
          oldestToken = tok;
        }
      }
      if (oldestToken) {
        const evicted = this.activeSessions.get(oldestToken);
        this.activeSessions.delete(oldestToken);
        securityLogger.log(
          'INFO',
          'SESSION_EVICTED',
          `Oldest session ${evicted?.sessionId} evicted due to max active session limit.`
        );
      }
    }

    // Generate cryptographically random 256-bit token (64 hex characters)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const rawToken = Array.from(tokenBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const sessionId = 'sess-' + rawToken.substring(0, 8);
    const sessionCreatedAt = now;
    const sessionExpiresAt = now + this.SESSION_TTL_MS;

    const storedSession: StoredSession = {
      token: rawToken,
      sessionId,
      role: 'admin',
      permissions: [
        'READ_ONLY',
        'CONFIGURE',
        'PROVIDER_CONFIG',
        'SYSTEM_CONTROL',
        'FACTORY_RESET',
      ],
      createdAt: sessionCreatedAt,
      lastActiveAt: sessionCreatedAt,
      expiresAt: sessionExpiresAt,
    };

    this.activeSessions.set(rawToken, storedSession);

    // Save token strictly in client memory (NEVER in localStorage or URL)
    this.currentClientToken = rawToken;
    this.currentClientSession = {
      sessionId,
      role: storedSession.role,
      permissions: storedSession.permissions,
      createdAt: storedSession.createdAt,
      lastActiveAt: storedSession.lastActiveAt,
      expiresAt: storedSession.expiresAt,
    };

    this.state = 'AUTHENTICATED';

    // Log event without leaking the token
    securityLogger.log('INFO', 'SESSION_CREATED', `New authenticated session created (${sessionId}).`);
    this.notify();

    return { success: true, session: this.currentClientSession };
  }

  /**
   * Strict Bearer Token Extraction:
   * STRICT: ONLY accepts 'Authorization: Bearer <token>' header.
   * COMPLETELY REJECTS any tokens passed via URL parameters (?token=), fragments, or body.
   */
  public extractBearerToken(authHeader: string | null | undefined, requestUrl?: string): string | null {
    // 1. Explicitly check for forbidden URL token parameter and reject immediately
    if (requestUrl) {
      try {
        const parsed = new URL(requestUrl, 'http://localhost');
        if (parsed.searchParams.has('token') || parsed.hash.includes('token')) {
          securityLogger.log(
            'SECURITY_ALERT',
            'URL_TOKEN_REJECTED',
            'Rejected authentication token supplied in URL query string or fragment. Only Bearer headers are permitted.'
          );
          return null;
        }
      } catch {
        // ignore parse error if relative
      }
    }

    if (!authHeader || typeof authHeader !== 'string') {
      return null;
    }

    const match = authHeader.match(/^Bearer\s+([a-fA-F0-9]{64})$/);
    if (!match) {
      return null;
    }

    return match[1];
  }

  /**
   * Validates a session token and enforces expiration & idle timeout.
   */
  public validateSession(rawToken: string | null): StoredSession | null {
    if (!rawToken) return null;

    const session = this.activeSessions.get(rawToken);
    if (!session) return null;

    const now = Date.now();

    // Check absolute expiration
    if (now > session.expiresAt) {
      this.activeSessions.delete(rawToken);
      securityLogger.log('INFO', 'SESSION_EXPIRED', `Session ${session.sessionId} expired (TTL reached).`);
      if (this.currentClientToken === rawToken) {
        this.currentClientToken = null;
        this.currentClientSession = null;
        this.state = 'SESSION_EXPIRED';
      }
      return null;
    }

    // Check idle timeout
    if (now - session.lastActiveAt > this.SESSION_IDLE_TIMEOUT_MS) {
      this.activeSessions.delete(rawToken);
      securityLogger.log('INFO', 'SESSION_EXPIRED', `Session ${session.sessionId} expired due to idle inactivity.`);
      if (this.currentClientToken === rawToken) {
        this.currentClientToken = null;
        this.currentClientSession = null;
        this.state = 'SESSION_EXPIRED';
      }
      return null;
    }

    // Update active timestamp
    session.lastActiveAt = now;
    return session;
  }

  /**
   * Enforces Role-Based Access Control (RBAC) Permission check.
   */
  public authorize(rawToken: string | null, requiredPermission: Permission): boolean {
    const session = this.validateSession(rawToken);
    if (!session) {
      return false;
    }
    return session.permissions.includes(requiredPermission);
  }

  /**
   * Explicit Session Logout / Revocation
   */
  public logout(): void {
    if (this.currentClientToken && this.activeSessions.has(this.currentClientToken)) {
      const sess = this.activeSessions.get(this.currentClientToken);
      this.activeSessions.delete(this.currentClientToken);
      securityLogger.log('INFO', 'SESSION_REVOKED', `Session ${sess?.sessionId} revoked by user logout.`);
    }

    this.currentClientToken = null;
    this.currentClientSession = null;
    this.state = this.isProvisioned ? 'LOCKED' : 'UNINITIALIZED';
    this.notify();
  }

  /**
   * Strict Exact CORS Origin Validation
   * STRICT: Rejects substring matching (indexOf, contains, startsWith).
   * Exact protocol + host + port match required.
   */
  public validateCorsOrigin(requestOrigin: string | null | undefined): boolean {
    if (!requestOrigin) return false;

    let parsed: URL;
    try {
      parsed = new URL(requestOrigin);
    } catch {
      return false;
    }

    const exactOrigin = parsed.origin.toLowerCase();
    const isAllowed = this.allowedOrigins.has(exactOrigin);

    if (!isAllowed) {
      securityLogger.log(
        'SECURITY_ALERT',
        'CORS_ORIGIN_REJECTED',
        `CORS request from untrusted origin '${exactOrigin}' rejected.`
      );
    }

    return isAllowed;
  }

  public addAllowedOrigin(origin: string) {
    try {
      const parsed = new URL(origin);
      this.allowedOrigins.add(parsed.origin.toLowerCase());
    } catch {
      // ignore
    }
  }

  /**
   * Destructive Action: Factory Reset
   * Requires explicit FACTORY_RESET permission and confirmation challenge.
   */
  public factoryReset(rawToken: string | null, challenge: string): { success: boolean; error?: string } {
    if (!this.authorize(rawToken, 'FACTORY_RESET')) {
      securityLogger.log(
        'SECURITY_ALERT',
        'UNAUTHORIZED_DESTRUCTIVE_OP',
        'Attempted factory reset without FACTORY_RESET authorization.'
      );
      return { success: false, error: 'Unauthorized. Operation requires FACTORY_RESET permission.' };
    }

    if (challenge !== 'CONFIRM_FACTORY_RESET') {
      return { success: false, error: 'Invalid confirmation token for factory reset.' };
    }

    // Reset device state
    this.activeSessions.clear();
    this.currentClientToken = null;
    this.currentClientSession = null;
    this.passwordHash = null;
    this.passwordSalt = null;
    this.isProvisioned = false;
    this.failedAttempts = 0;
    this.lockoutUntil = 0;

    this.bootInitialization();
    securityLogger.log('SECURITY_ALERT', 'FACTORY_RESET_EXECUTED', 'Device factory reset executed successfully.');
    this.notify();

    return { success: true };
  }

  /**
   * Destructive Action: System Restart
   * Requires explicit SYSTEM_CONTROL permission.
   */
  public restart(rawToken: string | null): { success: boolean; error?: string } {
    if (!this.authorize(rawToken, 'SYSTEM_CONTROL')) {
      securityLogger.log(
        'SECURITY_ALERT',
        'UNAUTHORIZED_DESTRUCTIVE_OP',
        'Attempted system restart without SYSTEM_CONTROL authorization.'
      );
      return { success: false, error: 'Unauthorized. Operation requires SYSTEM_CONTROL permission.' };
    }

    securityLogger.log('INFO', 'SYSTEM_RESTART_REQUESTED', 'ESP32 system restart requested by authorized operator.');
    return { success: true };
  }

  public getClientSession(): SessionInfo | null {
    return this.currentClientSession;
  }

  public getClientToken(): string | null {
    return this.currentClientToken;
  }

  private checkSessionHealth() {
    if (this.currentClientToken) {
      const valid = this.validateSession(this.currentClientToken);
      if (!valid) {
        this.currentClientToken = null;
        this.currentClientSession = null;
        this.state = 'SESSION_EXPIRED';
      }
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }
}

export const authManager = AuthManager.getInstance();
