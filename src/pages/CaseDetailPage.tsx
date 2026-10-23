import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  User,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Plus,
  RefreshCw,
  ExternalLink,
  Shield,
  MessageSquare,
  ArrowLeft,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { ComplaintCase, CaseRelationshipSuggestion, Institution, Bureau } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const CaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<ComplaintCase | null>(null);
  const [linkedCases, setLinkedCases] = useState<ComplaintCase[]>([]);
  const [suggestions, setSuggestions] = useState<CaseRelationshipSuggestion[]>([]);
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('UNDER_REVIEW');
  const [statusComment, setStatusComment] = useState('');

  const [showReassignModal, setShowReassignModal] = useState(false);
  const [newOfficerName, setNewOfficerName] = useState('');
  const [reassignReason, setReassignReason] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [targetBureauId, setTargetBureauId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [actionNote, setActionNote] = useState('');

  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [newDeadline, setNewDeadline] = useState('');
  const [nextActionText, setNextActionText] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadCase(id);
    }
  }, [id]);

  const loadCase = async (caseId: string) => {
    try {
      setLoading(true);
      const [res, dashRes] = await Promise.all([
        api.getCaseById(caseId),
        api.getDashboardData(),
      ]);

      setCaseData(res.case);
      setLinkedCases(res.linkedCases);
      setSuggestions(res.candidateSuggestions);
      setInstitution(res.institution || null);

      const bList = dashRes.bureauWorkload.map(b => ({
        id: b.bureauId,
        code: b.code,
        name: b.name,
        description: '',
        headOfficer: '',
        activeCasesCount: b.active,
      }));
      setBureaus(bList);
      if (bList.length > 0) setTargetBureauId(bList[0].id);

      setNewStatus(res.case.status);
      setNewDeadline(res.case.deadlineDate ? res.case.deadlineDate.slice(0, 10) : '');
      setNextActionText(res.case.nextAction || '');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load case dossier.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Handlers
  const handleUpdateStatus = async () => {
    if (!caseData) return;
    try {
      await api.updateCaseStatus(caseData.id, newStatus, statusComment);
      setShowStatusModal(false);
      setStatusComment('');
      showToast(`Case status transitioned to ${newStatus}`);
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReassignOfficer = async () => {
    if (!caseData || !newOfficerName) return;
    try {
      await api.reassignOfficer(caseData.id, newOfficerName, undefined, reassignReason);
      setShowReassignModal(false);
      setNewOfficerName('');
      setReassignReason('');
      showToast(`Case assigned to ${newOfficerName}`);
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleTransferBureau = async () => {
    if (!caseData || !targetBureauId || !transferReason) return;
    try {
      await api.transferBureau(caseData.id, targetBureauId, transferReason);
      setShowTransferModal(false);
      setTransferReason('');
      showToast('Case jurisdiction transferred successfully');
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAddNote = async () => {
    if (!caseData || !actionNote) return;
    try {
      await api.addCaseNote(caseData.id, actionNote);
      setShowNoteModal(false);
      setActionNote('');
      showToast('Action note recorded in case timeline');
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdateDeadline = async () => {
    if (!caseData || !newDeadline) return;
    try {
      const fullDate = new Date(newDeadline).toISOString();
      await api.updateDeadline(caseData.id, fullDate, nextActionText);
      setShowDeadlineModal(false);
      showToast('SLA deadline and next action updated');
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReviewSuggestion = async (sugId: string, status: 'CONFIRMED' | 'REJECTED') => {
    if (!caseData) return;
    try {
      await api.reviewSuggestion(sugId, status, `Reviewed in case dossier ${caseData.caseNumber}`);
      showToast(`Relationship suggestion ${status.toLowerCase()}`);
      loadCase(caseData.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Loading case dossier and regulatory records...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-red-500/30 rounded-xl space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Case Not Found</h3>
        <p className="text-sm text-slate-400">{error || 'Requested complaint ID does not exist.'}</p>
        <button
          onClick={() => navigate('/cases')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Return to Registry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 border border-emerald-500 text-emerald-200 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back button & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center space-x-2 text-xs font-medium text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Case Registry</span>
        </button>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNoteModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Add Action Note</span>
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white text-xs font-bold transition shadow-md"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Update Status</span>
          </button>
          <button
            onClick={() => setShowReassignModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>Reassign Officer</span>
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Transfer Bureau</span>
          </button>
          <button
            onClick={() => setShowDeadlineModal(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Set Deadline / SLA</span>
          </button>
        </div>
      </div>

      {/* Case Dossier Title Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800/80">
                {caseData.caseNumber}
              </span>
              <StatusBadge type="severity" value={caseData.severityLevel} size="md" />
              <StatusBadge type="status" value={caseData.status} size="md" />
              {caseData.isSafetyUrgent && (
                <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-700 text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-500 animate-pulse" />
                  Life Safety Mandatory Escort
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-white">{caseData.title}</h1>
          </div>

          <div className="text-right text-xs space-y-1 flex-shrink-0">
            <p className="text-slate-400">
              Submitted: <span className="font-mono text-slate-200">{new Date(caseData.submissionDate).toLocaleDateString()}</span>
            </p>
            <p className="text-slate-400">
              SLA Deadline: <span className="font-mono text-amber-300 font-bold">{new Date(caseData.deadlineDate).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-1">Allegation Statement</p>
          <p>{caseData.description}</p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Institution</span>
            <button
              onClick={() => navigate(`/institutions/${caseData.institutionId}`)}
              className="font-bold text-blue-400 hover:text-blue-300 text-left flex items-center gap-1 mt-0.5"
            >
              <span>{caseData.institutionName}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 block">{caseData.permanentId}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Jurisdiction Bureau</span>
            <p className="font-bold text-white mt-0.5">{caseData.bureauName}</p>
            <span className="text-[10px] text-slate-400 block">Investigating: {caseData.assignedOfficer}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Classification</span>
            <p className="font-semibold text-slate-200 mt-0.5">{caseData.category.replace(/_/g, ' ')}</p>
            <span className="text-[10px] text-slate-400 block">Source: {caseData.source.replace(/_/g, ' ')}</span>
          </div>

          <div>
            <span className="text-slate-500 text-[10px] uppercase font-bold block">Next Statutory Action</span>
            <p className="font-medium text-slate-300 mt-0.5 line-clamp-2">{caseData.nextAction || 'Pending review'}</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Timeline & AI Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Chronological Action Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Chronological Action Timeline & Procedural Record
                </h3>
              </div>
              <button
                onClick={() => setShowNoteModal(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {caseData.actions.map(action => (
                <div key={action.id} className="relative group text-xs">
                  {/* Dot */}
                  <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900 ring-2 ring-blue-500/20" />
                  
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{action.actorName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                          {action.actorRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(action.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed mt-1">
                      {action.description}
                    </p>

                    {action.previousValue && action.newValue && (
                      <div className="text-[10px] text-slate-400 pt-1 flex items-center space-x-1.5 font-mono">
                        <span className="line-through text-slate-500">{action.previousValue}</span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className="text-blue-300 font-bold">{action.newValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: AI Case Intelligence & Linked Dossiers */}
        <div className="space-y-4">
          {/* AI Severity Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                AI Severity & Urgency Rationale
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Severity Score:</span>
                <span className="font-mono font-bold text-white">{caseData.severityScore}/100</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Rule Applied:</span>
                <p className="font-mono text-[10px] text-blue-300 bg-slate-950 p-2 rounded border border-slate-800">
                  {caseData.severityRuleMatched}
                </p>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Explainable Evidence:</span>
                <p className="text-slate-300 leading-snug">{caseData.severityReason}</p>
              </div>
            </div>
          </div>

          {/* Confirmed Linked Cases */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Confirmed Linked Cases ({linkedCases.length})
            </h3>

            {linkedCases.length === 0 ? (
              <p className="text-xs text-slate-500">No confirmed relationships linked to this case yet.</p>
            ) : (
              <div className="space-y-2">
                {linkedCases.map(lc => (
                  <div
                    key={lc.id}
                    onClick={() => navigate(`/cases/${lc.id}`)}
                    className="p-2.5 rounded-lg bg-slate-950 border border-emerald-500/30 hover:border-emerald-500 cursor-pointer transition text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400">{lc.caseNumber}</span>
                      <span className="text-[10px] text-slate-400">{lc.bureauName}</span>
                    </div>
                    <p className="font-medium text-slate-200 truncate">{lc.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Candidate AI Suggestions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              AI-Suggested Related Cases ({suggestions.length})
            </h3>

            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-500">No pending relationship suggestions detected.</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map(s => {
                  const targetNumber = s.sourceCaseId === caseData.id ? s.targetCaseNumber : s.sourceCaseNumber;
                  const targetTitle = s.sourceCaseId === caseData.id ? s.targetTitle : s.sourceTitle;

                  return (
                    <div key={s.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-blue-400">{targetNumber}</span>
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold text-[10px]">
                          {Math.round(s.similarityScore * 100)}% Match
                        </span>
                      </div>
                      <p className="text-slate-300 font-medium">{targetTitle}</p>
                      <p className="text-[11px] text-slate-400 leading-snug">{s.matchingFactors.explanation}</p>

                      {s.status === 'PENDING_REVIEW' && (
                        <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                          <button
                            onClick={() => handleReviewSuggestion(s.id, 'CONFIRMED')}
                            className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] transition"
                          >
                            Confirm Match
                          </button>
                          <button
                            onClick={() => handleReviewSuggestion(s.id, 'REJECTED')}
                            className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Update Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Transition Case Status</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">New Status</label>
              <select
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                <option value="NEW">NEW</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="INVESTIGATION_ORDERED">INVESTIGATION ORDERED</option>
                <option value="SHOW_CAUSE_ISSUED">SHOW CAUSE ISSUED</option>
                <option value="HEARING_SCHEDULED">HEARING SCHEDULED</option>
                <option value="ACTION_TAKEN">ACTION TAKEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="REOPENED">REOPENED</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Status Reason / Action Note</label>
              <textarea
                rows={3}
                value={statusComment}
                onChange={e => setStatusComment(e.target.value)}
                placeholder="Enter procedural justification..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Apply Transition
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Officer Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Reassign Investigating Officer</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">New Officer Name</label>
              <input
                type="text"
                value={newOfficerName}
                onChange={e => setNewOfficerName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Deshmukh"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Reassignment Justification</label>
              <textarea
                rows={3}
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                placeholder="Workload rebalancing, regional expertise, conflict of interest..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignOfficer}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Bureau Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Transfer Case Jurisdiction</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Bureau</label>
              <select
                value={targetBureauId}
                onChange={e => setTargetBureauId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              >
                {bureaus.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Transfer Justification *</label>
              <textarea
                rows={3}
                value={transferReason}
                onChange={e => setTransferReason(e.target.value)}
                placeholder="State statutory basis for shifting case ownership..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleTransferBureau}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Transfer Case
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Action Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Append Action Note</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Procedural Note</label>
              <textarea
                rows={4}
                value={actionNote}
                onChange={e => setActionNote(e.target.value)}
                placeholder="Log inquiry steps, hearing notes, or inter-agency dispatches..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Save to Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Deadline SLA Modal */}
      {showDeadlineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">Update SLA Deadline</h3>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Date</label>
              <input
                type="date"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Next Action Scheduled</label>
              <input
                type="text"
                value={nextActionText}
                onChange={e => setNextActionText(e.target.value)}
                placeholder="e.g. Virtual hearing with institute rector"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowDeadlineModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDeadline}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Update Deadline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
