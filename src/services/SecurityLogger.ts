/**
 * SecurityLogger.ts
 * Sanitized Audit Logger for TARA.
 *
 * Enforces:
 * - Automatic masking of API keys (e.g. sk-************1234)
 * - Automatic redaction of passwords, tokens, pins, and Authorization headers
 * - Safe event logging (SESSION_CREATED, SESSION_EXPIRED, SESSION_REVOKED)
 * - In-memory audit trail with bounded buffer
 */

import { AuditLogEntry, SecurityLogLevel } from './SecurityTypes';

export class SecurityLogger {
  private static instance: SecurityLogger;
  private logs: AuditLogEntry[] = [];
  private readonly MAX_LOGS = 150;
  private listeners: (() => void)[] = [];

  private constructor() {
    this.log('INFO', 'SECURITY_SYSTEM_INIT', 'Security logger initialized with zero-leak secret redaction policy.');
  }

  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  /**
   * Masks any sensitive secret string.
   * e.g., "sk-abcdef1234567890" -> "sk-************7890"
   */
  public maskSecret(secret: string | null | undefined): string {
    if (!secret || typeof secret !== 'string') return '[REDACTED_EMPTY]';
    const trimmed = secret.trim();
    if (trimmed.length <= 8) {
      return '********';
    }
    const prefix = trimmed.substring(0, 3);
    const suffix = trimmed.substring(trimmed.length - 4);
    return `${prefix}-************${suffix}`;
  }

  /**
   * Sanitizes arbitrary string or payload to remove passwords, tokens, auth headers, and keys.
   */
  public sanitize(input: string): string {
    if (!input) return '';
    let sanitized = input;

    // Redact Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+([A-Za-z0-9._~+/-]+)/gi, 'Bearer [REDACTED_TOKEN]');

    // Redact Authorization headers
    sanitized = sanitized.replace(/("?authorization"?\s*:\s*)"?[^",\n}]+"?/gi, '$1"[REDACTED_HEADER]"');

    // Redact password fields
    sanitized = sanitized.replace(/("?password"?\s*:\s*)"?[^",\n}]+"?/gi, '$1"[REDACTED_PASSWORD]"');

    // Redact PIN fields
    sanitized = sanitized.replace(/("?(?:setup_?)?pin"?\s*:\s*)"?[^",\n}]+"?/gi, '$1"[REDACTED_PIN]"');

    // Redact OpenAI style keys (sk-...)
    sanitized = sanitized.replace(/\b(sk-[A-Za-z0-9_-]{10,})/g, (match) => this.maskSecret(match));

    // Redact Google AI / Gemini keys (AIza...)
    sanitized = sanitized.replace(/\b(AIza[0-9A-Za-z_-]{20,})/g, (match) => this.maskSecret(match));

    return sanitized;
  }

  public log(level: SecurityLogLevel, event: string, details: string) {
    const sanitizedDetails = this.sanitize(details);
    const entry: AuditLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString().substring(11, 19),
      level,
      event,
      details: sanitizedDetails,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.pop();
    }

    // Never output raw secrets to browser console
    if (level === 'ERROR' || level === 'SECURITY_ALERT') {
      console.warn(`[TARA_SEC:${level}] ${event}: ${sanitizedDetails}`);
    }

    this.notify();
  }

  public getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
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

export const securityLogger = SecurityLogger.getInstance();
