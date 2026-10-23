import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Sparkles,
  Building2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Send,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { api } from '../services/api';
import { Institution, Bureau } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const ComplaintIntakePage: React.FC = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [bureauId, setBureauId] = useState('');
  const [category, setCategory] = useState<string>('SAFETY_RAGGING');
  const [source, setSource] = useState<string>('AICTE_PORTAL');
  const [complainantType, setComplainantType] = useState<string>('STUDENT');
  const [assignedOfficer, setAssignedOfficer] = useState('');
  const [priority, setPriority] = useState<string>('URGENT');
  const [deadlineDays, setDeadlineDays] = useState<number>(14);

  // AI Pre-Triage State
  const [aiTriage, setAiTriage] = useState<{
    severityLevel: string;
    severityScore: number;
    severityReason: string;
    ruleMatched: string;
    isSafetyUrgent: boolean;
    confidence: number;
    matchedIndicators: string[];
  } | null>(null);
  const [evaluatingAi, setEvaluatingAi] = useState(false);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [instRes, dashRes] = await Promise.all([
        api.getInstitutions(),
        api.getDashboardData(),
      ]);
      setInstitutions(instRes.institutions);
      if (instRes.institutions.length > 0) {
        setInstitutionId(instRes.institutions[0].id);
      }

      const bList = dashRes.bureauWorkload.map(b => ({
        id: b.bureauId,
        code: b.code,
        name: b.name,
        description: '',
        headOfficer: '',
        activeCasesCount: b.active,
      }));
      setBureaus(bList);
      if (bList.length > 0) {
        setBureauId(bList[0].id);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to initialize intake form.');
    } finally {
      setLoadingInitial(false);
    }
  };

  // Real-time AI Severity pre-evaluation
  useEffect(() => {
    if (!title && !description) {
      setAiTriage(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setEvaluatingAi(true);
        const res = await api.evaluateSeverity({
          title,
          description,
          category,
          complainantType,
        });
        setAiTriage(res.evaluation);

        // Auto-adjust default deadline if safety urgent
        if (res.evaluation.isSafetyUrgent) {
          setDeadlineDays(3);
          setPriority('CRITICAL');
        }
      } catch (e) {
        console.warn('AI Triage error', e);
      } finally {
        setEvaluatingAi(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [title, description, category, complainantType]);

  const selectedInstitution = institutions.find(i => i.id === institutionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !institutionId || !bureauId) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const targetDeadline = new Date();
      targetDeadline.setDate(targetDeadline.getDate() + deadlineDays);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        institutionId,
        bureauId,
        category: category as any,
        source: source as any,
        complainantType: complainantType as any,
        assignedOfficer: assignedOfficer || (bureaus.find(b => b.id === bureauId)?.headOfficer || 'Lead Regulatory Officer'),
        priority: priority as any,
        deadlineDate: targetDeadline.toISOString(),
      };

      const res = await api.createCase(payload);
      setSuccessResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to submit complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-2 animate-pulse">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto" />
        <p className="text-xs">Loading AICTE institution directories and bureau registries...</p>
      </div>
    );
  }

  // Success view
  if (successResult) {
    return (
      <div className="max-w-3xl mx-auto bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
            Registration & AI Triage Complete
          </span>
          <h2 className="text-2xl font-black text-white">
            Case Registered: {successResult.case.caseNumber}
          </h2>
          <p className="text-xs text-slate-300 max-w-lg mx-auto">
            Complaint successfully ingested into PostgreSQL authoritative store. Automated cross-referencing completed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs">
          <div>
            <span className="text-slate-500 block">Severity Classification</span>
            <div className="mt-1">
              <StatusBadge type="severity" value={successResult.case.severityLevel} />
            </div>
          </div>
          <div>
            <span className="text-slate-500 block">Jurisdiction Bureau</span>
            <span className="font-semibold text-white mt-1 block">{successResult.case.bureauName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">AI Matching Analysis</span>
            <span className="font-semibold text-blue-400 mt-1 block">
              {successResult.generatedSuggestionsCount} Potential Matches Scanned
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4 pt-2">
          <button
            onClick={() => navigate(`/cases/${successResult.case.id}`)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
          >
            Open Case Dossier
          </button>
          <button
            onClick={() => {
              setSuccessResult(null);
              setTitle('');
              setDescription('');
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
          >
            Register Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FilePlus2 className="w-6 h-6 text-blue-400" />
          Complaint Intake & Intelligent Regulatory Triage
        </h1>
        <p className="text-xs text-slate-400">
          Statutory registration with instant semantic risk assessment, student life safety flagging, and cross-bureau overlap analysis.
        </p>
      </div>

      {/* Role-based restriction notice for Bureau Officers & Reviewers */}
      {api.getRole() !== 'CITIZEN' && api.getRole() !== 'ADMIN' && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-600/70 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold uppercase tracking-wider text-amber-300 text-[11px]">
                Bureau Officer Regulatory Role Active ({api.getRole().replace(/_/g, ' ')})
              </p>
              <p className="leading-snug text-amber-200/90 text-xs">
                In the AICTE governance architecture, statutory officers investigate, review, and adjudicate cases. Grievances are formally filed by Citizens & Students via the Public Grievance Portal.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                api.setRole('CITIZEN');
                navigate('/citizen-portal');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition whitespace-nowrap"
            >
              Switch to Student Role
            </button>
            <button
              type="button"
              onClick={() => navigate('/citizen-portal')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition whitespace-nowrap"
            >
              Public Grievance Portal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Institution Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              Target Technical Institution *
            </label>
            <select
              value={institutionId}
              onChange={e => setInstitutionId(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} — [{inst.permanentId}] ({inst.city}, {inst.state})
                </option>
              ))}
            </select>
          </div>

          {/* Bureau & Category Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                Allocated AICTE Bureau / Cell *
              </label>
              <select
                value={bureauId}
                onChange={e => setBureauId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {bureaus.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Grievance Category *
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="SAFETY_RAGGING">Student Safety & Ragging Violation</option>
                <option value="FACULTY_FRAUD">Faculty Roster & Ghost Teacher Fraud</option>
                <option value="UNAPPROVED_PROGRAM">Unapproved Programs / Excess Intake</option>
                <option value="FEE_EXTORTION">Capitation Fee / Marksheet Withholding</option>
                <option value="INFRASTRUCTURE_DEFICIT">Laboratory & Building Safety Deficit</option>
                <option value="GOVERNANCE_DISPUTE">Litigation / High Court Stay / Governance</option>
                <option value="ADMISSION_IRREGULARITY">Counseling & Quota Irregularity</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Allegation Summary / Subject *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Unsanctioned night-shift MCA section and physical intimidation in hostel block"
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Detailed Complaint Description & Evidence Notes *
              </label>
              <span className="text-[10px] text-blue-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Live AI Triage Active
              </span>
            </div>
            <textarea
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Provide exact facts, involved departments, witness statements, dates, and documentation references..."
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Source & Complainant Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Intake Channel / Source
              </label>
              <select
                value={source}
                onChange={e => setSource(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="AICTE_PORTAL">Central AICTE Portal</option>
                <option value="STUDENT_GRIEVANCE_CELL">National Student Grievance Portal</option>
                <option value="NATIONAL_ANTI_RAGGING_HELPLINE">National Anti-Ragging Helpline (Toll-Free)</option>
                <option value="VIGILANCE_WHISTLEBLOWER">Vigilance Whistleblower Hotline</option>
                <option value="COURT_PETITION">High Court / Judicial Standing Counsel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Complainant Relationship
              </label>
              <select
                value={complainantType}
                onChange={e => setComplainantType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="STUDENT">Enrolled Student</option>
                <option value="FACULTY">Faculty / Instructor</option>
                <option value="PARENT">Parent / Guardian</option>
                <option value="OFFICIAL_AUDITOR">Statutory Inspection Auditor</option>
                <option value="CITIZEN">Whistleblower / Citizen</option>
              </select>
            </div>
          </div>

          {/* Deadline SLA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Statutory SLA Target (Days to Resolve)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={deadlineDays}
                onChange={e => setDeadlineDays(parseInt(e.target.value, 10) || 14)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Priority Tier
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="CRITICAL">CRITICAL (Executive Escort)</option>
                <option value="URGENT">URGENT (Accelerated Review)</option>
                <option value="MEDIUM">MEDIUM (Standard Workflow)</option>
                <option value="ROUTINE">ROUTINE (Administrative)</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Ingesting Case & Executing Multi-Bureau Conflict Scan...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Complaint & Launch AI Case Intel Engine</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Col: Live AI Pre-Triage Panel */}
        <div className="space-y-4">
          {/* Institution Context Card */}
          {selectedInstitution && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Selected Institution Profile
              </span>
              <h4 className="text-sm font-bold text-white">{selectedInstitution.name}</h4>
              <p className="text-xs font-mono text-slate-400">{selectedInstitution.permanentId}</p>
              
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[10px]">Risk Score:</span>
                  <p className="font-bold text-white">{selectedInstitution.riskScore}/100</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px]">Active Cases:</span>
                  <p className="font-bold text-blue-400">{selectedInstitution.activeCasesCount} open</p>
                </div>
              </div>

              {selectedInstitution.hasActiveConflict && (
                <div className="mt-2 p-2 rounded bg-red-950/70 border border-red-700/60 text-xs text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-[11px] leading-tight">
                    Active cross-bureau conflict registered on this institution!
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Live AI Pre-Check Card */}
          <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-5 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Pre-Triage Engine
                </h4>
              </div>
              {evaluatingAi && (
                <span className="text-[10px] text-blue-400 animate-pulse font-mono">Analyzing...</span>
              )}
            </div>

            {aiTriage ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Recommended Severity</span>
                  <div className="flex items-center space-x-2">
                    <StatusBadge type="severity" value={aiTriage.severityLevel} size="md" />
                    <span className="text-xs font-mono text-slate-400 font-bold">
                      Score: {aiTriage.severityScore}/100
                    </span>
                  </div>
                </div>

                {aiTriage.isSafetyUrgent && (
                  <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-600 text-xs text-red-200 flex items-start space-x-2">
                    <Flame className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <p className="font-bold uppercase tracking-wide text-[10px]">
                        Immediate Student Safety Flag
                      </p>
                      <p className="text-[11px] leading-tight text-red-300">
                        Physical hazing or danger detected. Triggered statutory 24h inquiry priority.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">Matched Risk Indicators:</span>
                  <div className="flex flex-wrap gap-1">
                    {aiTriage.matchedIndicators.map((ind, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Rule Applied:</span>
                  <p className="text-[11px] text-slate-300 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                    {aiTriage.ruleMatched}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[10px] text-slate-400 block font-semibold">Reasoning Rationale:</span>
                  <p className="text-[11px] text-slate-300 leading-snug">{aiTriage.severityReason}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 space-y-1 text-xs">
                <HelpCircle className="w-6 h-6 mx-auto text-slate-600" />
                <p>Type complaint subject and details to observe real-time AI triage extraction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
