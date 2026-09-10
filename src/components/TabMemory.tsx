import React, { useState } from 'react';
import { MemoryEntry } from '../types';
import { Database, Plus, Trash2, CheckCircle2, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

export const TabMemory: React.FC = () => {
  const [persistentFacts, setPersistentFacts] = useState<MemoryEntry[]>([
    { id: '1', key: 'owner_name', value: 'Friend', type: 'persistent', timestamp: 'Initial boot' },
    { id: '2', key: 'favorite_topic', value: 'Robotics & Microcontrollers', type: 'persistent', timestamp: 'Today' },
    { id: '3', key: 'home_location', value: 'Desk Lab', type: 'persistent', timestamp: 'Today' },
  ]);

  const [conversationTurns, setConversationTurns] = useState<Array<{ user: string; assistant: string; time: string }>>([
    { user: 'Hello TARA!', assistant: 'Hello! I am TARA, your desktop companion.', time: '2m ago' },
    { user: 'What chip are you running on?', assistant: 'I am running on a standard dual-core ESP32 @ 240MHz!', time: '1m ago' },
  ]);

  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleAddFact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;

    const entry: MemoryEntry = {
      id: Date.now().toString(),
      key: newKey.trim(),
      value: newVal.trim(),
      type: 'persistent',
      timestamp: 'Just now',
    };

    setPersistentFacts((prev) => [...prev, entry]);
    setNewKey('');
    setNewVal('');
    setNotice(`Saved "${entry.key}" to ESP32 Flash Memory.`);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleDeleteFact = (id: string) => {
    setPersistentFacts((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearConversation = () => {
    setConversationTurns([]);
    setNotice('Cleared SRAM conversation buffer.');
    setTimeout(() => setNotice(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          Modular Dual-Tier Memory Architecture
        </h3>
        <p className="text-[12px] text-slate-400 mb-4">
          To operate efficiently within standard ESP32's 520KB SRAM, TARA separates transient conversation flow from durable user facts. Changing AI models never loses stored memories.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-cyan-400 mb-1">Tier 1: SRAM Circular Buffer</div>
            <div className="text-slate-400 text-[11px]">
              Holds last 4 dialog turns in bounded memory. Zero dynamic fragmentation, instant context lookup.
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="font-bold text-emerald-400 mb-1">Tier 2: Persistent NVS Flash</div>
            <div className="text-slate-400 text-[11px]">
              Durable key-value storage (`Preferences`) survives reboots. Stores owner identity & preferences.
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Grid: Persistent Facts & Conversation Turns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Persistent Facts */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-bold text-slate-200">
              Persistent Facts (NVS Key-Value)
            </h4>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
              Flash Partition
            </span>
          </div>

          <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
            {persistentFacts.map((fact) => (
              <div
                key={fact.id}
                className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs"
              >
                <div>
                  <div className="font-mono text-cyan-400 font-bold">{fact.key}</div>
                  <div className="text-slate-200 mt-0.5">{fact.value}</div>
                </div>
                <button
                  onClick={() => handleDeleteFact(fact.id)}
                  className="text-slate-500 hover:text-red-400 p-1 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Fact Form */}
          <form onSubmit={handleAddFact} className="pt-3 border-t border-slate-800 space-y-2">
            <div className="text-xs font-semibold text-slate-300">Add New Learned Fact</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Key (e.g. pet_name)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                placeholder="Value (e.g. Luna)"
                value={newVal}
                onChange={(e) => setNewVal(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-cyan-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Save Fact to Flash
            </button>
          </form>
        </div>

        {/* Right: SRAM Conversation History */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-200">
                Active Conversation Context (SRAM)
              </h4>
              <button
                onClick={handleClearConversation}
                className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Clear Buffer
              </button>
            </div>

            {conversationTurns.length === 0 ? (
              <div className="text-xs text-slate-500 italic py-8 text-center">
                Conversation ring buffer is empty.
              </div>
            ) : (
              <div className="space-y-3">
                {conversationTurns.map((turn, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="font-semibold text-cyan-400">User</span>
                      <span>{turn.time}</span>
                    </div>
                    <p className="text-slate-200">{turn.user}</p>
                    <div className="text-[10px] text-amber-400 font-semibold pt-1">TARA</div>
                    <p className="text-slate-300">{turn.assistant}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
            Capacity: 4 Turns (256 bytes per turn, fixed static allocation).
          </div>
        </div>
      </div>
    </div>
  );
};
