import React, { useState } from 'react';
import { SystemInfo } from '../types';
import { Cpu, RotateCcw, AlertTriangle, CheckCircle2, HardDrive, ShieldAlert, Terminal } from 'lucide-react';

interface TabSystemProps {
  systemInfo: SystemInfo;
  onRestartRobot: () => void;
  onFactoryReset: () => void;
}

export const TabSystem: React.FC<TabSystemProps> = ({
  systemInfo,
  onRestartRobot,
  onFactoryReset,
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRestart = () => {
    setStatusMessage('Reboot signal sent to ESP32. Reinitializing hardware buses...');
    onRestartRobot();
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleConfirmReset = () => {
    setShowResetModal(false);
    setStatusMessage('Factory reset complete. NVS erased. ESP32 is restarting in SoftAP mode (192.168.4.1)...');
    onFactoryReset();
    setTimeout(() => setStatusMessage(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          Standard ESP32 System Core & Architecture Specifications
        </h3>
        <p className="text-[12px] text-slate-400 mb-4">
          TARA runs natively on Espressif Xtensa 32-bit LX6 dual-core silicon. The framework is strictly architected for standard ESP32 boards (ESP32-D0WDQ6/WROOM-32).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">CPU ARCHITECTURE</div>
            <div className="text-cyan-400 font-bold mt-1">Xtensa Dual-Core LX6</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">CLOCK FREQUENCY</div>
            <div className="text-cyan-400 font-bold mt-1">240 MHz</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">ON-CHIP SRAM</div>
            <div className="text-emerald-400 font-bold mt-1">520 KB</div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">SPI FLASH MEMORY</div>
            <div className="text-slate-200 font-bold mt-1">4 MB (QIO)</div>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-lg bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Partition Map & Device Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Flash Partition Map */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            Standard ESP32 Partition Table Layout
          </h4>
          <p className="text-[12px] text-slate-400">
            Configured in <code className="text-cyan-400 font-mono">min_spiffs.csv</code> to accommodate dual OTA application slots and non-volatile flash parameters:
          </p>

          <div className="space-y-2 font-mono text-xs">
            <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
              <span className="text-cyan-400 font-bold">nvs (Preferences)</span>
              <span className="text-slate-400">0x9000 (20 KB)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
              <span className="text-cyan-400 font-bold">otadata</span>
              <span className="text-slate-400">0xe000 (8 KB)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
              <span className="text-emerald-400 font-bold">app0 (Active Firmware)</span>
              <span className="text-slate-400">0x10000 (1.9 MB)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
              <span className="text-amber-400 font-bold">app1 (OTA Inactive Slot)</span>
              <span className="text-slate-400">0x200000 (1.9 MB)</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800 flex justify-between">
              <span className="text-slate-300 font-bold">spiffs (Web Assets)</span>
              <span className="text-slate-400">0x3f0000 (190 KB)</span>
            </div>
          </div>
        </div>

        {/* Maintenance Controls */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Device Maintenance & Power Controls
            </h4>
            <p className="text-[12px] text-slate-400 mb-4">
              Trigger software restarts or restore factory default state via standard REST endpoints.
            </p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">Reboot ESP32</div>
                  <div className="text-[11px] text-slate-400">Performs soft ESP.restart()</div>
                </div>
                <button
                  onClick={handleRestart}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Now
                </button>
              </div>

              <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/40 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-400">Factory Reset</div>
                  <div className="text-[11px] text-slate-400">Erases Wi-Fi & AI secret credentials</div>
                </div>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm shadow-red-500/30"
                >
                  Reset Robot
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            TARA Companion Firmware v{systemInfo.firmwareVersion} | Platform: {systemInfo.hardwarePlatform}
          </div>
        </div>
      </div>

      {/* Safety Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-base font-bold">Confirm Factory Reset?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently erase your saved Wi-Fi SSID, network password, custom AI API keys, and companion memories stored in the ESP32 Flash Memory (`Preferences`).
            </p>
            <p className="text-xs text-amber-400">
              TARA will reboot immediately into SoftAP Provisioning Mode (<span className="font-mono">192.168.4.1</span>).
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-lg text-xs transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-lg text-xs transition-all shadow-lg shadow-red-500/20"
              >
                Erase & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
