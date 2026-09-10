import React, { useState } from 'react';
import { PersonalitySettings } from '../types';
import { Sparkles, Heart, Sliders, CheckCircle2, UserCheck, Flame, MessageCircle } from 'lucide-react';

interface TabPersonalityProps {
  personality: PersonalitySettings;
  onUpdatePersonality: (settings: Partial<PersonalitySettings>) => void;
}

export const TabPersonality: React.FC<TabPersonalityProps> = ({
  personality,
  onUpdatePersonality,
}) => {
  const [name, setName] = useState(personality.name);
  const [primaryTrait, setPrimaryTrait] = useState(personality.primaryTrait);
  const [speakingStyle, setSpeakingStyle] = useState(personality.speakingStyle);
  const [energyLevel, setEnergyLevel] = useState(personality.energyLevel);
  const [wakeWordEnabled, setWakeWordEnabled] = useState(personality.wakeWordEnabled);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePersonality({
      name,
      primaryTrait,
      speakingStyle,
      energyLevel,
      wakeWordEnabled,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            Companion Identity & Personality Engine
          </h3>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            Model-Agnostic Core
          </span>
        </div>
        <p className="text-[12px] text-slate-400">
          TARA's personality traits and companion identity are stored permanently in ESP32 Flash memory (`Preferences` NVS). Changing or upgrading the underlying AI language model will never erase TARA's unique character.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Column */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Identity Attributes
          </h4>

          {savedNotice && (
            <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Companion identity updated in ESP32 NVS!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Companion Robot Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="TARA"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Primary Core Traits
              </label>
              <input
                type="text"
                value={primaryTrait}
                onChange={(e) => setPrimaryTrait(e.target.value)}
                placeholder="Curious, empathetic, witty, supportive"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Speaking Style
              </label>
              <select
                value={speakingStyle}
                onChange={(e) => setSpeakingStyle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="Warm and concise">Warm & Concise (EMO-inspired companion)</option>
                <option value="Playful and curious">Playful & Curious</option>
                <option value="Calm and meditative">Calm & Meditative</option>
                <option value="Technical and analytical">Technical & Analytical</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" /> Energy & Dynamism Level
                </span>
                <span className="text-amber-400 font-mono font-bold">{energyLevel}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                <span>Gentle / Calm</span>
                <span>Balanced</span>
                <span>High Energy / Bubbly</span>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={wakeWordEnabled}
                  onChange={(e) => setWakeWordEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <span>Wake Word Activation ("Hey TARA")</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2.5 px-4 rounded-lg text-xs transition-all shadow-lg shadow-cyan-500/20"
            >
              Save Personality Traits
            </button>
          </form>
        </div>

        {/* Identity Preview Card */}
        <div className="space-y-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              Generated Companion Prompt Context
            </h4>
            <p className="text-[12px] text-slate-400 mb-3">
              This system context header is dynamically injected into every LLM query:
            </p>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1.5 overflow-x-auto">
              <div>// System Prompt Injected to Brain Provider:</div>
              <div className="text-slate-300">
                "You are {name}, a physical AI companion robot. Your personality traits are{' '}
                <span className="text-amber-400">{primaryTrait}</span>. Speak in a{' '}
                <span className="text-cyan-400">{speakingStyle.toLowerCase()}</span> tone with an energy level of{' '}
                {energyLevel}%. Keep responses concise (under 2 sentences) because they will be read aloud on a physical I2S speaker."
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
