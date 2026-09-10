import React, { useState } from 'react';
import { BrainSettings, RobotState, RobotEmotion } from '../types';
import { Brain, Sparkles, Send, Lock, Cpu, Server, Key, Sliders, CheckCircle2, MessageSquare } from 'lucide-react';

interface TabBrainProps {
  brainSettings: BrainSettings;
  onUpdateBrain: (settings: Partial<BrainSettings>) => void;
  onTriggerResponse?: (state: RobotState, emotion: RobotEmotion, text: string) => void;
}

export const TabBrain: React.FC<TabBrainProps> = ({
  brainSettings,
  onUpdateBrain,
  onTriggerResponse,
}) => {
  const [provider, setProvider] = useState<'cloud' | 'local'>(brainSettings.provider);
  const [endpoint, setEndpoint] = useState(brainSettings.endpoint);
  const [apiKey, setApiKey] = useState(brainSettings.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState(brainSettings.model);
  const [temperature, setTemperature] = useState(brainSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(brainSettings.maxTokens);
  const [isSaved, setIsSaved] = useState(false);

  // Test Chat state
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ role: 'user' | 'tara'; text: string; emotion?: RobotEmotion }>>([
    {
      role: 'tara',
      text: "Hello! I am TARA, your modular physical companion robot. How can I help you today?",
      emotion: 'CALM',
    },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBrain({
      provider,
      endpoint,
      apiKey,
      model,
      temperature,
      maxTokens,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt.trim();
    setPrompt('');
    setChatLog((prev) => [...prev, { role: 'user', text: userText }]);

    // Trigger THINKING state on OLED
    setIsThinking(true);
    if (onTriggerResponse) {
      onTriggerResponse('THINKING', 'CURIOSITY', 'Thinking...');
    }

    // Companion-toned response generator with emotional parsing
    setTimeout(() => {
      setIsThinking(false);
      let reply = '';
      let targetEmotion: RobotEmotion = 'JOY';
      let targetState: RobotState = 'SPEAKING';

      const lower = userText.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        reply = "Hello there! I'm delighted to see you. My dual-core ESP32 is running smoothly!";
        targetEmotion = 'JOY';
        targetState = 'HAPPY';
      } else if (lower.includes('joke') || lower.includes('funny')) {
        reply = "Why did the ESP32 go to school? To sharpen its Wi-Fi antenna and improve its byte size!";
        targetEmotion = 'JOY';
        targetState = 'HAPPY';
      } else if (lower.includes('who are you') || lower.includes('what are you')) {
        reply = "I am TARA, a modular AI companion robot designed specifically for standard ESP32 microcontrollers. I have an expressive OLED face and live local web configuration!";
        targetEmotion = 'CURIOSITY';
        targetState = 'SPEAKING';
      } else if (lower.includes('weather') || lower.includes('time')) {
        reply = "Looking at local telemetry: ESP32 CPU is 240MHz, battery voltage is 4.18V, and the room feels pleasant!";
        targetEmotion = 'CALM';
        targetState = 'SPEAKING';
      } else if (lower.includes('sleep') || lower.includes('goodnight')) {
        reply = "Goodnight! I'll dim my eyes and enter power-saving rest mode.";
        targetEmotion = 'DROWSY';
        targetState = 'SLEEPING';
      } else {
        reply = `I heard: "${userText}". That is fascinating! My brain module processed that via ${model} in 320ms.`;
        targetEmotion = 'CURIOSITY';
        targetState = 'SPEAKING';
      }

      setChatLog((prev) => [...prev, { role: 'tara', text: reply, emotion: targetEmotion }]);
      if (onTriggerResponse) {
        onTriggerResponse(targetState, targetEmotion, reply);
      }
    }, 1400);
  };

  return (
    <div className="space-y-6">
      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Column */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              Model Provider & AI Router
            </h3>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
              Decoupled Architecture
            </span>
          </div>

          <p className="text-[12px] text-slate-400 mb-4">
            TARA connects to cloud endpoints (OpenAI, Gemini, custom proxy) or private home servers (Ollama) via non-blocking HTTP requests. Secrets are kept in NVS flash.
          </p>

          {isSaved && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AI Brain configuration saved to ESP32 Flash Storage!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Provider Tabs */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Model Provider Archetype
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProvider('cloud');
                    setEndpoint('https://api.openai.com/v1/chat/completions');
                    setModel('gpt-4o-mini');
                  }}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs ${
                    provider === 'cloud'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Server className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold">Cloud REST API</div>
                    <div className="text-[10px] opacity-70">OpenAI / Gemini / Proxy</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProvider('local');
                    setEndpoint('http://192.168.1.50:11434/api/generate');
                    setModel('llama3.2:1b');
                  }}
                  className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all text-xs ${
                    provider === 'local'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <div className="font-bold">Local Home Server</div>
                    <div className="text-[10px] opacity-70">Ollama / LocalAI</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                HTTP/HTTPS Completion Endpoint
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://..."
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>API Secret Key (Stored in NVS)</span>
                <span className="text-[11px] text-slate-500 font-normal">Optional for local Ollama</span>
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={provider === 'local' ? 'None required' : 'sk-...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Model Name & Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Temperature</span>
                  <span className="font-mono text-cyan-400">{temperature}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 mt-2"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-sm transition-all shadow-lg shadow-cyan-500/20"
              >
                Save AI Brain Configuration
              </button>
            </div>
          </form>
        </div>

        {/* Live Interaction Playground Column */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col h-[520px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Live AI Companion Chat
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Simulates I2S Audio/Text</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                    msg.role === 'user'
                      ? 'bg-cyan-600 text-white rounded-br-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  {msg.emotion && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400 font-mono">
                      <span>Face Action:</span>
                      <span className="bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        {msg.emotion}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>TARA is thinking (OLED switched to THINKING)...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form onSubmit={handleSendPrompt} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask TARA something (e.g. Tell me a joke)..."
              disabled={isThinking}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isThinking || !prompt.trim()}
              className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 p-2 rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
