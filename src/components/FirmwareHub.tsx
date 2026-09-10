import React, { useState } from 'react';
import { FIRMWARE_FILES, FirmwareFile } from '../firmwareCodeData';
import { Code2, Download, Copy, Check, FileCode, Folder, ExternalLink, Cpu } from 'lucide-react';
import JSZip from 'jszip';

export const FirmwareHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FirmwareFile>(FIRMWARE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isZipping, setIsZipping] = useState(false);

  const categories = ['All', 'Core', 'Hardware', 'Face', 'Voice', 'Brain', 'Wi-Fi', 'Memory', 'Storage', 'Web', 'Config'];

  const filteredFiles = selectedCategory === 'All'
    ? FIRMWARE_FILES
    : FIRMWARE_FILES.filter((f) => f.category === selectedCategory);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();
      const firmwareFolder = zip.folder('TARA-Firmware-ESP32');

      // Add all firmware files
      FIRMWARE_FILES.forEach((f) => {
        firmwareFolder?.file(f.path, f.code);
      });

      // Add comprehensive build guide
      firmwareFolder?.file(
        'BUILD_INSTRUCTIONS.txt',
        `========================================================================
TARA - Modular AI Companion Robot Framework (v0.1.0)
Hardware Target: Standard ESP32 (ESP32-D0WDQ6 / ESP32-WROOM-32)
========================================================================

HOW TO COMPILE WITH ARDUINO IDE:
1. Open Arduino IDE -> Preferences -> Additional Board URLs:
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
2. Boards Manager -> Install "esp32 by Espressif Systems"
3. Select Board: "ESP32 Dev Module" or "NodeMCU-32S"
4. Open TARA.ino
5. Click Upload!

HOW TO COMPILE WITH PLATFORMIO:
1. cd TARA-Firmware-ESP32
2. pio run --target upload
3. pio device monitor -b 115200

CENTRALIZED GPIO PIN MAP (Standard ESP32):
- OLED Display SDA: GPIO 21
- OLED Display SCL: GPIO 22
- I2S Audio BCLK: GPIO 26
- I2S Audio LRC / WS: GPIO 25
- I2S Speaker Amp DOUT: GPIO 19 (MAX98357A)
- I2S Mic DIN: GPIO 34 (INMP441 - Input Only)
- Status LED: GPIO 2
- BOOT Button: GPIO 0
- Head Touch Pad: GPIO 4 (Touch0)
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'TARA_ESP32_Firmware_v0.1.0.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate zip:', err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-400" />
              ESP32 Firmware Source Code Repository
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">
              v0.1.0-alpha
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete, production-ready Arduino & PlatformIO C++ firmware. Pure standard ESP32 implementation without S3/C3 dependencies. Zero magic numbers, fully modularized.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25 shrink-0 self-start md:self-auto"
        >
          <Download className="w-4 h-4" />
          {isZipping ? 'Packaging ZIP Archive...' : 'Download Full ESP32 Firmware (.ZIP)'}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[620px]">
        {/* File Tree List */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col overflow-hidden">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-2">
            Repository Files ({filteredFiles.length})
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-xs font-mono">
            {filteredFiles.map((file) => (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  selectedFile.path === file.path
                    ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <div className="truncate flex-1">
                  <div className="truncate">{file.path}</div>
                  <div className="text-[10px] text-slate-500 font-sans truncate">{file.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Code Viewer */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden shadow-2xl">
          {/* File Header Bar */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold text-slate-200">{selectedFile.path}</span>
              <span className="text-[10px] font-sans text-slate-400 hidden sm:inline">
                &bull; {selectedFile.description}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Text Area */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#060911]">
            <pre className="whitespace-pre">
              <code>{selectedFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
