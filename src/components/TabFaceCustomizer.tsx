/**
 * TabFaceCustomizer.tsx
 * Interactive gallery for all 34+ TARA facial expressions, eye shapes, and mouth tuning.
 */

import React, { useState } from 'react';
import { Sparkles, Eye, Smile, Sliders, Check } from 'lucide-react';
import { animationCoordinator } from '../services/AnimationCoordinator';
import { expressionManager } from '../services/ExpressionManager';
import { ExpressionConfig, TaraExpression } from '../types';

export const TabFaceCustomizer: React.FC = () => {
  const [currentExp, setCurrentExp] = useState<TaraExpression>(animationCoordinator.getExpression());
  const [search, setSearch] = useState('');
  const allExpressions = expressionManager.getAllExpressions();

  const handleSelectExpression = (name: TaraExpression) => {
    setCurrentExp(name);
    animationCoordinator.setExpression(name);
  };

  const filtered = allExpressions.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 text-slate-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Facial Expressions Gallery
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                34 Expressions
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Procedural vector eyes, brows, pupils, cheeks, and mouths rendered inside the screen
            </p>
          </div>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter expressions..."
          className="bg-slate-950 border border-slate-700 text-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 outline-none w-48 font-mono"
        />
      </div>

      {/* Grid of expressions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filtered.map((item) => {
          const isActive = currentExp === item.name;
          return (
            <button
              key={item.name}
              onClick={() => handleSelectExpression(item.name)}
              className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between h-24 ${
                isActive
                  ? 'bg-amber-500/20 border-amber-500/60 shadow-lg shadow-amber-950/40 text-white'
                  : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-300 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold truncate">{item.label}</span>
                {isActive && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              </div>
              <div className="text-[10px] font-mono text-slate-400 space-y-0.5">
                <div className="truncate">Eye: {item.eyeState}</div>
                <div className="truncate">Mouth: {item.mouthState}</div>
                {item.blush && <div className="text-pink-400">Blush: Yes</div>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
