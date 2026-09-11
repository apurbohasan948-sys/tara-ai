import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Play, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, FileText, Lock } from 'lucide-react';
import { SecurityTestResult, SecurityLogEntry } from '../types';
import { apiService } from '../services/apiService';

export const SecurityTestPanel: React.FC = () => {
  const [results, setResults] = useState<SecurityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'logs'>('tests');
  const [securityLogs, setSecurityLogs] = useState<SecurityLogEntry[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    const testResults = await apiService.runSecurityTestSuite();
    setResults(testResults);
    setSecurityLogs(apiService.getSecurityLogs());
    setIsRunning(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const passCount = results.filter((r) => r.status === 'pass').length;
  const failCount = results.filter((r) => r.status === 'fail').length;

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Security Vulnerability Audit Suite</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated security compliance verification for standard ESP32 companion robot
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                {passCount} PASS
              </span>
              {failCount > 0 && (
                <span className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  {failCount} FAIL
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={runAllTests}
              disabled={isRunning}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Auditing...' : 'Run All 14 Tests'}</span>
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'tests'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Vulnerability Audit Tests ({results.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setSecurityLogs(apiService.getSecurityLogs());
              setActiveTab('logs');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'logs'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ESP32 Security Event Log ({securityLogs.length})
          </button>
        </div>
      </div>

      {activeTab === 'tests' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-xl border transition-all ${
                test.status === 'pass'
                  ? 'bg-white dark:bg-slate-900 border-emerald-500/30 dark:border-emerald-500/20'
                  : 'bg-white dark:bg-slate-900 border-rose-500/40 dark:border-rose-500/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center font-mono">
                    {test.id}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{test.name}</h4>
                </div>

                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    test.status === 'pass'
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {test.status === 'pass' ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> PASS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="w-3 h-3 text-rose-500" /> FAIL
                    </span>
                  )}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{test.description}</p>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 text-[11px] font-mono">
                <div className="text-slate-500 dark:text-slate-400 flex items-start gap-1">
                  <span className="text-slate-400 font-sans font-medium min-w-[55px]">Expected:</span>
                  <span className="text-slate-700 dark:text-slate-300">{test.expected}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 flex items-start gap-1">
                  <span className="text-slate-400 font-sans font-medium min-w-[55px]">Result:</span>
                  <span className={test.status === 'pass' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                    {test.actual}
                  </span>
                </div>
                {test.detail && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-800">
                    {test.detail}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Compact ESP32 Security Audit Log (Circular Buffer)</span>
            </h3>
            <span className="text-xs text-slate-400">Secrets (API keys, passwords) strictly redacted</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Client IP</th>
                  <th className="py-2.5 px-3">Sanitized Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                {securityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                      No security events recorded yet.
                    </td>
                  </tr>
                ) : (
                  securityLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                      <td className="py-2 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                        {log.event}
                      </td>
                      <td className="py-2 px-3 text-slate-500">
                        {new Date(log.timestamp * 1000).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{log.ip}</td>
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-200">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
