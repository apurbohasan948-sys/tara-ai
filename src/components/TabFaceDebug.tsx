import React, { useEffect, useState } from 'react';
import { expressionManager } from '../services/ExpressionManager';
import { activitySceneManager } from '../services/ActivitySceneManager';
import { armController } from '../services/ArmController';
import {
  RobotEmotion,
  RobotActivity,
  ArmGesture,
  AnimationEventLogEntry,
  ScenePropsState,
  SceneType,
} from '../types';
import {
  Bug,
  Activity,
  Sparkles,
  Flame,
  CloudRain,
  Mic,
  BookOpen,
  Music,
  Trash2,
  Clock,
  Layers,
  Smile,
  Zap,
} from 'lucide-react';

interface TabFaceDebugProps {
  currentEmotion: RobotEmotion;
  currentActivity: RobotActivity;
  onEmotionChange: (emotion: RobotEmotion) => void;
  onActivityChange: (activity: RobotActivity) => void;
}

export const TabFaceDebug: React.FC<TabFaceDebugProps> = ({
  currentEmotion,
  currentActivity,
  onEmotionChange,
  onActivityChange,
}) => {
  const [logEntries, setLogEntries] = useState<AnimationEventLogEntry[]>([]);
  const [propsState, setPropsState] = useState<ScenePropsState>(activitySceneManager.getProps());
  const [currentScene, setCurrentScene] = useState<SceneType>(activitySceneManager.getCurrentScene());
  const [armState, setArmState] = useState(armController.getState());
  const [tempDuration, setTempDuration] = useState(2500);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  useEffect(() => {
    const unsubLog = activitySceneManager.subscribeLog((entries) => setLogEntries([...entries]));
    const unsubScene = activitySceneManager.subscribeScene((scene, props) => {
      setCurrentScene(scene);
      setPropsState({ ...props });
    });
    const unsubArm = armController.subscribe((s) => setArmState({ ...s }));

    return () => {
      unsubLog();
      unsubScene();
      unsubArm();
    };
  }, []);

  const effectiveEmotion = expressionManager.getCurrentEffectiveEmotion();
  const baseEmotion = expressionManager.getBaseEmotion();
  const isTemp = expressionManager.isTemporaryActive();
  const profile = expressionManager.getProfile(effectiveEmotion);
  const layerState = expressionManager.getLayerState();

  const allEmotions = expressionManager.getAvailableEmotions();

  const handleTestEmotion = (emo: RobotEmotion, temporary: boolean) => {
    if (temporary) {
      expressionManager.pushTemporaryExpression(emo, tempDuration);
      activitySceneManager.logEvent('EMOTION', `Pushed temporary expression: ${emo} (${tempDuration}ms)`);
    } else {
      expressionManager.setBaseEmotion(emo);
      onEmotionChange(emo);
      activitySceneManager.logEvent('EMOTION', `Set base emotion: ${emo}`);
    }
  };

  const handleToggleProp = (propKey: keyof ScenePropsState) => {
    const nextVal = !propsState[propKey];
    activitySceneManager.setProp(propKey, nextVal);
  };

  const handleTestArm = (gesture: ArmGesture) => {
    armController.triggerGesture(gesture, 3000);
    activitySceneManager.logEvent('ARM', `Triggered arm gesture: ${gesture}`);
  };

  const handleClearLog = () => {
    activitySceneManager.logEvent('SYSTEM', 'Log cleared by user');
  };

  const filteredLogs = filterCategory === 'ALL'
    ? logEntries
    : logEntries.filter((e) => e.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-cyan-400" />
            Face & Animation Event Debug Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline diagnostics, 45+ expression triggers, scene prop controls, and timeline event telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Priority: <strong className="text-cyan-400">{activitySceneManager.getCurrentPriority()}</strong>
          </span>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Scene: <strong className="text-amber-400">{currentScene}</strong>
          </span>
        </div>
      </div>

      {/* Real-time State & Layers Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Layer 1 & 2: Emotion State */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Smile className="w-4 h-4 text-cyan-400" />
            Emotion Pipeline
          </div>
          <div className="text-sm font-mono text-slate-200">
            Visible: <strong className="text-cyan-400 font-bold">{effectiveEmotion}</strong>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Base: <span className="text-slate-300">{baseEmotion}</span>
          </div>
          <div className="text-xs font-mono">
            Overlay Active: {isTemp ? <span className="text-amber-400 font-bold">YES (Temp)</span> : <span className="text-slate-500">NO</span>}
          </div>
          {isTemp && (
            <button
              onClick={() => expressionManager.clearTemporaryExpression()}
              className="text-[10px] px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 hover:bg-rose-900"
            >
              Clear Overlay
            </button>
          )}
        </div>

        {/* Layer 3: Activity & Scene */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" />
            Activity / Scene
          </div>
          <div className="text-sm font-mono text-slate-200">
            Activity: <strong className="text-emerald-400 font-bold">{currentActivity}</strong>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Scene: <span className="text-slate-300">{currentScene}</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Stage: <span className="text-amber-400">{activitySceneManager.getCurrentStage()}</span>
          </div>
        </div>

        {/* Eye & Mouth Micro-State */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-purple-400" />
            Face Geometry
          </div>
          <div className="text-xs font-mono text-slate-300">
            Eye Shape: <span className="text-purple-400 font-semibold">{profile.eyeShape}</span>
          </div>
          <div className="text-xs font-mono text-slate-300">
            Mouth: <span className="text-purple-400 font-semibold">{profile.mouthShape}</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Pupil: {profile.pupilDilation.toFixed(2)}x | Blink: {profile.eyeBlinkPattern || 'NORMAL'}
          </div>
        </div>

        {/* Arm Servos State */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Zap className="w-4 h-4 text-amber-400" />
            Servos & Gestures
          </div>
          <div className="text-xs font-mono text-slate-300">
            Gesture: <span className="text-amber-400 font-semibold">{armState.activeGesture}</span>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Left: {armState.leftAngle}° ({armState.leftHand})
          </div>
          <div className="text-xs font-mono text-slate-400">
            Right: {armState.rightAngle}° ({armState.rightHand})
          </div>
        </div>
      </div>

      {/* Manual Props Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          Interactive Scene Props (Immediate OLED Render Overrides)
        </h3>
        <p className="text-xs text-slate-400">
          Toggle scene props to verify layered rendering on the OLED canvas in real-time.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {[
            { key: 'flame', label: 'Stove Flame', icon: Flame, activeColor: 'bg-amber-600 text-white' },
            { key: 'steam', label: 'Pot Steam', icon: CloudRain, activeColor: 'bg-sky-600 text-white' },
            { key: 'potCooking', label: 'Cooking Pot', icon: Flame, activeColor: 'bg-orange-600 text-white' },
            { key: 'spoonStirring', label: 'Stirring Spoon', icon: Activity, activeColor: 'bg-amber-500 text-slate-950' },
            { key: 'microphone', label: 'Microphone', icon: Mic, activeColor: 'bg-cyan-600 text-white' },
            { key: 'musicNotes', label: 'Music Notes', icon: Music, activeColor: 'bg-pink-600 text-white' },
            { key: 'book', label: 'Reading Book', icon: BookOpen, activeColor: 'bg-emerald-600 text-white' },
          ].map((item) => {
            const isAct = !!propsState[item.key as keyof ScenePropsState];
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => handleToggleProp(item.key as keyof ScenePropsState)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition ${
                  isAct
                    ? `${item.activeColor} border-transparent shadow-md`
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span>{item.label}</span>
                <span className="text-[10px] font-mono mt-0.5 opacity-80">{isAct ? 'ON' : 'OFF'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Arm Gestures Trigger Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          Arm & Hand Gesture Test Triggers
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ARM_WAVE', label: 'Wave Right Arm' },
            { id: 'ARM_CELEBRATE', label: 'Celebrate / Both Arms' },
            { id: 'ARM_STIR', label: 'Cooking Stir Spoon' },
            { id: 'ARM_HOLD_MIC', label: 'Hold Microphone' },
            { id: 'ARM_HOLD_BOOK', label: 'Hold Book' },
            { id: 'ARM_THUMBS_UP', label: 'Thumbs Up' },
            { id: 'ARM_POINT', label: 'Point Forward' },
            { id: 'ARM_THINK', label: 'Thinking Hand' },
            { id: 'ARM_SAD_MOVE', label: 'Droop Arms (Sad)' },
            { id: 'ARM_IDLE', label: 'Reset Safe Rest' },
          ].map((g) => (
            <button
              key={g.id}
              onClick={() => handleTestArm(g.id as ArmGesture)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Comprehensive 45+ Facial Expressions Tester */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Facial Expression Catalog (45+ Parametric Expressions)
            </h3>
            <p className="text-xs text-slate-400">
              Click to trigger as Base Emotion (persistent) or Temporary Reaction (with auto-revert).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Temp Duration:</span>
            <select
              value={tempDuration}
              onChange={(e) => setTempDuration(Number(e.target.value))}
              className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
            >
              <option value={1500}>1.5s</option>
              <option value={2500}>2.5s</option>
              <option value={4000}>4.0s</option>
              <option value={6000}>6.0s</option>
            </select>
          </div>
        </div>

        {/* Expression Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {allEmotions.map((emo) => {
            const isCurrent = effectiveEmotion === emo;
            return (
              <div key={emo} className="flex flex-col gap-1">
                <button
                  onClick={() => handleTestEmotion(emo, false)}
                  className={`px-2 py-1.5 rounded text-[11px] font-mono font-medium truncate text-center border transition ${
                    isCurrent
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                  }`}
                  title={`Set Base: ${emo}`}
                >
                  {emo}
                </button>
                <button
                  onClick={() => handleTestEmotion(emo, true)}
                  className="text-[9px] font-mono py-0.5 px-1 rounded bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-center transition"
                  title={`Test as temporary reaction (${tempDuration}ms)`}
                >
                  +Temp
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Animation Event Log (Telemetry) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200">Animation Event Telemetry Log</h3>
            <span className="text-xs font-mono text-slate-500">({logEntries.length} events)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter */}
            <div className="flex gap-1 text-[11px] font-mono">
              {['ALL', 'ACTIVITY', 'SCENE', 'PROP', 'GAME', 'ARM', 'EMOTION'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-2 py-0.5 rounded border transition ${
                    filterCategory === cat
                      ? 'bg-cyan-950 border-cyan-600 text-cyan-300 font-bold'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              onClick={handleClearLog}
              className="flex items-center gap-1 ml-2 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto font-mono text-xs pr-1">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500 text-center py-6 text-xs italic">
              No events recorded yet. Trigger an activity, game move, or emotion to log events.
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start gap-3 p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <span className="text-slate-500 text-[10px] whitespace-nowrap">{entry.timestamp}</span>
                <span
                  className={`px-1.5 py-0.2 text-[9px] rounded font-bold uppercase whitespace-nowrap ${
                    entry.category === 'ACTIVITY'
                      ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                      : entry.category === 'SCENE'
                      ? 'bg-purple-950 border border-purple-800 text-purple-300'
                      : entry.category === 'PROP'
                      ? 'bg-amber-950 border border-amber-800 text-amber-300'
                      : entry.category === 'GAME'
                      ? 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                      : entry.category === 'ARM'
                      ? 'bg-sky-950 border border-sky-800 text-sky-300'
                      : entry.category === 'EMOTION'
                      ? 'bg-pink-950 border border-pink-800 text-pink-300'
                      : 'bg-slate-800 border border-slate-700 text-slate-400'
                  }`}
                >
                  {entry.category}
                </span>
                <span className="text-slate-200 flex-1">{entry.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
