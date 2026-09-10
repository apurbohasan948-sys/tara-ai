import React, { useState } from 'react';
import { Terminal, Send, Play, CheckCircle2, Shield, Code, RefreshCw } from 'lucide-react';
import { RobotState, RobotEmotion, WiFiInfo } from '../types';

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
  const [selectedEndpoint, setSelectedEndpoint] = useState<'GET /api/status' | 'GET /api/wifi' | 'GET /api/brain' | 'GET /api/voice' | 'GET /api/personality' | 'GET /api/memory' | 'GET /api/hardware' | 'POST /api/restart' | 'POST /api/reset'>('GET /api/status');
  const [requestBody, setRequestBody] = useState('');
  const [responseCode, setResponseCode] = useState(200);
  const [responseJson, setResponseJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const executeApi = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
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
                  firmware: '0.1.0-alpha',
                  platform: 'ESP32-Xtensa-LX6',
                  uptime: 1420,
                  free_heap: 198420,
                },
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
                provider: 'cloud',
                endpoint: 'https://api.openai.com/v1/chat/completions',
                model: 'gpt-4o-mini',
                hasKey: true,
                temperature: 0.7,
                maxTokens: 256,
                streaming: false,
                enabled: true,
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/voice':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                volume: 80,
                language: 'en',
                sampleRate: 16000,
                ttsEndpoint: 'https://translate.google.com/translate_tts',
                micEnabled: true,
                speakerEnabled: true,
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/personality':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                name: 'TARA',
                primaryTrait: 'Curious & Empathetic',
                speakingStyle: 'Warm and concise',
                language: 'en',
                energyLevel: 85,
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/memory':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                ownerName: 'Friend',
                conversationTurns: 4,
                persistentKeys: ['owner_name', 'favorite_topic', 'home_location'],
              },
              null,
              2
            )
          );
          break;

        case 'GET /api/hardware':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                pins: {
                  oledSda: 21,
                  oledScl: 22,
                  i2sBclk: 26,
                  i2sLrc: 25,
                  i2sDout: 19,
                  i2sDin: 34,
                  statusLed: 2,
                  bootButton: 0,
                  touchHead: 4,
                  batteryAdc: 35,
                },
              },
              null,
              2
            )
          );
          break;

        case 'POST /api/restart':
          setResponseCode(200);
          setResponseJson(
            JSON.stringify(
              {
                status: 'restarting',
                message: 'ESP32 scheduled reboot in 500ms',
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
                status: 'reset_complete',
                message: 'All NVS flash credentials cleared. Rebooting to SoftAP 192.168.4.1',
              },
              null,
              2
            )
          );
          break;
      }
    }, 250);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Standard ESP32 Local REST API Console
          </h3>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
            Port 80 WebServer
          </span>
        </div>
        <p className="text-[12px] text-slate-400">
          The ESP32 runs a non-blocking embedded HTTP server handling JSON REST endpoints. Sensitive secrets (Wi-Fi passwords, AI API keys) are strictly masked and never returned in plaintext.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Endpoint Selector & Request */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Select API Route
          </h4>

          <div className="space-y-1.5 font-mono text-xs">
            {[
              'GET /api/status',
              'GET /api/wifi',
              'GET /api/brain',
              'GET /api/voice',
              'GET /api/personality',
              'GET /api/memory',
              'GET /api/hardware',
              'POST /api/restart',
              'POST /api/reset',
            ].map((ep) => (
              <button
                key={ep}
                onClick={() => setSelectedEndpoint(ep as any)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center justify-between ${
                  selectedEndpoint === ep
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/60'
                }`}
              >
                <span>{ep}</span>
                <span className="text-[10px] opacity-70">
                  {ep.startsWith('GET') ? 'Read' : 'Action'}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={executeApi}
            disabled={isLoading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 mt-3"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Send Request to ESP32
          </button>
        </div>

        {/* JSON Response Terminal */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 font-bold">{selectedEndpoint}</span>
            </div>
            {responseJson && (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{responseCode} OK</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 font-mono text-xs text-cyan-300 overflow-auto bg-[#060911] min-h-[300px]">
            {responseJson ? (
              <pre className="whitespace-pre">
                <code>{responseJson}</code>
              </pre>
            ) : (
              <div className="text-slate-600 italic">
                Click "Send Request to ESP32" to fetch live JSON payload.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
