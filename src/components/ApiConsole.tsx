import React, { useState } from 'react';
import { Terminal, Send, Play, CheckCircle2, Shield, Code, RefreshCw, Lock, Key, AlertCircle } from 'lucide-react';
import { RobotState, RobotEmotion, WiFiInfo } from '../types';
import { apiService } from '../services/apiService';

interface ApiConsoleProps {
  robotState: RobotState;
  emotion: RobotEmotion;
  wifiInfo: WiFiInfo;
}

export const ApiConsole: React.FC<ApiConsoleProps> = ({
  robotState,
  emotion,
  wifiInfo,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('GET /api/status');
  const [tokenInput, setTokenInput] = useState(apiService.getSessionToken() || 'sim_00112233445566778899aabbccddeeff');
  const [includeToken, setIncludeToken] = useState(true);
  const [requestBody, setRequestBody] = useState('');
  const [responseCode, setResponseCode] = useState(200);
  const [responseJson, setResponseJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEndpointSelect = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
    switch (endpoint) {
      case 'POST /api/auth/login':
        setRequestBody(JSON.stringify({ password: 'tara-admin' }, null, 2));
        break;
      case 'POST /api/brain':
        setRequestBody(JSON.stringify({
          provider: 'openai',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          apiKey: 'sk-proj-test1234567890',
          model: 'gpt-4o-mini',
          temperature: 0.7
        }, null, 2));
        break;
      case 'POST /api/wifi':
        setRequestBody(JSON.stringify({
          ssid: 'MyHomeWiFi',
          password: 'SecretPassword123'
        }, null, 2));
        break;
      case 'POST /api/reset':
        setRequestBody(JSON.stringify({ confirm: true }, null, 2));
        break;
      default:
        setRequestBody('');
        break;
    }
  };

  const executeApi = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      const isPublic = selectedEndpoint === 'GET /api/status' || selectedEndpoint === 'POST /api/auth/login' || selectedEndpoint === 'GET /api/auth/status';
      const hasValidToken = includeToken && tokenInput.trim().length > 0;

      // Check method safety: GET /api/reset or GET /api/restart -> 405 Method Not Allowed
      if (selectedEndpoint === 'GET /api/reset' || selectedEndpoint === 'GET /api/restart') {
        setResponseCode(405);
        setResponseJson(JSON.stringify({
          error: 'HTTP Method Not Allowed. Destructive actions require POST.',
          method: 'GET',
          status: 405
        }, null, 2));
        return;
      }

      // Check auth requirement
      if (!isPublic && !hasValidToken) {
        setResponseCode(401);
        setResponseJson(JSON.stringify({
          error: 'Unauthorized. Missing Authorization: Bearer <token>',
          authenticated: false,
          status: 401
        }, null, 2));
        return;
      }

      switch (selectedEndpoint) {
        case 'GET /api/status':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'ok',
                state: robotState,
                emotion: emotion,
                wifi: {
                  state: wifiInfo.state,
                  ssid: wifiInfo.ssid,
                  ip: wifiInfo.ip,
                  rssi: wifiInfo.rssi,
                  internet: wifiInfo.hasInternet,
                },
                system: {
                  firmware: '0.1.0',
                  platform: 'Standard ESP32 Dual-Core (Xtensa LX6)',
                  uptime: 1840,
                  free_heap: 198420,
                  total_heap: 327680
                },
              },
              null,
              2
            )
          );
          break;

        case 'POST /api/auth/login':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'ok',
                token: 'sim_a87f9c2e4b103d88ef55661122334455',
                expiresIn: 3600,
                isFirstBoot: false
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/auth/status':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                authenticated: hasValidToken,
                passwordConfigured: true
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/wifi':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                state: wifiInfo.state,
                ssid: wifiInfo.ssid,
                ip: wifiInfo.ip,
                mac: wifiInfo.mac,
                rssi: wifiInfo.rssi,
                internet: wifiInfo.hasInternet
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/brain':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                enabled: true,
                provider: 'openai',
                model: 'gpt-4o-mini',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                temperature: 0.7,
                max_tokens: 256,
                hasKey: true
              },
              null,
              2
            )
          );
          break;

        case 'POST /api/brain':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'ok',
                provider: 'openai',
                hasKey: true,
                message: 'Brain configuration validated and stored in NVS'
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/security/logs':
          setResponseCode(200);
          setResponseJson(JSON.stringify(apiService.getSecurityLogs(), null, 2));
          break;

        case 'POST /api/restart':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'restarting',
                message: 'ESP32 restarting in 1 second...'
              },
              null,
              2
            )
          );
          break;

        case 'POST /api/reset':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'resetting',
                message: 'Preferences erased. Rebooting in SoftAP mode...'
              },
              null,
              2
            )
          );
          break;

        default:
          setResponseCode(200);
          setResponseJson(JSON.stringify({ status: 'ok', endpoint: selectedEndpoint }, null, 2));
          break;
      }
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-500" />
              Interactive REST API Console
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Directly query and verify protected standard ESP32 endpoints
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 w-fit">
            Bearer Token Protected
          </span>
        </div>

        {/* Auth Simulation Bar */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Authorization Header Simulation:
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={includeToken}
                onChange={(e) => setIncludeToken(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Attach Authorization Header</span>
            </label>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono text-slate-400">
                Bearer
              </span>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                disabled={!includeToken}
                placeholder="Session token..."
                className="w-full pl-16 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Request & Response Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            HTTP Request
          </h3>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Route & Method
              </label>
              <select
                value={selectedEndpoint}
                onChange={(e) => handleEndpointSelect(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <optgroup label="Authentication Endpoints (Public)">
                  <option value="POST /api/auth/login">POST /api/auth/login</option>
                  <option value="GET /api/auth/status">GET /api/auth/status</option>
                </optgroup>
                <optgroup label="System Telemetry">
                  <option value="GET /api/status">GET /api/status (Public)</option>
                  <option value="GET /api/security/logs">GET /api/security/logs (Protected)</option>
                </optgroup>
                <optgroup label="Protected Configuration APIs">
                  <option value="GET /api/wifi">GET /api/wifi (Protected)</option>
                  <option value="POST /api/wifi">POST /api/wifi (Protected)</option>
                  <option value="GET /api/brain">GET /api/brain (Protected - Masked Key)</option>
                  <option value="POST /api/brain">POST /api/brain (Protected - SSRF Validated)</option>
                </optgroup>
                <optgroup label="Destructive Operations & Method Safety">
                  <option value="POST /api/restart">POST /api/restart (Protected)</option>
                  <option value="GET /api/restart">GET /api/restart (Method Not Allowed Test)</option>
                  <option value="POST /api/reset">POST /api/reset (Protected - Confirm Check)</option>
                  <option value="GET /api/reset">GET /api/reset (Method Not Allowed Test)</option>
                </optgroup>
              </select>
            </div>

            {requestBody && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Request JSON Body
                </label>
                <textarea
                  rows={6}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={executeApi}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Executing...' : 'Send HTTP Request'}</span>
            </button>
          </div>
        </div>

        {/* Response Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              HTTP Response
            </h3>
            {responseJson && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                  responseCode >= 200 && responseCode < 300
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                }`}
              >
                HTTP {responseCode}
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 overflow-auto font-mono text-xs text-slate-800 dark:text-slate-200 max-h-[350px]">
            {responseJson ? (
              <pre>{responseJson}</pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                Select an endpoint and click "Send HTTP Request" to view output.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
