import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Building2,
  RefreshCw,
  Layers,
  ArrowRight,
  ExternalLink,
  HelpCircle,
  FileText,
  User,
  Clock,
  Check,
} from 'lucide-react';
import { api } from '../services/api';
import { CrossBureauConflictAlert } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ConflictCentrePage: React.FC = () => {
  const [conflicts, setConflicts] = useState<CrossBureauConflictAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Decision Modal
  const [selectedConflict, setSelectedConflict] = useState<CrossBureauConflictAlert | null>(null);
  const [targetStatus, setTargetStatus] = useState<'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'>('ACKNOWLEDGED');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadConflicts();
  }, [statusFilter]);

  const loadConflicts = async () => {
    try {
      setLoading(true);
      const res = await api.getConflicts(statusFilter);
      setConflicts(res.conflicts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setScanning(true);
      const res = await api.triggerConflictScan();
      setScanMessage(`Scan finished: ${res.activeConflictsCount} active collision scenarios detected across all bureaus.`);
      loadConflicts();
      setTimeout(() => setScanMessage(null), 5000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setScanning(false);
    }
  };

  const handleOpenActionModal = (c: CrossBureauConflictAlert, status: 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED') => {
    setSelectedConflict(c);
    setTargetStatus(status);
    setResolutionNotes(
      status === 'RESOLVED'
        ? 'Joint coordination committee convened. Inspection dates harmonized and orders aligned.'
        : status === 'ACKNOWLEDGED'
        ? 'Acknowledged by bureau heads; joint review scheduled.'
        : 'Reviewed and dismissed: inquiries focus on independent distinct faculties.'
    );
  };

  const handleSubmitDecision = async () => {
    if (!selectedConflict) return;
    try {
      setProcessing(true);
      await api.updateConflictStatus(selectedConflict.id, targetStatus, resolutionNotes);
      setSelectedConflict(null);
      loadConflicts();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            Cross-Bureau Conflict Prevention Centre
          </h1>
          <p className="text-xs text-slate-400">
            Detects uncoordinated actions, duplicate investigations, and contradictory directives issued by different AICTE statutory cells on the same institution.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleTriggerScan}
            disabled={scanning}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Repository...' : 'Run Collision Scan'}</span>
          </button>
        </div>
      </div>

      {/* Scan Feedback Banner */}
      {scanMessage && (
        <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500 text-blue-200 text-xs font-semibold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span>{scanMessage}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
        <span className="text-slate-400 font-semibold">Filter Status:</span>
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
            statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          All ({conflicts.length})
        </button>
        <button
          onClick={() => setStatusFilter('ACTIVE')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
            statusFilter === 'ACTIVE' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Active Collisions
        </button>
        <button
          onClick={() => setStatusFilter('ACKNOWLEDGED')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
            statusFilter === 'ACKNOWLEDGED' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Acknowledged
        </button>
        <button
          onClick={() => setStatusFilter('RESOLVED')}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
            statusFilter === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
          }`}
        >
          Resolved
        </button>
      </div>

      {/* Conflicts List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
          <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs">Analyzing multi-bureau collision matrices...</p>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No cross-bureau conflicts found in this category.</p>
          <p className="text-xs text-slate-500">All bureaus are functioning with coordinated oversight.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {conflicts.map(conf => (
            <div
              key={conf.id}
              className={`rounded-2xl p-6 shadow-xl border space-y-4 transition ${
                conf.status === 'ACTIVE'
                  ? 'bg-gradient-to-b from-red-950/40 via-slate-900 to-slate-900 border-red-600/70'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                      {conf.permanentId}
                    </span>
                    <StatusBadge type="conflict" value={conf.status} size="md" />
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
                      {conf.conflictType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3
                    onClick={() => navigate(`/institutions/${conf.institutionId}`)}
                    className="text-base font-extrabold text-white hover:text-blue-300 cursor-pointer transition flex items-center gap-1.5"
                  >
                    <span>{conf.institutionName}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </h3>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span>Detected: {new Date(conf.detectedAt).toLocaleDateString()}</span>
                  {conf.acknowledgedBy && (
                    <p className="text-[10px] text-amber-300">Ack by: {conf.acknowledgedBy}</p>
                  )}
                </div>
              </div>

              {/* Summary & Recommended Coordination */}
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider block mb-1">
                    Conflict Diagnostic Summary
                  </span>
                  {conf.summary}
                </div>

                <div className="p-3 rounded-xl bg-red-950/50 border border-red-700/60 text-red-200 leading-relaxed">
                  <span className="font-bold uppercase text-[10px] tracking-wider block mb-1 text-red-300">
                    Recommended Inter-Bureau Coordination Directive
                  </span>
                  {conf.recommendedAction}
                </div>
              </div>

              {/* Involved Bureaus & Inquiries Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  Colliding Inquiries across Bureaus ({conf.bureausInvolved.length})
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {conf.bureausInvolved.map((b, idx) => (
                    <div
                      key={idx}
                      onClick={() => navigate(`/cases/${b.caseId}`)}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500 cursor-pointer transition space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{b.bureauName}</span>
                        <StatusBadge type="status" value={b.status} />
                      </div>
                      <p className="font-mono text-blue-400 font-bold text-[11px]">{b.caseNumber}</p>
                      <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{b.assignedOfficer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/institutions/${conf.institutionId}`)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>Open Institution 360° Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center space-x-2">
                  {conf.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleOpenActionModal(conf, 'ACKNOWLEDGED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                    >
                      Acknowledge Conflict
                    </button>
                  )}
                  {conf.status !== 'RESOLVED' && (
                    <button
                      onClick={() => handleOpenActionModal(conf, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                    >
                      Resolve & Harmonize
                    </button>
                  )}
                  {conf.status !== 'DISMISSED' && (
                    <button
                      onClick={() => handleOpenActionModal(conf, 'DISMISSED')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conflict Decision Modal */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">
              Update Conflict Status: {targetStatus}
            </h3>
            <p className="text-xs text-slate-400">
              Institution: {selectedConflict.institutionName} ({selectedConflict.permanentId})
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Action Resolution Notes *</label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Detail the inter-bureau harmonization agreement..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedConflict(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitDecision}
                disabled={processing}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                {processing ? 'Recording...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
