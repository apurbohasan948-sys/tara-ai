import React, { useState } from 'react';
import { WiFiInfo } from '../types';
import { Wifi, Lock, Smartphone, ArrowRight, RefreshCw, CheckCircle2, AlertCircle, Signal, Shield } from 'lucide-react';

interface TabWiFiProps {
  wifiInfo: WiFiInfo;
  onUpdateWiFi: (info: Partial<WiFiInfo>) => void;
}

export const TabWiFi: React.FC<TabWiFiProps> = ({ wifiInfo, onUpdateWiFi }) => {
  const [ssidInput, setSsidInput] = useState(wifiInfo.ssid || '');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [scanResults, setScanResults] = useState<Array<{ ssid: string; rssi: number; secure: boolean }>>([
    { ssid: 'Home_Fiber_2.4G', rssi: -58, secure: true },
    { ssid: 'Studio_Lab_IoT', rssi: -65, secure: true },
    { ssid: 'Workshop_Mesh', rssi: -78, secure: true },
    { ssid: 'Guest_Public', rssi: -82, secure: false },
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssidInput.trim()) return;

    setIsConnecting(true);
    setFeedback('Connecting to ' + ssidInput + '... Please wait');

    setTimeout(() => {
      setIsConnecting(false);
      onUpdateWiFi({
        state: 'CONNECTED_STA',
        ssid: ssidInput,
        ip: '192.168.1.105',
        gateway: '192.168.1.1',
        rssi: -62,
        hasInternet: true,
      });
      setFeedback('Successfully connected! IPv4: 192.168.1.105 (Saved to NVS Flash)');
    }, 1800);
  };

  const handleSwitchToAP = () => {
    onUpdateWiFi({
      state: 'AP_MODE',
      ssid: 'TARA-Robot-A4F2',
      ip: '192.168.4.1',
      gateway: '192.168.4.1',
      rssi: 0,
      hasInternet: false,
    });
    setFeedback('Switched to SoftAP Provisioning Mode. Connect to TARA-Robot-A4F2 at 192.168.4.1');
  };

  return (
    <div className="space-y-6">
      {/* Visual Provisioning Architecture Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-cyan-400" />
          First-Boot AP Provisioning Flow (Standard ESP32)
        </h3>
        <p className="text-[12px] text-slate-400 mb-4">
          TARA never requires hardcoded Wi-Fi credentials in firmware source code. When booted without saved credentials, TARA launches an isolated SoftAP network.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-semibold text-slate-200">SoftAP Beacon</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                ESP32 broadcasts <span className="text-cyan-400 font-mono">TARA-Robot-XXXX</span>. Phone connects directly to <span className="font-mono text-cyan-400">192.168.4.1</span>.
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-semibold text-slate-200">Browser Config</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                User selects local home 2.4GHz SSID & enters password in this mobile-responsive web dashboard.
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="font-semibold text-slate-200">Persistent Station</div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Credentials save to NVS flash, TARA rebinds to home LAN and displays assigned IP on OLED screen.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Status & Network Setup Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              Configure 2.4GHz Home Wi-Fi
            </h4>
            <span className="text-[11px] font-mono text-slate-400">WPA2-PSK</span>
          </div>

          {feedback && (
            <div className="mb-4 p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          <form onSubmit={handleConnect} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Wi-Fi Network Name (SSID)
              </label>
              <input
                type="text"
                value={ssidInput}
                onChange={(e) => setSsidInput(e.target.value)}
                placeholder="e.g. MyHome_Network"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Network Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter WPA2 password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Standard ESP32 supports 2.4GHz IEEE 802.11 b/g/n networks (5GHz is not supported on ESP32 silicon).
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isConnecting}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting to Wi-Fi...
                  </>
                ) : (
                  <>
                    <Wifi className="w-4 h-4" />
                    Save Credentials & Connect
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSwitchToAP}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 px-3 rounded-lg text-xs transition-all border border-slate-700"
              >
                Switch to SoftAP
              </button>
            </div>
          </form>

          {/* Scanned Networks List */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300">Scanned Nearby Networks</span>
              <button
                onClick={() => setFeedback('Scanned 4 nearby networks on 2.4GHz spectrum')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Rescan
              </button>
            </div>

            <div className="space-y-1.5">
              {scanResults.map((net, i) => (
                <div
                  key={i}
                  onClick={() => setSsidInput(net.ssid)}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/60 cursor-pointer transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Signal className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-slate-200">{net.ssid}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    {net.secure && <Lock className="w-3 h-3 text-slate-400" />}
                    <span>{net.rssi} dBm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Network Telemetry */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Active Wi-Fi Interface Status
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Wi-Fi Operational Mode</span>
                <span className="font-bold text-cyan-400">{wifiInfo.state}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Current SSID</span>
                <span className="text-slate-100 font-semibold">{wifiInfo.ssid || 'None'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Assigned IPv4 Address</span>
                <span className="text-emerald-400 font-bold">{wifiInfo.ip}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Default Gateway</span>
                <span className="text-slate-200">{wifiInfo.gateway}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Physical MAC Address</span>
                <span className="text-slate-400">{wifiInfo.mac}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Signal Strength (RSSI)</span>
                <span className="text-cyan-400">{wifiInfo.rssi} dBm</span>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Web configuration server is listening at http://{wifiInfo.ip}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
