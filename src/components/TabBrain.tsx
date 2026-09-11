import React, { useState } from 'react';
import { BrainSettings, RobotState, RobotEmotion } from '../types';
import { Brain, Sparkles, Send, Lock, Cpu, Server, Key, Sliders, CheckCircle2, MessageSquare, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

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
  const [providerType, setProviderType] = useState<string>(brainSettings.providerType || 'openai');
  const [endpoint, setEndpoint] = useState(brainSettings.endpoint);
  const [newApiKey, setNewApiKey] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(brainSettings.hasKey ?? true);
  const [allowCustom, setAllowCustom] = useState(brainSettings.allowCustom || false);
  const [model, setModel] = useState(brainSettings.model);
  const [temperature, setTemperature] = useState(brainSettings.temperature);
  const [maxTokens, setMaxTokens] = useState(brainSettings.maxTokens);
  const [isSaved, setIsSaved] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

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

  const handleProviderSelect = (type: string) => {
    setProviderType(type);
    setValidationError(null);

    switch (type) {
      case 'openai':
        setEndpoint('https://api.openai.com/v1/chat/completions');
        setModel('gpt-4o-mini');
        break;
      case 'gemini':
        setEndpoint('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions');
        setModel('gemini-1.5-flash');
        break;
      case 'deepseek':
        setEndpoint('https://api.deepseek.com/v1/chat/completions');
        setModel('deepseek-chat');
        break;
      case 'local_ollama':
        setEndpoint('http://192.168.1.50:11434/api/generate');
        setModel('llama3.2:1b');
        break;
      case 'custom':
        // Keep current or set default custom
        if (!endpoint || endpoint.includes('api.openai') || endpoint.includes('googleapis') || endpoint.includes('deepseek')) {
          setEndpoint('https://my-proxy.example.com/v1/chat/completions');
        }
        break;
    }
  };

  const validateEndpoint = (): boolean => {
    if (providerType === 'local_ollama') {
      return true; // Local LAN is permitted for Ollama
    }

    if (!endpoint.startsWith('https://')) {
      setValidationError('Security Violation: Cloud AI endpoints strictly require HTTPS with TLS validation.');
      return false;
    }

    // SSRF checks
    const lower = endpoint.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1') || lower.includes('0.0.0.0')) {
      setValidationError('SSRF Protection Violation: Cloud endpoints cannot point to loopback (localhost / 127.0.0.1).');
      return false;
    }

    if (lower.includes('192.168.') || lower.includes('10.') || lower.includes('172.16.')) {
      setValidationError('SSRF Protection Violation: Cloud providers cannot target private RFC1918 internal IPs. Select "Local Ollama" mode instead.');
      return false;
    }

    if (providerType === 'custom' && !allowCustom) {
      setValidationError('Custom endpoints require checking "Confirm Custom Endpoint" below.');
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEndpoint()) return;

    onUpdateBrain({
      provider: providerType === 'local_ollama' ? 'local' : 'cloud',
      providerType: providerType as any,
      endpoint,
      apiKey: newApiKey ? newApiKey : (hasStoredKey ? '********' : ''),
      hasKey: hasStoredKey || !!newApiKey,
      allowCustom,
      model,
      temperature,
      maxTokens,
    });

    if (newApiKey) {
      setHasStoredKey(true);
      setNewApiKey('');
    }

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
      onTriggerResponse('THINKING', 'CURIOSITY', 'Processing thought...');
    }

    // Mock deterministic response for simulation / testing
    setTimeout(() => {
      setIsThinking(false);
      let reply = '';
      let targetEmotion: RobotEmotion = 'JOY';
      let targetState: RobotState = 'SPEAKING';

      const lower = userText.toLowerCase();
      if (lower.includes('hello') || lower.includes('hi')) {
        reply = "Hello there! My sensors and brain are active on the standard ESP32!";
        targetEmotion = 'JOY';
        targetState = 'SPEAKING';
      } else if (lower.includes('who are you') || lower.includes('what are you')) {
        reply = "I am TARA, a modular AI companion robot designed specifically for standard ESP32 microcontrollers. I have an expressive OLED face and live authenticated configuration!";
        targetEmotion = 'CURIOSITY';
        targetState = 'SPEAKING';
      } else if (lower.includes('weather') || lower.includes('telemetry')) {
        reply = "Local telemetry: Xtensa LX6 @ 240MHz, 320KB RAM, battery 4.18V. All subsystems nominal!";
        targetEmotion = 'CALM';
        targetState = 'SPEAKING';
      } else if (lower.includes('sleep') || lower.includes('goodnight')) {
        reply = "Goodnight! Dimming OLED and entering low-power sleep.";
        targetEmotion = 'DROWSY';
        targetState = 'SLEEPING';
      } else {
        reply = `I heard: "${userText}". That is fascinating! My brain module processed that via ${model} with full TLS validation.`;
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
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-500" />
              Model Provider & AI Router
            </h3>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
              TLS & SSRF Protected
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            TARA connects to cloud endpoints (OpenAI, Gemini, DeepSeek) or private home servers (Ollama). API keys are kept in NVS flash and never exposed in cleartext through the API.
          </p>

          {isSaved && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI Brain configuration securely saved and validated!</span>
            </div>
          )}

          {validationError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Provider Options */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Select Model Provider
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderSelect('openai')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    providerType === 'openai'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">OpenAI</div>
                  <div className="text-[10px] opacity-70">gpt-4o-mini</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('gemini')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    providerType === 'gemini'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">Google Gemini</div>
                  <div className="text-[10px] opacity-70">gemini-1.5-flash</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('deepseek')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    providerType === 'deepseek'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">DeepSeek</div>
                  <div className="text-[10px] opacity-70">deepseek-chat</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('local_ollama')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                    providerType === 'local_ollama'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">Local Ollama</div>
                  <div className="text-[10px] opacity-70">LAN / Private Home</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('custom')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs col-span-2 sm:col-span-1 ${
                    providerType === 'custom'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold">Custom Proxy</div>
                  <div className="text-[10px] opacity-70">Enforces HTTPS</div>
                </button>
              </div>
            </div>

            {/* Endpoint */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Completion Endpoint URL</span>
                {providerType !== 'custom' && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    Provider Default
                  </span>
                )}
              </label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                readOnly={providerType !== 'custom' && providerType !== 'local_ollama'}
                placeholder="https://..."
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {providerType === 'custom' && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmCustom"
                    checked={allowCustom}
                    onChange={(e) => setAllowCustom(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="confirmCustom" className="text-[11px] text-slate-500 dark:text-slate-400">
                    Confirm Custom Endpoint (Strict HTTPS required. Loopback and internal IPs rejected).
                  </label>
                </div>
              )}
            </div>

            {/* API Key Protection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Secret API Key</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  {hasStoredKey ? '● Stored securely in NVS' : 'No key configured'}
                </span>
              </label>
              <div className="space-y-1.5">
                <input
                  type="password"
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={hasStoredKey ? '●●●●●●●● (Enter new key to replace)' : 'Enter API secret key (sk-...)'}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  Raw API keys are never read back or exposed by the ESP32 REST API.
                </p>
              </div>
            </div>

            {/* Model Name & Temperature */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Temperature</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">{temperature}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              Save & Validate Brain Settings
            </button>
          </form>
        </div>

        {/* Real-Time Brain Interactive Sandbox */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Interactive AI Sandbox
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              OLED Face Synced
            </span>
          </div>

          <div className="flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl p-3 border border-slate-200 dark:border-slate-800 overflow-y-auto max-h-[320px] space-y-2.5 text-xs">
            {chatLog.map((msg, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl max-w-[85%] ${
                  msg.role === 'user'
                    ? 'ml-auto bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-750 rounded-bl-none shadow-xs'
                }`}
              >
                {msg.role === 'tara' && (
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                    <span>TARA</span>
                    {msg.emotion && <span className="opacity-70">({msg.emotion})</span>}
                  </div>
                )}
                <p>{msg.text}</p>
              </div>
            ))}
            {isThinking && (
              <div className="bg-white dark:bg-slate-850 text-slate-500 dark:text-slate-400 p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 w-fit text-xs italic flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>Thinking & parsing model response...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendPrompt} className="mt-4 flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Send message to TARA..."
              disabled={isThinking}
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isThinking || !prompt.trim()}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
