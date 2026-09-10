import React, { useState } from 'react';
import { HardwarePinDef } from '../types';
import { Cpu, Zap, Sliders, CheckCircle2, AlertCircle, Compass, Radio } from 'lucide-react';

export const TabHardware: React.FC = () => {
  const [ledMode, setLedMode] = useState<'off' | 'solid' | 'blink' | 'breathe'>('breathe');
  const [panAngle, setPanAngle] = useState(90);
  const [tiltAngle, setTiltAngle] = useState(90);
  const [isTouched, setIsTouched] = useState(false);

  const pins: HardwarePinDef[] = [
    { label: 'OLED Display (SDA)', gpio: 21, description: 'I2C Data line for SSD1306', functionType: 'I2C', status: 'active' },
    { label: 'OLED Display (SCL)', gpio: 22, description: 'I2C Clock line for SSD1306', functionType: 'I2C', status: 'active' },
    { label: 'I2S Audio (BCLK)', gpio: 26, description: 'Bit Clock shared between Mic & Speaker', functionType: 'I2S', status: 'active' },
    { label: 'I2S Audio (LRC/WS)', gpio: 25, description: 'Word Select shared clock', functionType: 'I2S', status: 'active' },
    { label: 'I2S Speaker DAC (DOUT)', gpio: 19, description: 'Audio Output to MAX98357A DIN', functionType: 'I2S', status: 'active' },
    { label: 'I2S Mic (DIN)', gpio: 34, description: 'Audio Input from INMP441 DOUT (Input-only pin)', functionType: 'I2S', status: 'active' },
    { label: 'Status LED', gpio: 2, description: 'Onboard blue LED (indicator & breathe pattern)', functionType: 'GPIO', status: 'active' },
    { label: 'Action / BOOT Button', gpio: 0, description: 'Physical BOOT button (Active LOW)', functionType: 'GPIO', status: 'active' },
    { label: 'Capacitive Head Touch', gpio: 4, description: 'Touch0 sensor pad on robot head shell', functionType: 'TOUCH', status: 'active' },
    { label: 'Battery Monitor (ADC)', gpio: 35, description: 'ADC1 channel for 2:1 resistor divider (Input-only)', functionType: 'ADC', status: 'active' },
    { label: 'Neck Pan Servo', gpio: 13, description: 'Horizontal head rotation (PWM / LEDC channel 0)', functionType: 'GPIO', status: 'optional' },
    { label: 'Neck Tilt Servo', gpio: 14, description: 'Vertical head tilt (PWM / LEDC channel 1)', functionType: 'GPIO', status: 'optional' },
  ];

  return (
    <div className="space-y-6">
      {/* Centralized Hardware Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Centralized Standard ESP32 Hardware Pinout
          </h3>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            HardwareConfig.h
          </span>
        </div>
        <p className="text-[12px] text-slate-400 mb-3">
          All GPIO numbers are strictly centralized in <code className="text-cyan-400 font-mono">firmware/src/hardware/HardwareConfig.h</code>. There are zero magic pin numbers scattered in source code.
          All pins strictly target standard ESP32 (ESP32-D0WDQ6/WROOM-32).
        </p>
      </div>

      {/* Pinout Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-200 mb-4">Standard ESP32 Pin Allocation Map</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="pb-3 pr-4">Function Label</th>
                <th className="pb-3 pr-4">Standard Pin</th>
                <th className="pb-3 pr-4">Bus / Type</th>
                <th className="pb-3 pr-4">Wiring Description</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {pins.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 pr-4 font-sans font-medium text-slate-200">{p.label}</td>
                  <td className="py-2.5 pr-4 text-cyan-400 font-bold">GPIO {p.gpio}</td>
                  <td className="py-2.5 pr-4 text-slate-400">{p.functionType}</td>
                  <td className="py-2.5 pr-4 font-sans text-slate-400 text-[11px]">{p.description}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                        p.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Peripherals Playground */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LED Controller */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Status LED Controller (GPIO 2)
          </h4>
          <p className="text-[12px] text-slate-400 mb-4">
            Test status LED patterns used to indicate Wi-Fi provisioning, network activity, and standby mode.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {(['off', 'solid', 'blink', 'breathe'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setLedMode(m)}
                className={`py-2 px-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                  ledMode === m
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-3">
            <div
              className={`w-4 h-4 rounded-full transition-all ${
                ledMode === 'off'
                  ? 'bg-slate-700'
                  : ledMode === 'solid'
                  ? 'bg-cyan-400 shadow-lg shadow-cyan-400'
                  : ledMode === 'blink'
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            ></div>
            <span className="text-xs text-slate-300 font-mono">
              Pattern: <span className="text-cyan-400 font-bold uppercase">{ledMode}</span>
            </span>
          </div>
        </div>

        {/* Neck Servos & Touch Sensor */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-400" />
            Servos & Touch Sensors
          </h4>

          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 font-semibold mb-1">
              <span>Neck Pan Angle (GPIO 13)</span>
              <span className="font-mono text-cyan-400">{panAngle}&deg;</span>
            </div>
            <input
              type="range"
              min="30"
              max="150"
              value={panAngle}
              onChange={(e) => setPanAngle(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs text-slate-300 font-semibold mb-1">
              <span>Neck Tilt Angle (GPIO 14)</span>
              <span className="font-mono text-cyan-400">{tiltAngle}&deg;</span>
            </div>
            <input
              type="range"
              min="45"
              max="135"
              value={tiltAngle}
              onChange={(e) => setTiltAngle(parseInt(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={() => setIsTouched(!isTouched)}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                isTouched
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              {isTouched ? 'Touch Active: Head Stroked (Triggering Happy Emotion)' : 'Test Touch Head Sensor (GPIO 4)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
