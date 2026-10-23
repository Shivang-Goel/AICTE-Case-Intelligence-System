import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  FileText,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { api } from '../services/api';
import { Institution, ComplaintCase, CrossBureauConflictAlert, CaseRelationshipSuggestion } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const Institution360Page: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState<Institution | null>(null);
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [conflicts, setConflicts] = useState<CrossBureauConflictAlert[]>([]);
  const [suggestions, setSuggestions] = useState<CaseRelationshipSuggestion[]>([]);
  const [bureausInvolved, setBureausInvolved] = useState<{ bureauName: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      load360(id);
    }
  }, [id]);

  const load360 = async (instId: string) => {
    try {
      setLoading(true);
      const res = await api.getInstitutionById(instId);
      setInstitution(res.institution);
      setCases(res.cases);
      setConflicts(res.conflicts);
      setSuggestions(res.suggestions);
      setBureausInvolved(res.bureausInvolved);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load institution 360 profile.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Aggregating cross-bureau records for 360° dossier...</p>
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-red-500/30 rounded-xl space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Institution Profile Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'Requested college record does not exist.'}</p>
        <button
          onClick={() => navigate('/institutions')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Return to Directory
        </button>
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status !== 'CLOSED');
  const criticalCases = cases.filter(c => c.severityLevel === 'CRITICAL' && c.status !== 'CLOSED');

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/institutions')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Institutions Directory</span>
        </button>

        <button
          onClick={() => navigate('/intake')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Register Complaint for this Institute</span>
        </button>
      </div>

      {/* 360° Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black text-blue-400 px-2.5 py-1 rounded bg-blue-950 border border-blue-800/80">
                {institution.permanentId}
              </span>
              <StatusBadge type="risk" value={institution.riskCategory} size="md" />
              {institution.naacGrade && (
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold">
                  NAAC Grade: {institution.naacGrade}
                </span>
              )}
              {institution.nbaAccredited && (
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold">
                  NBA Accredited
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black text-white">{institution.name}</h1>

            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{institution.address}</span>
            </div>
          </div>

          {/* Risk Gauge Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center flex-shrink-0 min-w-44 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Institutional Risk Index
            </span>
            <div className="flex items-baseline justify-center space-x-1">
              <span className={`text-3xl font-black font-mono ${
                institution.riskScore >= 75 ? 'text-red-400' :
                institution.riskScore >= 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {institution.riskScore}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ 100</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {institution.riskCategory} PRIORITY PROFILE
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Active Complaints</span>
            <span className="text-base font-bold text-blue-400 mt-0.5 block">{activeCases.length} open</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Critical Safety Files</span>
            <span className="text-base font-bold text-red-400 mt-0.5 block">{criticalCases.length} urgent</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Approved Intake</span>
            <span className="text-base font-bold text-white mt-0.5 block">{institution.approvedIntake} seats</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Involved Bureaus</span>
            <span className="text-base font-bold text-indigo-400 mt-0.5 block">{bureausInvolved.length} cells</span>
          </div>
        </div>
      </div>

      {/* Cross-Bureau Conflict Alert (if active) */}
      {conflicts.length > 0 && (
        <div className="bg-red-950/60 border border-red-600 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-600/30 text-red-300 border border-red-500/40">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-red-200 uppercase tracking-wide">
                Active Cross-Bureau Conflicts Detected on this Entity
              </h3>
              <p className="text-xs text-red-300">
                Multiple statutory cells have uncoordinated actions that may cause contradictory orders or duplicate inspections.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {conflicts.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-red-700/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-300 uppercase tracking-wider">{c.conflictType.replace(/_/g, ' ')}</span>
                  <StatusBadge type="conflict" value={c.status} />
                </div>
                <p className="text-slate-200 leading-snug">{c.summary}</p>
                <div className="p-2.5 rounded bg-red-950/40 border border-red-800/40 text-[11px] text-red-200">
                  <span className="font-bold">Recommended Coordination Action: </span>
                  {c.recommendedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Involved Bureaus Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          Statutory Bureaus with Active/Historical Dossiers on this Institution
        </h3>
        <div className="flex flex-wrap gap-2">
          {bureausInvolved.map((b, idx) => (
            <div key={idx} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2">
              <span className="font-semibold text-white">{b.bureauName}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-950 text-blue-300 font-bold text-[10px]">
                {b.count} cases
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Cases Associated with Institution */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              All Associated Cases & Inquiries ({cases.length})
            </h3>
          </div>
        </div>

        {cases.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No complaints recorded for this institution.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Bureau</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Assigned Officer</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {cases.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/cases/${c.id}`)}
                    className="hover:bg-slate-850 cursor-pointer transition"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-400 whitespace-nowrap">{c.caseNumber}</td>
                    <td className="py-2.5 px-3 font-medium text-white max-w-sm truncate">{c.title}</td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{c.bureauName}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge type="severity" value={c.severityLevel} />
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge type="status" value={c.status} />
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{c.assignedOfficer}</td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <span className="text-blue-400 hover:text-blue-300 font-semibold flex items-center justify-end gap-1">
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
