import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, AlertCircle, Bot } from 'lucide-react';
import { apiService } from '../services/apiService';

interface LoginPageProps {
  onLoginSuccess: () => void;
  isSimulationMode: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, isSimulationMode }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the device password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await apiService.login(password);
    setIsLoading(false);

    if (res.success) {
      onLoginSuccess();
    } else {
      if (res.lockedOut) {
        setIsLockedOut(true);
        setRemainingSeconds(res.remainingSec || 30);
      }
      setError(res.error || 'Invalid device password');
    }
  };

  const handleUseSetupPin = () => {
    setPassword('tara-admin');
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-8 relative overflow-hidden">
        {/* Top Accent line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 mb-4 shadow-sm text-emerald-600 dark:text-emerald-400">
            <Bot className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">TARA</h1>
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
            Robot Configuration
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Standard ESP32 Dual-Core • Authenticated Control Panel
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error}</p>
              {isLockedOut && (
                <p className="text-xs mt-1 text-rose-600 dark:text-rose-400">
                  Brute-force protection enabled. Lockout active for {remainingSeconds} seconds.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Device Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password or setup PIN"
                disabled={isLoading || isLockedOut}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm transition-colors"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isLockedOut}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Login to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {isSimulationMode && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Hardware-Free Simulation Mode is active.
            </p>
            <button
              type="button"
              onClick={handleUseSetupPin}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Use Default Setup PIN (<span className="font-mono">tara-admin</span>)
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-500">
          <p>Protected by constant-time SHA256 & Bearer session tokens.</p>
          <p className="mt-0.5">Sessions are RAM-only and invalidated upon ESP32 reboot.</p>
        </div>
      </div>
    </div>
  );
};
