/**
 * SecurityDeck.tsx
 * Comprehensive Security Hardening Diagnostic & Control Deck for TARA.
 *
 * Implements:
 * 1. Mode Status & Safe Local Switcher (SIMULATION vs REAL ESP32)
 * 2. Real ESP32 Server-Side Auth & First-Boot Provisioning with Serial/OLED Setup PIN
 * 3. RBAC Permissions Inspector & Destructive Actions with Safety Challenge
 * 4. Strict Endpoint Validator & Anti-Exfiltration Test Engine
 * 5. All 17 Automated Security Tests (Requirement 19) with 1-click execution
 * 6. Sanitized Audit Logger with Automatic Secret Redaction
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Server,
  Terminal,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  AlertTriangle,
  Radio,
  Eye,
  EyeOff,
  Cpu,
  Globe,
  Trash2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { authManager } from '../services/AuthManager';
import { mockAuthManager } from '../services/MockAuthManager';
import { endpointValidator } from '../services/EndpointValidator';
import { tlsCertStore } from '../services/TLSCertStore';
import { securityLogger } from '../services/SecurityLogger';
import { SecurityTestRunner } from '../services/SecurityTestRunner';
import { apiService } from '../services/apiService';
import {
  AppMode,
  AuditLogEntry,
  Permission,
  SecurityState,
  SecurityTestReport,
  SessionInfo,
} from '../services/SecurityTypes';

export const SecurityDeck: React.FC = () => {
  // Mode State
  const [appMode, setAppMode] = useState<AppMode>(apiService.getAppMode());
  const [deviceAddress, setDeviceAddress] = useState<string>(apiService.getDeviceAddress());
  const [securityState, setSecurityState] = useState<SecurityState>(authManager.getState());

  // Real Auth State
  const [clientSession, setClientSession] = useState<SessionInfo | null>(authManager.getClientSession());
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // First-Boot Provisioning State
  const [setupPinInput, setSetupPinInput] = useState<string>('');
  const [newAdminPassword, setNewAdminPassword] = useState<string>('');
  const [provisionError, setProvisionError] = useState<string>('');
  const [provisionSuccess, setProvisionSuccess] = useState<boolean>(false);
  const [localHardwarePin, setLocalHardwarePin] = useState<string | null>(authManager.getLocalHardwareSetupPin());

  // Endpoint Validator Live Inspector
  const [testUrlInput, setTestUrlInput] = useState<string>('https://generativelanguage.googleapis.com/v1beta/models');
  const [urlValidationResult, setUrlValidationResult] = useState<any>(null);

  // Custom Endpoint Provisioning Form (Admin)
  const [customEndpointUrl, setCustomEndpointUrl] = useState<string>('');
  const [customProviderLabel, setCustomProviderLabel] = useState<string>('');
  const [customProvisionMsg, setCustomProvisionMsg] = useState<string>('');

  // Destructive Actions State
  const [resetChallenge, setResetChallenge] = useState<string>('');
  const [destructiveMsg, setDestructiveMsg] = useState<string>('');

  // 17 Automated Security Tests State
  const [testReports, setTestReports] = useState<SecurityTestReport[]>([]);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(securityLogger.getLogs());

  useEffect(() => {
    const unsubAuth = authManager.subscribe(() => {
      setSecurityState(authManager.getState());
      setClientSession(authManager.getClientSession());
      setLocalHardwarePin(authManager.getLocalHardwareSetupPin());
    });

    const unsubLog = securityLogger.subscribe(() => {
      setAuditLogs(securityLogger.getLogs());
    });

    const unsubApi = apiService.subscribe(() => {
      setAppMode(apiService.getAppMode());
      setDeviceAddress(apiService.getDeviceAddress());
    });

    // Run tests once on mount
    handleRunAllSecurityTests();

    return () => {
      unsubAuth();
      unsubLog();
      unsubApi();
    };
  }, []);

  const handleSwitchMode = (mode: AppMode) => {
    apiService.setAppMode(mode, deviceAddress);
    setAppMode(mode);
  };

  const handleDeviceAddressChange = (newAddr: string) => {
    setDeviceAddress(newAddr);
    apiService.setAppMode(appMode, newAddr);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoggingIn(true);

    const result = await authManager.login(loginPassword);
    setIsLoggingIn(false);

    if (result.success) {
      setLoginPassword('');
    } else {
      setAuthError(result.error || 'Authentication failed.');
    }
  };

  const handleLogout = () => {
    authManager.logout();
    setAuthError('');
  };

  const handleProvisionDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setProvisionError('');
    setProvisionSuccess(false);

    const result = await authManager.provisionDevice(setupPinInput, newAdminPassword);
    if (result.success) {
      setProvisionSuccess(true);
      setSetupPinInput('');
      setNewAdminPassword('');
    } else {
      setProvisionError(result.error || 'Provisioning failed.');
    }
  };

  const handleValidateTestUrl = () => {
    const res = endpointValidator.validateEndpoint(testUrlInput);
    setUrlValidationResult(res);
  };

  const handleProvisionCustomEndpoint = () => {
    setCustomProvisionMsg('');
    const hasPerm = authManager.authorize(authManager.getClientToken(), 'PROVIDER_CONFIG');
    const result = endpointValidator.provisionCustomEndpoint(
      authManager.getClientSession()?.sessionId || 'none',
      hasPerm,
      {
        targetUrl: customEndpointUrl,
        providerLabel: customProviderLabel,
        allowedPrefix: '/v1/',
      }
    );

    if (result.success) {
      setCustomProvisionMsg(`Endpoint provisioned! Config ID: ${result.configId}`);
      setCustomEndpointUrl('');
      setCustomProviderLabel('');
    } else {
      setCustomProvisionMsg(`Rejected: ${result.error}`);
    }
  };

  const handleRestart = () => {
    setDestructiveMsg('');
    const res = authManager.restart(authManager.getClientToken());
    if (res.success) {
      setDestructiveMsg('System restart command dispatched successfully.');
    } else {
      setDestructiveMsg(`Restart rejected: ${res.error}`);
    }
  };

  const handleFactoryReset = () => {
    setDestructiveMsg('');
    const res = authManager.factoryReset(authManager.getClientToken(), resetChallenge);
    if (res.success) {
      setDestructiveMsg('Factory reset executed. Device restored to UNINITIALIZED state.');
      setResetChallenge('');
    } else {
      setDestructiveMsg(`Factory reset rejected: ${res.error}`);
    }
  };

  const handleRunAllSecurityTests = async () => {
    setIsRunningTests(true);
    const reports = await SecurityTestRunner.runAllTests();
    setTestReports(reports);
    setIsRunningTests(false);
  };

  const allPassed = testReports.length > 0 && testReports.every((t) => t.status === 'PASS');

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Top Banner: Mode & Security State Machine Status */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                TARA Security & Hardening Console
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.4 Hardened
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Zero-Leak Authentication • Strict Endpoint Allowlist • RBAC • No Token-in-URL
              </p>
            </div>
          </div>

          {/* Mode Selector Buttons (Persisted safely to localStorage) */}
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchMode('simulation')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                appMode === 'simulation'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              SIMULATION MODE
            </button>
            <button
              onClick={() => handleSwitchMode('esp32')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                appMode === 'esp32'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              REAL ESP32
            </button>
          </div>
        </div>

        {/* Current Active Mode Diagnostic Callout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
            <span className="text-slate-500 uppercase">Operating Mode</span>
            <div className="text-sm font-bold flex items-center gap-2">
              {appMode === 'simulation' ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="text-amber-300">SIMULATION — No ESP32 connected</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                  <span className="text-blue-300">REAL ESP32 DEVICE ({deviceAddress})</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              {appMode === 'simulation'
                ? 'MockAuthManager active • Safely isolated from production hardware'
                : 'Server-side AuthManager • Validated over secure bearer headers'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
            <span className="text-slate-500 uppercase">Security State Machine</span>
            <div className="text-sm font-bold flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  securityState === 'AUTHENTICATED'
                    ? 'bg-emerald-400'
                    : securityState === 'LOCKED'
                    ? 'bg-amber-400'
                    : securityState === 'LOCKOUT'
                    ? 'bg-rose-500 animate-ping'
                    : 'bg-slate-400'
                }`}
              />
              <span
                className={
                  securityState === 'AUTHENTICATED'
                    ? 'text-emerald-300'
                    : securityState === 'LOCKED'
                    ? 'text-amber-300'
                    : 'text-slate-300'
                }
              >
                {securityState}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              States: UNINITIALIZED → PROVISIONING → LOCKED → AUTHENTICATED
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1">
            <span className="text-slate-500 uppercase">Device IP Target</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={deviceAddress}
                onChange={(e) => handleDeviceAddressChange(e.target.value)}
                placeholder="192.168.1.150"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono"
              />
            </div>
            <span className="text-[11px] text-slate-500 mt-1">
              Persisted locally in localStorage • Never stores session tokens
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Authentication & Provisioning vs Endpoint Validator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Real Device Authentication & Provisioning Gate */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">ESP32 Server-Side AuthManager</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              POST /api/auth/login
            </span>
          </div>

          {appMode === 'simulation' ? (
            /* Simulation Mode Disclaimer & Mock Switch */
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>Simulation Mode Active</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You are currently in <strong>Simulation Mode</strong>. The application uses{' '}
                <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300 font-mono">MockAuthManager</code>{' '}
                which produces virtual session identifiers (<code className="text-amber-300">sim-mock-*</code>).
                No password verification is performed here to prevent confusing simulated logins with actual ESP32
                credentials.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => mockAuthManager.activateSimulationRole('operator')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-mono font-medium"
                >
                  Simulate Operator
                </button>
                <button
                  onClick={() => mockAuthManager.activateSimulationRole('admin')}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold"
                >
                  Simulate Admin
                </button>
              </div>
            </div>
          ) : (
            /* Real Device Authentication Path */
            <div className="flex flex-col gap-4">
              {/* Unprovisioned State: First-Boot Provisioning */}
              {securityState === 'UNINITIALIZED' && (
                <form onSubmit={handleProvisionDevice} className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                    <Key className="w-4 h-4" />
                    <span>First-Boot Hardware Provisioning</span>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                    <strong>Local Hardware Security Notice:</strong> The Setup PIN is generated on initial boot and
                    displayed <em>ONLY</em> on the hardware OLED screen and 115200 baud Serial monitor. It is never
                    exposed over unauthenticated HTTP.
                    {localHardwarePin && (
                      <div className="mt-2 pt-2 border-t border-purple-500/30 flex items-center justify-between">
                        <span className="text-purple-300">Local Serial/OLED Output:</span>
                        <span className="font-mono font-bold text-white px-2 py-0.5 bg-purple-950 rounded border border-purple-500/50">
                          {localHardwarePin}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Hardware Setup PIN (from Serial / OLED)</label>
                    <input
                      type="text"
                      value={setupPinInput}
                      onChange={(e) => setSetupPinInput(e.target.value)}
                      placeholder="e.g. 4A8F9C2B"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">New Admin Password (min 8 chars, Salted KDF)</label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                      required
                    />
                  </div>

                  {provisionError && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30">
                      {provisionError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition-colors"
                  >
                    Complete First-Boot Provisioning
                  </button>
                </form>
              )}

              {/* Locked State: Login Form */}
              {(securityState === 'LOCKED' || securityState === 'SESSION_EXPIRED' || securityState === 'LOCKOUT') && (
                <form onSubmit={handleLogin} className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300">ESP32 Device Authentication</span>
                    <span className="text-[11px] text-slate-500 font-mono">Constant-Time PBKDF2</span>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Admin Password</label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter device password..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
                      required
                      disabled={isLoggingIn || securityState === 'LOCKOUT'}
                    />
                  </div>

                  {authError && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoggingIn || securityState === 'LOCKOUT'}
                    className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center gap-2"
                  >
                    {isLoggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    Authenticate with ESP32
                  </button>
                </form>
              )}

              {/* Authenticated State */}
              {securityState === 'AUTHENTICATED' && clientSession && (
                <div className="flex flex-col gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authenticated Session Active</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700"
                    >
                      Logout
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Session ID</span>
                      <span className="text-emerald-300 font-bold">{clientSession.sessionId}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Role</span>
                      <span className="text-cyan-300 font-bold uppercase">{clientSession.role}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 font-mono block mb-1.5">Authorized Permissions:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {clientSession.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-700"
                        >
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Destructive Actions Section */}
                  <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-300">Authorized Destructive Operations</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRestart}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                        Restart Device
                      </button>
                    </div>

                    <div className="mt-2 p-2.5 rounded bg-rose-500/10 border border-rose-500/30 flex flex-col gap-2">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Factory Reset Protection
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Type <code>CONFIRM_FACTORY_RESET</code> to wipe credentials and return device to first-boot.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={resetChallenge}
                          onChange={(e) => setResetChallenge(e.target.value)}
                          placeholder="CONFIRM_FACTORY_RESET"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-white"
                        />
                        <button
                          onClick={handleFactoryReset}
                          disabled={resetChallenge !== 'CONFIRM_FACTORY_RESET'}
                          className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-xs font-mono font-bold"
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {destructiveMsg && (
                      <div className="text-xs text-cyan-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                        {destructiveMsg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Card: Strict Endpoint Validator & Anti-Exfiltration System */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" />
              <h3 className="font-bold text-sm text-white">Strict Endpoint Validator (Anti-Exfiltration)</h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
              Exact HTTPS Allowlist
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-400 leading-relaxed">
              Enforces that API keys are <strong>never attached</strong> to untrusted hosts. Rejects client-side
              <code className="text-rose-400 font-mono"> allowCustom=true</code> bypasses, wildcard domains, and plain HTTP.
            </p>

            {/* Approved Providers Allowlist */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono flex flex-col gap-1.5">
              <span className="text-slate-500 uppercase text-[10px]">Official Approved LLM Hostnames</span>
              <div className="flex flex-wrap gap-1.5">
                {endpointValidator.getApprovedHostnames().map((h) => (
                  <span
                    key={h}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-emerald-500/30 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {h}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive Live URL Validator */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400">Test Any Endpoint URL:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testUrlInput}
                  onChange={(e) => setTestUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white"
                />
                <button
                  onClick={handleValidateTestUrl}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold"
                >
                  Validate
                </button>
              </div>

              {urlValidationResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-mono flex flex-col gap-1 ${
                    urlValidationResult.valid
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    {urlValidationResult.valid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>PASSED: Approved Endpoint (API Key May Be Attached)</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>REJECTED: Untrusted Host (API Key Withheld)</span>
                      </>
                    )}
                  </div>
                  {urlValidationResult.error && (
                    <span className="text-[11px] text-rose-200">Reason: {urlValidationResult.error}</span>
                  )}
                  {urlValidationResult.provider && (
                    <span className="text-[11px] text-slate-300">Provider: {urlValidationResult.provider}</span>
                  )}
                </div>
              )}
            </div>

            {/* Custom Endpoint Admin Provisioning */}
            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Admin Endpoint Provisioning</span>
                <span className="text-[10px] text-slate-500 font-mono">Requires PROVIDER_CONFIG</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customEndpointUrl}
                  onChange={(e) => setCustomEndpointUrl(e.target.value)}
                  placeholder="https://custom-llm.corp.org/v1/"
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
                <input
                  type="text"
                  value={customProviderLabel}
                  onChange={(e) => setCustomProviderLabel(e.target.value)}
                  placeholder="Custom Model Label"
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs font-mono text-white"
                />
              </div>
              <button
                onClick={handleProvisionCustomEndpoint}
                className="w-full py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium"
              >
                Provision Approved Configuration ID
              </button>
              {customProvisionMsg && (
                <span className="text-xs font-mono text-cyan-400">{customProvisionMsg}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Automated Security Hardening Test Suite (Requirement 19) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Automated Security Hardening Suite (17 Tests)</h3>
              <p className="text-xs text-slate-400">
                Verifies non-leakage, strict CORS, KDF rate-limiting, and zero token-in-URL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-mono font-bold flex items-center gap-1.5 ${
                allPassed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {allPassed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
              {testReports.filter((t) => t.status === 'PASS').length} / {testReports.length} TESTS PASSING
            </span>

            <button
              onClick={handleRunAllSecurityTests}
              disabled={isRunningTests}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow"
            >
              {isRunningTests ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Run All Tests
            </button>
          </div>
        </div>

        {/* Test Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {testReports.map((report) => {
            const isPass = report.status === 'PASS';
            return (
              <div
                key={report.id}
                className={`p-3.5 rounded-xl border flex flex-col gap-1.5 font-mono text-xs transition-all ${
                  isPass
                    ? 'bg-slate-950/90 border-slate-800 hover:border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200 truncate">{report.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      isPass
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 truncate">{report.id}</span>
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{report.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sanitized Audit Log Panel (Requirement 14) */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="font-bold text-sm text-white">Zero-Leak Security Audit Trail</h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Auto-Redacting Passwords, Tokens & Keys
          </span>
        </div>

        <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-3 h-52 overflow-y-auto font-mono text-xs flex flex-col gap-1.5">
          {auditLogs.length === 0 ? (
            <span className="text-slate-600">No security audit logs recorded yet.</span>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-[11px] leading-tight">
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 rounded shrink-0 text-[10px] font-bold ${
                    log.level === 'SECURITY_ALERT'
                      ? 'bg-rose-500/20 text-rose-400'
                      : log.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-cyan-400 shrink-0 font-bold">{log.event}:</span>
                <span className="text-slate-300 break-all">{log.details}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
