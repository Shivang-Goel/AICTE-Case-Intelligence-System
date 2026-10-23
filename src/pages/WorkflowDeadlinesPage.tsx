import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const WorkflowDeadlinesPage: React.FC = () => {
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'CRITICAL_WINDOW'>('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    loadDeadlines();
  }, []);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const res = await api.getDeadlines();
      setDeadlines(res.deadlines);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = deadlines.filter(d => {
    if (filterType === 'OVERDUE') return d.isOverdue;
    if (filterType === 'CRITICAL_WINDOW') return d.isAtRisk;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-400" />
          Workflow, Statutory Deadlines & SLA Accountability
        </h1>
        <p className="text-xs text-slate-400">
          Proactive monitoring of investigation windows, overdue show-cause compliance, and pending duration metrics across AICTE bureaus.
        </p>
      </div>

      {/* KPI SLA Tracker Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-red-800/60 shadow space-y-1">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">Overdue SLA Inquiries</span>
            <AlertTriangle className="w-4 h-4 animate-bounce" />
          </div>
          <p className="text-2xl font-black text-red-300">
            {deadlines.filter(d => d.isOverdue).length} Cases
          </p>
          <p className="text-[10px] text-red-400/80">Lapsed target date requiring urgent escalation</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-amber-800/60 shadow space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">At-Risk Window (&lt; 48 Hours)</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-300">
            {deadlines.filter(d => d.isAtRisk).length} Cases
          </p>
          <p className="text-[10px] text-amber-400/80">Approaching statutory expiration deadline</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Tracked Cases</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{deadlines.length}</p>
          <p className="text-[10px] text-slate-400">Inquiries currently under active SLA monitoring</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
        <span className="text-slate-400 font-semibold">Deadline Filter:</span>
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterType === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          All Active Cases ({deadlines.length})
        </button>
        <button
          onClick={() => setFilterType('OVERDUE')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterType === 'OVERDUE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Overdue Only
        </button>
        <button
          onClick={() => setFilterType('CRITICAL_WINDOW')}
          className={`px-3 py-1 rounded-md font-medium transition ${
            filterType === 'CRITICAL_WINDOW' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          At-Risk Window (&lt; 48h)
        </button>
      </div>

      {/* Deadlines Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs">Computing SLA timelines and hours remaining...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Case Number</th>
                  <th className="py-3 px-4">Subject & Target Institution</th>
                  <th className="py-3 px-4">Bureau</th>
                  <th className="py-3 px-4">Investigating Officer</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Statutory Deadline</th>
                  <th className="py-3 px-4">Hours Remaining</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filtered.map(d => {
                  const c = d.case;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className={`hover:bg-slate-850 cursor-pointer transition ${
                        d.isOverdue
                          ? 'bg-red-950/20'
                          : d.isAtRisk
                          ? 'bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                        {c.caseNumber}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-white truncate">{c.title}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{c.institutionName}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{c.bureauName}</td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{c.assignedOfficer}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge type="status" value={c.status} />
                      </td>
                      <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-200">
                        {new Date(c.deadlineDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {d.isOverdue ? (
                          <span className="font-mono font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-700">
                            OVERDUE ({Math.abs(d.hoursRemaining)}h)
                          </span>
                        ) : d.isAtRisk ? (
                          <span className="font-mono font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-700">
                            {d.hoursRemaining}h remaining
                          </span>
                        ) : (
                          <span className="font-mono text-emerald-400">
                            {d.hoursRemaining}h remaining
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-end gap-1">
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
