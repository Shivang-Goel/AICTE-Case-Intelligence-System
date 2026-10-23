import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  ExternalLink,
  HelpCircle,
  Sparkles,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { ComplaintCase } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const SeverityQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  // Override Modal
  const [targetCase, setTargetCase] = useState<ComplaintCase | null>(null);
  const [newSeverity, setNewSeverity] = useState<string>('HIGH');
  const [overrideReason, setOverrideReason] = useState('');
  const [savingOverride, setSavingOverride] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getSeverityQueue();
      setQueue(res.queue);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOverride = (c: ComplaintCase) => {
    setTargetCase(c);
    setNewSeverity(c.severityLevel);
    setOverrideReason('Officer inspection conducted; facts warrant adjusted classification.');
  };

  const handleSubmitOverride = async () => {
    if (!targetCase || !overrideReason) return;
    try {
      setSavingOverride(true);
      await api.overrideSeverity(targetCase.id, newSeverity, overrideReason);
      setTargetCase(null);
      loadQueue();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingOverride(false);
    }
  };

  const filteredQueue = queue.filter(c => {
    if (filterLevel === 'ALL') return true;
    if (filterLevel === 'SAFETY_URGENT') return c.isSafetyUrgent;
    return c.severityLevel === filterLevel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500 animate-pulse" />
            Severity & Urgency Triage Queue
          </h1>
          <p className="text-xs text-slate-400">
            Explainable risk indexing engine prioritizing student physical safety, fire/structural hazards, and urgent statutory deadlines.
          </p>
        </div>
      </div>

      {/* Safety Mandatory Notice */}
      <div className="bg-red-950/60 border border-red-600/80 rounded-2xl p-4 flex items-start space-x-3 text-xs text-red-200 shadow-xl">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-red-300">
            Statutory Student Life & Campus Safety Protocol (Rule RULE-SEC-01)
          </p>
          <p className="leading-relaxed">
            Allegations involving ragging, physical intimidation, or unverified fire safety NOCs are deterministically classified as 
            <span className="font-bold text-white px-1"> CRITICAL </span>
            with mandatory 24–48h physical inquiries, irrespective of linguistic sentiment or tone. AI scores serve as recommendations for authorized human officers.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs overflow-x-auto">
        <span className="text-slate-400 font-semibold flex-shrink-0">Triage Filter:</span>
        <button
          onClick={() => setFilterLevel('ALL')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          All Active ({queue.length})
        </button>
        <button
          onClick={() => setFilterLevel('SAFETY_URGENT')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'SAFETY_URGENT' ? 'bg-red-600 text-white' : 'bg-red-950/40 text-red-300 border border-red-800'
          }`}
        >
          Mandatory Safety Files ({queue.filter(c => c.isSafetyUrgent).length})
        </button>
        <button
          onClick={() => setFilterLevel('CRITICAL')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'CRITICAL' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          CRITICAL
        </button>
        <button
          onClick={() => setFilterLevel('HIGH')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'HIGH' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          HIGH
        </button>
        <button
          onClick={() => setFilterLevel('TIME_SENSITIVE')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'TIME_SENSITIVE' ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          TIME-SENSITIVE
        </button>
        <button
          onClick={() => setFilterLevel('NORMAL')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterLevel === 'NORMAL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          NORMAL
        </button>
      </div>

      {/* Queue Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Computing severity triage hierarchy...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueue.map(c => (
            <div
              key={c.id}
              className={`rounded-2xl p-5 border shadow-xl transition space-y-3 ${
                c.isSafetyUrgent
                  ? 'bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-red-700/80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                    {c.caseNumber}
                  </span>
                  <StatusBadge type="severity" value={c.severityLevel} size="md" />
                  <StatusBadge type="status" value={c.status} size="md" />
                  {c.isSafetyUrgent && (
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-600 text-xs font-bold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                      Immediate Life Safety Triage
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400">
                    Severity Score: <span className="font-mono font-bold text-white text-sm">{c.severityScore}/100</span>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">
                    Target: <span className="font-mono text-amber-300 font-bold">{new Date(c.deadlineDate).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>

              {/* Title & Allegation */}
              <div>
                <h3
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="text-base font-bold text-white hover:text-blue-300 cursor-pointer transition flex items-center gap-1.5"
                >
                  <span>{c.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{c.description}</p>
              </div>

              {/* Explainable Evidence Box */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Diagnostic Rule Matched:</span>
                  <span className="font-mono text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900">
                    {c.severityRuleMatched}
                  </span>
                </div>
                <p className="text-slate-300">
                  <span className="text-slate-400 font-semibold">Triage Evidence: </span>
                  {c.severityReason}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Target Institution: <span className="font-semibold text-slate-200">{c.institutionName}</span> ({c.permanentId})</span>
                  <span>Bureau: <span className="font-semibold text-slate-200">{c.bureauName}</span></span>
                </div>
              </div>

              {/* Footer controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <span>Open Full Procedural Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleOpenOverride(c)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                >
                  Officer Severity Override
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Override Modal */}
      {targetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Authorized Officer Severity Override</h3>
            <p className="text-xs text-slate-400">
              Case: {targetCase.caseNumber} — {targetCase.institutionName}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Adjusted Severity Level</label>
              <select
                value={newSeverity}
                onChange={e => setNewSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="TIME_SENSITIVE">TIME-SENSITIVE</option>
                <option value="NORMAL">NORMAL</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Statutory Justification *</label>
              <textarea
                rows={4}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="State basis for manual adjustment..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setTargetCase(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitOverride}
                disabled={savingOverride}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {savingOverride ? 'Logging Override...' : 'Apply & Record in Audit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
