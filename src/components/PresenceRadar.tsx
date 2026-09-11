import React, { useEffect, useState } from 'react';
import { PresenceInfo, PresenceSensorType } from '../types';
import { presenceManager, MockPresenceSensor } from '../services/PresenceManager';
import { Radio, UserCheck, UserX, Volume2, Clock, AlertCircle } from 'lucide-react';

export const PresenceRadar: React.FC = () => {
  const [info, setInfo] = useState<PresenceInfo>(presenceManager.getInfo());
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);

  useEffect(() => {
    const unsub = presenceManager.subscribe((newInfo) => {
      setInfo(newInfo);
    });

    const interval = setInterval(() => {
      const now = Date.now();
      const current = presenceManager.getInfo();
      const elapsed = now - current.lastGreetingTime;
      const remaining = Math.max(0, Math.ceil((current.greetingCooldownMs - elapsed) / 1000));
      setCooldownRemainingSec(remaining);
    }, 1000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleSensorTypeChange = (type: PresenceSensorType) => {
    presenceManager.setSensor(new MockPresenceSensor(type));
  };

  const handleDetectPerson = (dist: number) => {
    presenceManager.triggerPersonDetected(dist);
  };

  const handlePersonLeft = () => {
    presenceManager.triggerPersonLeft();
  };

  const handleAudioActivity = () => {
    presenceManager.triggerAudioActivity();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Presence & Proximity Sensor Matrix
          </h4>
        </div>

        {/* Sensor selector */}
        <div className="flex items-center gap-1.5">
          {(['ULTRASONIC', 'PIR', 'TOF', 'NONE'] as PresenceSensorType[]).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => handleSensorTypeChange(st)}
              className={`text-[9px] font-mono px-2 py-0.5 rounded border transition-all ${
                info.sensorType === st
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {st === 'NONE' ? 'NO-SENSOR' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Radar Status Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
        {/* Presence State */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">PRESENCE STATE</div>
            <div className={`text-xs font-bold font-mono mt-0.5 ${
              info.state === 'PERSON_NEAR' ? 'text-emerald-400' :
              info.state === 'PERSON_DETECTED' ? 'text-cyan-400' :
              info.state === 'PERSON_LEFT' ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {info.state}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800">
            {info.state === 'NO_PERSON' ? (
              <UserX className="w-4 h-4 text-slate-500" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
            )}
          </div>
        </div>

        {/* Proximity Distance */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">TARGET DISTANCE</div>
            <div className="text-xs font-bold text-white font-mono mt-0.5">
              {info.sensorType === 'NONE' ? 'N/A (No Sensor)' : `${info.distanceCm} cm`}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-800 font-mono text-[10px] text-cyan-400">
            {info.distanceCm < 60 ? 'NEAR' : info.distanceCm < 150 ? 'MID' : 'FAR'}
          </div>
        </div>

        {/* Greeting Cooldown */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 font-mono">GREETING COOLDOWN</div>
            <div className="text-xs font-bold font-mono mt-0.5 text-amber-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {cooldownRemainingSec > 0 ? `${cooldownRemainingSec}s remaining` : 'Ready to Greet'}
            </div>
          </div>
          <div className="text-[9px] font-mono text-slate-500 text-right">
            Min: 5m
          </div>
        </div>
      </div>

      {/* Audio Activity Alert Banner */}
      {info.audioActivityDetected && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 text-[11px] text-indigo-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400 animate-ping" />
          <span>Microphone detected <strong>AUDIO_ACTIVITY</strong> (distinct from physical human proximity)</span>
        </div>
      )}

      {info.sensorType === 'NONE' && (
        <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-[10px] text-slate-300 flex items-center gap-1.5 font-mono">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>No-Sensor Mode active: TARA uses harmless time & inactivity autonomy instead of physical proximity.</span>
        </div>
      )}

      {/* Quick Test Trigger Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handleDetectPerson(45)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm flex items-center gap-1.5"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Detect Person (Near ~45cm)</span>
        </button>

        <button
          type="button"
          onClick={() => handleDetectPerson(140)}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-sm flex items-center gap-1.5"
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Detect Person (Mid ~140cm)</span>
        </button>

        <button
          type="button"
          onClick={handlePersonLeft}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
        >
          <UserX className="w-3.5 h-3.5" />
          <span>Person Left</span>
        </button>

        <button
          type="button"
          onClick={handleAudioActivity}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 transition-all flex items-center gap-1.5"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Simulate Audio/Clap Activity</span>
        </button>
      </div>
    </div>
  );
};
