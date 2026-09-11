/**
 * FirmwareHub.tsx
 * Production ESP32 C++ Firmware Browser, Syntax Viewer, and Downloader.
 */

import React, { useState } from 'react';
import { FIRMWARE_FILES, FirmwareFile } from '../firmwareCodeData';
import { Code2, Download, Copy, Check, FileCode, Cpu, ShieldCheck } from 'lucide-react';

export const FirmwareHub: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<FirmwareFile>(FIRMWARE_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              ESP32-S3 Firmware Codebase
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono border border-emerald-500/30">
                Zero-Motor C++ Architecture
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Complete Arduino / PlatformIO source code configured for SSD1306/SH1106 OLED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Code'}
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download {selectedFile.name}
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* File Tree */}
        <div className="lg:col-span-1 flex flex-col gap-1.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div className="text-[11px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
            Firmware Tree
          </div>
          {FIRMWARE_FILES.map((file) => {
            const isSelected = selectedFile.path === file.path;
            return (
              <button
                key={file.path}
                onClick={() => setSelectedFile(file)}
                className={`w-full text-left px-3 py-2 rounded-lg font-mono flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>

        {/* Code Editor Preview */}
        <div className="lg:col-span-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>{selectedFile.path}</span>
            <span className="text-slate-500">{selectedFile.category}</span>
          </div>
          <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-[420px] leading-relaxed select-all">
            <code>{selectedFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
