import React, { useState } from 'react';
import { VoiceSettings, RobotState, RobotEmotion } from '../types';
import { Volume2, Mic, Play, Square, Settings, Radio, Sparkles, CheckCircle2 } from 'lucide-react';

interface TabVoiceProps {
  voiceSettings: VoiceSettings;
  onUpdateVoice: (settings: Partial<VoiceSettings>) => void;
  onTriggerSpeech?: (text: string) => void;
  onTriggerListen?: () => void;
}

export const TabVoice: React.FC<TabVoiceProps> = ({
  voiceSettings,
  onUpdateVoice,
  onTriggerSpeech,
  onTriggerListen,
}) => {
  const [volume, setVolume] = useState(voiceSettings.volume);
  const [ttsLanguage, setTtsLanguage] = useState(voiceSettings.ttsLanguage);
  const [ttsEndpoint, setTtsEndpoint] = useState(voiceSettings.ttsEndpoint);
  const [testText, setTestText] = useState('Hello! My name is TARA. I am ready to talk with you!');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVoice({
      volume,
      ttsLanguage,
      ttsEndpoint,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handlePlayVoice = () => {
    if (!testText.trim()) return;
    setIsPlaying(true);
    if (onTriggerSpeech) onTriggerSpeech(testText);

    // Browser Web Speech API fallback for instant auditory preview
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.rate = 1.05;
      utterance.pitch = 1.25;
      utterance.volume = volume / 100;
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlaying(false), 2500);
    }
  };

  const handleStopVoice = () => {
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleToggleListen = () => {
    if (!isListening) {
      setIsListening(true);
      if (onTriggerListen) onTriggerListen();
      setTimeout(() => {
        setIsListening(false);
      }, 3500);
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Voice Architecture Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          Modular Voice & Audio Architecture
        </h3>
        <p className="text-[12px] text-slate-400 mb-4">
          TARA uses Google Translate TTS (gTTS) service streaming — keeping speech synthesis free, fast, and lightweight without heavy cloud token bills or paid ElevenLabs subscriptions.
        </p>

        {/* Pipeline Diagram */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
          <span className="text-cyan-400">User Speech</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-slate-300">INMP441 (GPIO 34)</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-slate-300">STT Service</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-amber-400">TARA Brain</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-emerald-400">gTTS Service</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-slate-300">MAX98357A (GPIO 19)</span>
          <span className="text-slate-600">&rarr;</span>
          <span className="text-cyan-400">Speaker Sound</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            Audio Output & Speech Synthesis Settings
          </h4>

          {savedNotice && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Voice settings updated on ESP32!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Volume */}
            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                <span>Hardware Speaker Volume (I2S Gain)</span>
                <span className="text-cyan-400 font-mono font-bold">{volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full accent-cyan-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Mute (0%)</span>
                <span>Normal (60-80%)</span>
                <span>Max (100%)</span>
              </div>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Spoken Language (TTS Locale)
              </label>
              <select
                value={ttsLanguage}
                onChange={(e) => setTtsLanguage(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="en">English (US/UK - en)</option>
                <option value="es">Spanish (es)</option>
                <option value="fr">French (fr)</option>
                <option value="de">German (de)</option>
                <option value="ja">Japanese (ja)</option>
                <option value="zh">Chinese (zh-CN)</option>
                <option value="it">Italian (it)</option>
                <option value="hi">Hindi (hi)</option>
              </select>
            </div>

            {/* TTS Endpoint */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                TTS Proxy / Gateway URL
              </label>
              <input
                type="url"
                value={ttsEndpoint}
                onChange={(e) => setTtsEndpoint(e.target.value)}
                placeholder="https://translate.google.com/translate_tts"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Zero-cost Google Translate TTS proxy formatted with standard query parameters.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                Save Audio & TTS Settings
              </button>
            </div>
          </form>
        </div>

        {/* Live Audio Test Column */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Live Voice Synthesizer Test
            </h4>
            <p className="text-[12px] text-slate-400 mb-3">
              Test speaker speech rendering. When speech plays, TARA's OLED mouth waveform animates in real-time.
            </p>

            <textarea
              rows={3}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text for TARA to speak..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 mb-3 resize-none"
            />

            <div className="flex gap-2">
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={handlePlayVoice}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  Speak Text (Speaker & Face Test)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleStopVoice}
                  className="flex-1 bg-red-500 hover:bg-red-400 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                >
                  <Square className="w-4 h-4" />
                  Stop Speech Playback
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-amber-400" />
              I2S Microphone Test (INMP441)
            </h4>
            <p className="text-[12px] text-slate-400 mb-3">
              Trigger microphone capture state to test listening state and visual audio bars on OLED.
            </p>

            <button
              type="button"
              onClick={handleToggleListen}
              className={`w-full font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 ${
                isListening
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Mic className="w-4 h-4" />
              {isListening ? 'Listening (Microphone Active)...' : 'Test Trigger Listening Mode'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
