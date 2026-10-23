import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Shield,
  Layers,
  Server,
  FileCode,
} from 'lucide-react';
import { api } from '../services/api';

export const SystemHealthPage: React.FC = () => {
  const [health, setHealth] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    loadHealth();
  }, []);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemHealth();
      setHealth(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemo();
      setConfirmResetOpen(false);
      setResetMessage('Database and intelligence registries successfully restored to pristine SIH demonstration seed state.');
      loadHealth();
      setTimeout(() => setResetMessage(null), 6000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setResetting(false);
    }
  };

  if (loading || !health) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Running system diagnostics and engine telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            System Architecture, Engine Diagnostics & Settings
          </h1>
          <p className="text-xs text-slate-400">
            Real-time status of backend services, persistent storage engine, NLP token vectorizer, and fallback modules.
          </p>
        </div>

        <button
          onClick={loadHealth}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Core System */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Operational Status</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-xl font-black text-white">{health.status}</p>
          <p className="text-xs text-slate-300 font-mono">Uptime: {health.performance.uptimeSeconds}s</p>
          <p className="text-[10px] text-slate-400">SIH Problem Statement: {health.problemStatement}</p>
        </div>

        {/* Database Engine */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-blue-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Persistence</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-base font-bold text-white">{health.database.status}</p>
          <p className="text-xs text-slate-300">{health.database.casesCount} Cases • {health.database.institutionsCount} Institutions</p>
          <p className="text-[10px] text-slate-400">{health.database.type}</p>
        </div>

        {/* Memory & Compute */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/40 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memory Allocation</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-base font-bold text-white">{health.performance.heapUsedMb} MB Heap Used</p>
          <p className="text-xs text-slate-300">{health.performance.rssMb} MB Resident Set Size</p>
          <p className="text-[10px] text-slate-400">Node.js + Python Architecture</p>
        </div>
      </div>

      {/* Intelligence Engine Specification Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            AI / Intelligence Engine Subsystems (SIH26264 Architecture)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">1. Semantic Similarity Vectorizer</span>
            <p className="text-slate-300">{health.intelligenceEngine.nlpEngine}</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Tokenizes complaints, removes statutory stop words, computes Jaccard n-gram term overlap, and correlates with permanent AICTE institution ID.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px]">
              {health.intelligenceEngine.fallbackStatus}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-bold text-white block">2. Configurable Urgency & Severity Triage</span>
            <p className="text-slate-300">{health.intelligenceEngine.severityEngine}</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Deterministically prioritizes student safety allegations (ragging, violence, fire hazard) over linguistic sentiment, ensuring mandatory statutory human review.
            </p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px]">
              Rules RULE-SEC-01, VIB-02, PGC-03 Active
            </span>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-amber-600/40 shadow-xl space-y-3">
        <div className="flex items-center space-x-2 text-amber-400">
          <RotateCcw className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider">
            Demonstration State Reset & Re-seeding
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          Resetting the database safely re-seeds the initial demonstration scenario (including the three Apex Institute overlapping cases, cross-bureau conflicts, and initial relationships) without erasing codebase modifications.
        </p>

        <div>
          <button
            onClick={() => setConfirmResetOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition"
          >
            Reset Database to Clean Demo State
          </button>
        </div>
      </div>

      {/* Confirm Reset Modal */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Confirm Demonstration Reset</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to restore the demonstration database? All sample cases, conflicts, and audit entries will return to their default pristine evaluation state.
            </p>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmResetOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDemo}
                disabled={resetting}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                {resetting ? 'Resetting Data...' : 'Yes, Restore Initial State'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
