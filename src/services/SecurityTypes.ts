/**
 * SecurityTypes.ts
 * Type definitions for TARA Security Hardening Framework.
 * Enforces:
 * - Clear separation of SIMULATION vs REAL ESP32 modes
 * - Role-Based Access Control (RBAC) Permissions
 * - Security State Machine states
 * - Sanitized Audit Logging
 * - Endpoint Validation
 */

export type AppMode = 'simulation' | 'esp32';

export type SecurityState =
  | 'UNINITIALIZED'
  | 'PROVISIONING'
  | 'LOCKED'
  | 'AUTHENTICATED'
  | 'SESSION_EXPIRED'
  | 'LOCKOUT'
  | 'ERROR';

export type Permission =
  | 'READ_ONLY'
  | 'CONFIGURE'
  | 'PROVIDER_CONFIG'
  | 'SYSTEM_CONTROL'
  | 'FACTORY_RESET';

export interface UserRole {
  role: 'guest' | 'operator' | 'admin';
  permissions: Permission[];
}

export interface SessionInfo {
  sessionId: string; // non-sensitive identifier, e.g. "sess-a1b2..."
  role: 'operator' | 'admin';
  permissions: Permission[];
  createdAt: number;
  lastActiveAt: number;
  expiresAt: number;
}

export type SecurityLogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SECURITY_ALERT';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: SecurityLogLevel;
  event: string;
  details: string; // Guaranteed to be masked of any passwords, tokens, or raw keys
}

export interface EndpointValidationResult {
  valid: boolean;
  sanitizedUrl?: string;
  hostname?: string;
  provider?: string;
  error?: string;
}

export interface ApprovedEndpointConfig {
  configId: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'anthropic' | 'custom_provisioned';
  hostname: string;
  pathPrefix: string;
  requiresHttps: boolean;
  provisionedAt: number;
  provisionedBy: string; // non-sensitive session ID prefix
}

export interface SecurityTestReport {
  id: string;
  name: string;
  category: 'AUTH' | 'ENDPOINT' | 'CORS' | 'SESSION' | 'STORAGE' | 'TLS' | 'LOGGING';
  status: 'PASS' | 'FAIL' | 'RUNNING' | 'PENDING';
  explanation: string;
  executionMs?: number;
}

export interface DeviceConnectionConfig {
  deviceAddress: string; // e.g. "192.168.1.150"
  useHttps: boolean;
  port: number;
}
