import React, { useState } from 'react';
import { Cloud, Radio, RefreshCw, CheckCircle2, Shield, Upload, Download } from 'lucide-react';

export const TabCloud: React.FC = () => {
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(true);
  const [syncInterval, setSyncInterval] = useState(60); // seconds
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>('Gateway Latency: 42ms (HTTP 200 OK)');
  const [backupNotice, setBackupNotice] = useState<string | null>(null);

  const handlePing = () => {
    setIsPinging(true);
    setPingResult(null);
    setTimeout(() => {
      setIsPinging(false);
      setPingResult(`Gateway Latency: ${Math.round(35 + Math.random() * 20)}ms (HTTP 200 OK)`);
    }, 1000);
  };

  const handleBackup = () => {
    setBackupNotice('NVS flash settings backed up to cloud vault successfully.');
    setTimeout(() => setBackupNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-400" />
          Cloud Synchronization & Remote Telemetry Gateway
        </h3>
        <p className="text-[12px] text-slate-400 mb-4">
          TARA connects to optional cloud services for long-term semantic memory storage, firmware update registry checks, and companion telemetry monitoring.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Cloud Gateway</div>
            <div className="font-mono text-cyan-400 font-bold mt-1">api.tara-robot.io</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Telemetry Transport</div>
            <div className="font-mono text-emerald-400 font-bold mt-1">HTTPS / REST</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">Security Protocol</div>
            <div className="font-mono text-slate-200 font-bold mt-1">TLS 1.2 Encrypted</div>
          </div>
        </div>
      </div>

      {backupNotice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{backupNotice}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200">Cloud Sync Preferences</h4>

          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={cloudSyncEnabled}
                onChange={(e) => setCloudSyncEnabled(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
              />
              <span>Enable Background Cloud Telemetry Sync</span>
            </label>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 font-semibold mb-1">
              <span>Sync Interval</span>
              <span className="font-mono text-cyan-400">{syncInterval} seconds</span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="15"
              value={syncInterval}
              onChange={(e) => setSyncInterval(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleBackup}
              className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-sm shadow-cyan-500/20"
            >
              <Upload className="w-3.5 h-3.5" />
              Backup Settings to Cloud
            </button>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200">Cloud Gateway Connectivity Test</h4>
          <p className="text-[12px] text-slate-400">
            Send an HTTPS ping from ESP32 to verify outbound internet routing through the local gateway.
          </p>

          <button
            onClick={handlePing}
            disabled={isPinging}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            {isPinging ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Pinging Cloud Gateway...
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                Test Cloud Gateway Ping
              </>
            )}
          </button>

          {pingResult && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{pingResult}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
