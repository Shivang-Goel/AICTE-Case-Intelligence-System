import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  Filter,
  Layers,
  Building2,
  Calendar,
  AlertTriangle,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { CaseRelationshipSuggestion, ComplaintCase } from '../types';

export const CaseLinkingPage: React.FC = () => {
  const [suggestions, setSuggestions] = useState<CaseRelationshipSuggestion[]>([]);
  const [allCases, setAllCases] = useState<ComplaintCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Ad-Hoc Comparison Modal/Tab
  const [activeTab, setActiveTab] = useState<'SUGGESTIONS' | 'ADHOC_COMPARE'>('SUGGESTIONS');
  const [adhocCaseA, setAdhocCaseA] = useState('');
  const [adhocCaseB, setAdhocCaseB] = useState('');
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [comparing, setComparing] = useState(false);

  // Review Modal
  const [reviewTarget, setReviewTarget] = useState<CaseRelationshipSuggestion | null>(null);
  const [decision, setDecision] = useState<'CONFIRMED' | 'REJECTED' | 'DISMISSED'>('CONFIRMED');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewing, setReviewing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sugRes, casesRes] = await Promise.all([
        api.getSuggestions(statusFilter),
        api.getCases({ limit: '100' }),
      ]);
      setSuggestions(sugRes.suggestions);
      setAllCases(casesRes.data);
      if (casesRes.data.length >= 2) {
        setAdhocCaseA(casesRes.data[0].id);
        setAdhocCaseB(casesRes.data[1].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (s: CaseRelationshipSuggestion, status: 'CONFIRMED' | 'REJECTED' | 'DISMISSED') => {
    setReviewTarget(s);
    setDecision(status);
    setReviewReason(
      status === 'CONFIRMED'
        ? `Confirmed semantic and institutional link based on shared evidence: ${s.matchingFactors.matchedKeywords.slice(0, 3).join(', ')}`
        : 'Different factual context upon officer scrutiny.'
    );
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    try {
      setReviewing(true);
      await api.reviewSuggestion(reviewTarget.id, decision, reviewReason);
      setReviewTarget(null);
      loadData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReviewing(false);
    }
  };

  const handleRunAdhocComparison = async () => {
    if (!adhocCaseA || !adhocCaseB || adhocCaseA === adhocCaseB) return;
    try {
      setComparing(true);
      const res = await api.compareCases(adhocCaseA, adhocCaseB);
      setComparisonResult(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            AI-Assisted Semantic Case Linking Engine
          </h1>
          <p className="text-xs text-slate-400">
            Explainable TF-IDF keyword vectorization & permanent ID matching to detect duplicate complaints, related fraud patterns, and coordinated inquiries.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-1 text-xs">
          <button
            onClick={() => setActiveTab('SUGGESTIONS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'SUGGESTIONS' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Candidate Match Queue
          </button>
          <button
            onClick={() => setActiveTab('ADHOC_COMPARE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition ${
              activeTab === 'ADHOC_COMPARE' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ad-Hoc Pairwise Matcher
          </button>
        </div>
      </div>

      {activeTab === 'SUGGESTIONS' ? (
        <div className="space-y-4">
          {/* Status Filter */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 font-semibold">Filter Decisions:</span>
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                All ({suggestions.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING_REVIEW')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'PENDING_REVIEW' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Pending Officer Review
              </button>
              <button
                onClick={() => setStatusFilter('CONFIRMED')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'CONFIRMED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Confirmed Links
              </button>
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'REJECTED' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Rejected Matches
              </button>
            </div>
          </div>

          {/* Suggestions List */}
          {loading ? (
            <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-xs">Running semantic comparison engine across open cases...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No suggestions in this view.</p>
              <p className="text-xs text-slate-500">All candidate case links have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map(sug => {
                const percentage = Math.round(sug.similarityScore * 100);

                return (
                  <div
                    key={sug.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 transition"
                  >
                    {/* Header line */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-300 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-blue-400" />
                          {sug.institutionName}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-400">
                          Method: {sug.method.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-400">Similarity Match:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-black border ${
                          percentage >= 85
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                            : percentage >= 70
                            ? 'bg-blue-950/80 text-blue-300 border-blue-600'
                            : 'bg-amber-950/80 text-amber-300 border-amber-600'
                        }`}>
                          {percentage}% Normalized Score
                        </span>

                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sug.status === 'CONFIRMED'
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                            : sug.status === 'REJECTED'
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-amber-950/60 text-amber-300 border border-amber-700'
                        }`}>
                          {sug.status}
                        </span>
                      </div>
                    </div>

                    {/* Side-by-side Case Comparison Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Source Case */}
                      <div
                        onClick={() => navigate(`/cases/${sug.sourceCaseId}`)}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-400">{sug.sourceCaseNumber}</span>
                          <span className="text-[10px] text-slate-500">Source Complaint</span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-snug">{sug.sourceTitle}</p>
                        <p className="text-[10px] text-blue-400 font-semibold flex items-center gap-1 mt-1">
                          <span>Inspect Source Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>

                      {/* Target Case */}
                      <div
                        onClick={() => navigate(`/cases/${sug.targetCaseId}`)}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-indigo-400">{sug.targetCaseNumber}</span>
                          <span className="text-[10px] text-slate-500">Target Match</span>
                        </div>
                        <p className="text-xs font-semibold text-white leading-snug">{sug.targetTitle}</p>
                        <p className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mt-1">
                          <span>Inspect Target Dossier</span>
                          <ExternalLink className="w-3 h-3" />
                        </p>
                      </div>
                    </div>

                    {/* Evidence & Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-300">Explainable Match Factors:</span>
                        <div className="flex flex-wrap gap-1">
                          {sug.matchingFactors.matchedKeywords.map((kw, i) => (
                            <span key={i} className="px-2 py-0.2 rounded bg-blue-950 text-blue-300 text-[10px] font-mono border border-blue-800">
                              {kw}
                            </span>
                          ))}
                          {sug.matchingFactors.sharedPermanentId && (
                            <span className="px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono border border-emerald-800">
                              Exact Permanent ID Match
                            </span>
                          )}
                          {sug.matchingFactors.temporalProximityDays <= 14 && (
                            <span className="px-2 py-0.2 rounded bg-purple-950 text-purple-300 text-[10px] font-mono border border-purple-800">
                              Temporal Proximity ({sug.matchingFactors.temporalProximityDays}d)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        <span className="font-semibold text-slate-400">Why Suggested: </span>
                        {sug.matchingFactors.explanation}
                      </p>

                      {sug.reviewReason && (
                        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                          <span className="font-semibold text-white">Reviewer Note ({sug.reviewedBy} on {new Date(sug.reviewedAt || '').toLocaleDateString()}): </span>
                          {sug.reviewReason}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Reviewer */}
                    {sug.status === 'PENDING_REVIEW' && (
                      <div className="flex items-center justify-end space-x-3 pt-1">
                        <button
                          onClick={() => handleOpenReview(sug, 'REJECTED')}
                          className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Match</span>
                        </button>
                        <button
                          onClick={() => handleOpenReview(sug, 'CONFIRMED')}
                          className="flex items-center space-x-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Relationship & Link Cases</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Ad-Hoc Pairwise Matcher */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white">Ad-Hoc Pairwise Case Similarity Tester</h3>
            <p className="text-xs text-slate-400">
              Select any two cases across any bureau to compute instant explainable Jaccard + TF-IDF similarity vectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">First Case (A)</label>
              <select
                value={adhocCaseA}
                onChange={e => setAdhocCaseA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                {allCases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title.slice(0, 50)}... ({c.bureauName})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase">Second Case (B)</label>
              <select
                value={adhocCaseB}
                onChange={e => setAdhocCaseB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white"
              >
                {allCases.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} — {c.title.slice(0, 50)}... ({c.bureauName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <button
              onClick={handleRunAdhocComparison}
              disabled={comparing || adhocCaseA === adhocCaseB}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-40"
            >
              {comparing ? 'Calculating Semantic Vectors...' : 'Run Ad-Hoc Semantic Comparison'}
            </button>
          </div>

          {comparisonResult && (
            <div className="p-5 rounded-xl bg-slate-950 border border-blue-500/40 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-white text-sm">Comparison Outcome:</span>
                <span className="font-mono text-base font-black text-blue-400">
                  {Math.round(comparisonResult.comparison.similarityScore * 100)}% Similarity
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <p className="text-slate-300">
                  <span className="font-semibold text-slate-400">Explanation: </span>
                  {comparisonResult.comparison.matchingFactors.explanation}
                </p>

                <div>
                  <span className="font-semibold text-slate-400 block mb-1">Overlapping Tokens:</span>
                  <div className="flex flex-wrap gap-1">
                    {comparisonResult.comparison.matchingFactors.matchedKeywords.map((k: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px]">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-bold text-white">
              {decision === 'CONFIRMED' ? 'Confirm Case Relationship' : 'Reject Suggestion'}
            </h3>
            <p className="text-xs text-slate-400">
              {decision === 'CONFIRMED'
                ? `Linking ${reviewTarget.sourceCaseNumber} and ${reviewTarget.targetCaseNumber} will interconnect their dossiers and graph edges.`
                : `Dismissing match between ${reviewTarget.sourceCaseNumber} and ${reviewTarget.targetCaseNumber}.`}
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Officer Decision Reason *</label>
              <textarea
                rows={4}
                value={reviewReason}
                onChange={e => setReviewReason(e.target.value)}
                placeholder="State basis for decision..."
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewing}
                className={`px-4 py-2 rounded-lg font-bold text-xs text-white ${
                  decision === 'CONFIRMED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {reviewing ? 'Recording in Audit Trail...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
