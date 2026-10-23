import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  FilePlus2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  ShieldCheck,
  Building2,
  Paperclip,
  Download,
  Printer,
  Sparkles,
  Send,
  PhoneCall,
  HelpCircle,
  ChevronRight,
  Eye,
  EyeOff,
  User,
  ExternalLink,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { api } from '../services/api';
import { Institution, Bureau, ComplaintCase } from '../types';
import { StatusBadge } from '../components/StatusBadge';

export const CitizenPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active citizen portal tab
  const [activeTab, setActiveTab] = useState<'SUBMIT' | 'TRACK' | 'MY_CASES' | 'RIGHTS'>('SUBMIT');

  // Institutions & Bureaus
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [bureaus, setBureaus] = useState<Bureau[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [complainantType, setComplainantType] = useState<string>('STUDENT');
  const [complainantName, setComplainantName] = useState('');
  const [complainantEmail, setComplainantEmail] = useState('');
  const [complainantPhone, setComplainantPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [institutionId, setInstitutionId] = useState('');
  const [bureauId, setBureauId] = useState('');
  const [category, setCategory] = useState<string>('SAFETY_RAGGING');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEmergencySos, setIsEmergencySos] = useState(false);
  const [simulatedFiles, setSimulatedFiles] = useState<string[]>([]);
  const [fileInputName, setFileInputName] = useState('');

  // AI Pre-Triage live state
  const [aiTriage, setAiTriage] = useState<any | null>(null);
  const [evaluatingAi, setEvaluatingAi] = useState(false);

  // Submission result
  const [submitting, setSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Tracking state
  const [trackingInput, setTrackingInput] = useState('AICTE-GRV-2026-1000');
  const [trackedGrievance, setTrackedGrievance] = useState<any | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Citizen supplementary feedback state
  const [feedbackNote, setFeedbackNote] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // My Complaints list
  const [myComplaints, setMyComplaints] = useState<ComplaintCase[]>([]);
  const [myComplaintsLoading, setMyComplaintsLoading] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      setLoadingInitial(true);
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
      console.error(e);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Live AI Pre-Check
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
        if (res.evaluation.isSafetyUrgent) {
          setIsEmergencySos(true);
        }
      } catch (e) {
        console.warn('AI triage error', e);
      } finally {
        setEvaluatingAi(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [title, description, category, complainantType]);

  // Load My Complaints when tab is clicked
  useEffect(() => {
    if (activeTab === 'MY_CASES') {
      fetchMyComplaints();
    }
  }, [activeTab]);

  const fetchMyComplaints = async () => {
    try {
      setMyComplaintsLoading(true);
      const res = await api.getMyComplaints();
      setMyComplaints(res.complaints);
    } catch (e) {
      console.error(e);
    } finally {
      setMyComplaintsLoading(false);
    }
  };

  const handleAddAttachment = () => {
    if (fileInputName.trim()) {
      setSimulatedFiles(prev => [...prev, fileInputName.trim()]);
      setFileInputName('');
    }
  };

  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !institutionId || !bureauId) {
      setFormError('Please fill in all mandatory fields.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      // Auto-assign bureau based on category if student left default
      let targetBureauId = bureauId;
      if (category === 'SAFETY_RAGGING') {
        const armc = bureaus.find(b => b.code === 'ARMC');
        if (armc) targetBureauId = armc.id;
      } else if (category === 'FEE_EXTORTION' || category === 'FACULTY_FRAUD') {
        const pgc = bureaus.find(b => b.code === 'PGC');
        if (pgc) targetBureauId = pgc.id;
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        institutionId,
        bureauId: targetBureauId,
        category: category as any,
        source: 'STUDENT_GRIEVANCE_CELL' as any,
        complainantType: complainantType as any,
        complainantName: isAnonymous ? 'Anonymous Whistleblower' : complainantName,
        complainantEmail: isAnonymous ? undefined : complainantEmail,
        complainantPhone: isAnonymous ? undefined : complainantPhone,
        isAnonymous,
        evidenceFiles: simulatedFiles,
        priority: (isEmergencySos ? 'CRITICAL' : 'URGENT') as any,
      };

      const res = await api.createCase(payload);
      setSubmissionSuccess(res);
      // Automatically set tracking input to the new case
      setTrackingInput(res.case.trackingToken || res.case.caseNumber || '');
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackSearch = async (tokenToSearch?: string) => {
    const query = tokenToSearch || trackingInput;
    if (!query.trim()) return;

    try {
      setTrackingLoading(true);
      setTrackingError(null);
      const res = await api.trackGrievance(query.trim());
      setTrackedGrievance(res.grievance);
    } catch (e: any) {
      setTrackingError(e.message || 'No grievance record found with this token.');
      setTrackedGrievance(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackNote.trim() || !trackedGrievance) return;
    try {
      await api.submitCitizenFeedback(trackedGrievance.trackingToken, feedbackNote);
      setFeedbackSuccess('Supplementary evidence successfully appended to case file.');
      setFeedbackNote('');
      handleTrackSearch(trackedGrievance.trackingToken);
      setTimeout(() => setFeedbackSuccess(null), 4000);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const selectedInst = institutions.find(i => i.id === institutionId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Citizen Portal Hero Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border border-blue-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Citizen & Student Public Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Statutory Student Grievance Redressal Mechanism
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              AICTE National Public Grievance & Student Welfare Portal
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Direct access for students, parents, faculty, and citizens to lodge institutional grievances, report hazing/safety hazards, and track official statutory investigation milestones.
            </p>
          </div>

          {/* Emergency 24x7 Hotline card */}
          <div className="bg-slate-950/80 border border-red-500/40 rounded-xl p-3.5 text-xs text-slate-300 flex-shrink-0 space-y-1 shadow-lg">
            <div className="flex items-center space-x-2 text-red-400 font-bold uppercase tracking-wider text-[11px]">
              <PhoneCall className="w-4 h-4 animate-bounce" />
              <span>24x7 Anti-Ragging Helpline</span>
            </div>
            <p className="text-base font-black text-white font-mono">1800-180-5522</p>
            <p className="text-[10px] text-slate-400">Toll-Free National Emergency Response</p>
          </div>
        </div>

        {/* Portal Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-6 mt-4 border-t border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('SUBMIT');
              setSubmissionSuccess(null);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition shadow ${
              activeTab === 'SUBMIT'
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FilePlus2 className="w-4 h-4 text-blue-300" />
            <span>File a Grievance / Complaint</span>
          </button>

          <button
            onClick={() => setActiveTab('TRACK')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition shadow ${
              activeTab === 'TRACK'
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Search className="w-4 h-4 text-blue-300" />
            <span>Track Grievance Status</span>
          </button>

          <button
            onClick={() => setActiveTab('MY_CASES')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition shadow ${
              activeTab === 'MY_CASES'
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 text-blue-300" />
            <span>My Submitted Grievances</span>
          </button>

          <button
            onClick={() => setActiveTab('RIGHTS')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition shadow ${
              activeTab === 'RIGHTS'
                ? 'bg-blue-600 text-white shadow-blue-600/30'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Student Rights & Regulations</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* TAB 1: FILE A NEW GRIEVANCE / COMPLAINT                      */}
      {/* ============================================================ */}
      {activeTab === 'SUBMIT' && (
        <>
          {submissionSuccess ? (
            <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-8 shadow-2xl text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Grievance Formally Ingested into AICTE Regulatory Hub
                </span>
                <h2 className="text-2xl font-black text-white">
                  Official Grievance Tracking Token: {submissionSuccess.case.trackingToken}
                </h2>
                <p className="text-xs text-slate-300 max-w-lg mx-auto">
                  Your complaint has been assigned Case Reference <span className="font-mono font-bold text-blue-400">{submissionSuccess.case.caseNumber}</span> and forwarded to <span className="font-semibold text-white">{submissionSuccess.case.bureauName}</span>.
                </p>
              </div>

              {/* Acknowledgment Slip Card */}
              <div className="max-w-xl mx-auto p-5 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white uppercase text-[10px] tracking-wider">
                    Official AICTE Acknowledgment Slip
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    {new Date(submissionSuccess.case.submissionDate).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Campus</span>
                    <p className="font-bold text-white mt-0.5">{submissionSuccess.case.institutionName}</p>
                    <span className="text-[10px] font-mono text-slate-400">{submissionSuccess.case.permanentId}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Bureau</span>
                    <p className="font-bold text-white mt-0.5">{submissionSuccess.case.bureauName}</p>
                    <span className="text-[10px] text-slate-400">Investigating: {submissionSuccess.case.assignedOfficer}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Severity Classification</span>
                    <div className="mt-1">
                      <StatusBadge type="severity" value={submissionSuccess.case.severityLevel} />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Statutory SLA Target</span>
                    <p className="font-mono text-amber-300 font-bold mt-1">
                      {new Date(submissionSuccess.case.deadlineDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {submissionSuccess.case.isSafetyUrgent && (
                  <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-700 text-red-200 text-xs flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Priority Safety Flagged: Expedited mandatory physical inquiry ordered within 24-48 hours.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveTab('TRACK');
                    handleTrackSearch(submissionSuccess.case.trackingToken);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center space-x-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Track This Grievance Status</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Acknowledgment Receipt</span>
                </button>
                <button
                  onClick={() => {
                    setSubmissionSuccess(null);
                    setTitle('');
                    setDescription('');
                    setSimulatedFiles([]);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                >
                  Submit Another Grievance
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form */}
              <form onSubmit={handleSubmitGrievance} className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                {formError && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-xs flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Complainant Identity Selection */}
                <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-400" />
                      Complainant Identity
                    </span>

                    {/* Anonymous switch */}
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        isAnonymous
                          ? 'bg-purple-950 text-purple-300 border border-purple-700'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isAnonymous ? 'Whistleblower Anonymous Mode ON' : 'Submit Anonymously?'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setComplainantType('STUDENT')}
                      className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition ${
                        complainantType === 'STUDENT'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      Enrolled Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplainantType('PARENT')}
                      className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition ${
                        complainantType === 'PARENT'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      Parent / Guardian
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplainantType('FACULTY')}
                      className={`p-2.5 rounded-lg text-xs font-semibold text-center border transition ${
                        complainantType === 'FACULTY'
                          ? 'bg-blue-600 text-white border-blue-500 shadow'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                    >
                      Teaching Faculty
                    </button>
                  </div>

                  {!isAnonymous && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <input
                        type="text"
                        placeholder="Your Full Name"
                        value={complainantName}
                        onChange={e => setComplainantName(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="email"
                        placeholder="Email for Updates"
                        value={complainantEmail}
                        onChange={e => setComplainantEmail(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="tel"
                        placeholder="Mobile Phone"
                        value={complainantPhone}
                        onChange={e => setComplainantPhone(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Target Institution Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-400" />
                    Target Technical Institution / University *
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

                {/* Grievance Category */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Grievance Classification Domain *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="SAFETY_RAGGING">Student Safety & Ragging Violation (Mandatory High Priority)</option>
                    <option value="FEE_EXTORTION">Illegal Capitation Fees / Withholding Original Marksheets</option>
                    <option value="UNAPPROVED_PROGRAM">Unapproved Courses / Non-AICTE Mandated Shift</option>
                    <option value="FACULTY_FRAUD">Ghost Faculty / Non-Payment of Teaching Staff Salaries</option>
                    <option value="INFRASTRUCTURE_DEFICIT">Deficient Laboratories & Workshop Norms</option>
                    <option value="ADMISSION_IRREGULARITY">Admission Counseling & Cutoff Deposit Violation</option>
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Grievance Summary / Headline *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Briefly state the incident or violation..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Detailed Narrative of Grievance *
                    </label>
                    <span className="text-[10px] text-blue-400 flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3" />
                      Live AI Triage Listening
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what occurred, dates, names of persons/departments involved, and any prior communication with the college principal..."
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Evidence Upload Simulator */}
                <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 uppercase text-[10px] tracking-wider flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5 text-blue-400" />
                      Attach Supporting Evidence (Fee Receipts, Notice Scans, Photos)
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. Fee_Receipt_2026.pdf or Hostel_Notice_Scan.jpg"
                      value={fileInputName}
                      onChange={e => setFileInputName(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddAttachment}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                    >
                      Attach
                    </button>
                  </div>

                  {simulatedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {simulatedFiles.map((f, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[11px] font-mono border border-blue-800 flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span>{f}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Flag */}
                <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-700/60 flex items-center justify-between text-xs text-red-200">
                  <div className="flex items-center space-x-2.5">
                    <Flame className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-300 uppercase tracking-wide text-[11px]">
                        Emergency Physical Danger or Severe Ragging
                      </p>
                      <p className="text-[10px] text-red-400/90 leading-tight">
                        Check this box if student safety is actively compromised for immediate 24h statutory response.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isEmergencySos}
                    onChange={e => setIsEmergencySos(e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 bg-slate-900 border-red-500 focus:ring-red-500"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Submitting to AICTE Regulatory Ingestion Gateway...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Official Grievance & Generate Tracking Slip</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Right Panel: Institution Info & Live AI Triage */}
              <div className="space-y-4">
                {selectedInst && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Selected Technical Institution
                    </span>
                    <h4 className="font-bold text-white text-sm">{selectedInst.name}</h4>
                    <p className="font-mono text-blue-400">{selectedInst.permanentId}</p>
                    <p className="text-slate-400">{selectedInst.city}, {selectedInst.state}</p>

                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <p>Type: <span className="font-semibold text-white">{selectedInst.type}</span></p>
                      <p>Intake: <span className="font-semibold text-white">{selectedInst.approvedIntake} approved</span></p>
                      {selectedInst.naacGrade && <p>NAAC: <span className="font-semibold text-white">{selectedInst.naacGrade}</span></p>}
                    </div>
                  </div>
                )}

                {/* Live AI Pre-Check Card */}
                <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 space-y-3 shadow-lg text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-white uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Automated AI Triage Pre-Check
                    </span>
                    {evaluatingAi && <span className="text-[10px] text-blue-400 animate-pulse font-mono">Analyzing...</span>}
                  </div>

                  {aiTriage ? (
                    <div className="space-y-2.5">
                      <div>
                        <span className="text-slate-400 text-[10px] block mb-1">Estimated Severity Priority:</span>
                        <StatusBadge type="severity" value={aiTriage.severityLevel} size="md" />
                      </div>

                      {aiTriage.isSafetyUrgent && (
                        <div className="p-2 rounded bg-red-950/80 border border-red-700 text-red-200 text-[11px] space-y-1">
                          <p className="font-bold uppercase tracking-wider text-[10px]">Life Safety Keyword Detected</p>
                          <p className="leading-tight">
                            Hazing or physical threat indicator flagged. Will receive priority executive investigation order.
                          </p>
                        </div>
                      )}

                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Matched Risk Indicators:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {aiTriage.matchedIndicators.map((ind: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">
                              {ind}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">Statutory Rule:</span>
                        <p className="font-mono text-[10px] text-blue-300 bg-slate-950 p-1.5 rounded border border-slate-800">
                          {aiTriage.ruleMatched}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-slate-500 space-y-1">
                      <HelpCircle className="w-5 h-5 mx-auto text-slate-600" />
                      <p className="text-[11px]">Type grievance details to see how the system categorizes and triages your complaint.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: TRACK GRIEVANCE STATUS                                */}
      {/* ============================================================ */}
      {activeTab === 'TRACK' && (
        <div className="space-y-6">
          {/* Tracking Search Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-400" />
              Public Grievance Status Tracker
            </h3>
            <p className="text-xs text-slate-400">
              Enter your Grievance Tracking Token (e.g., <code className="text-blue-300 font-mono">AICTE-GRV-2026-1000</code>) or Case ID (<code className="text-blue-300 font-mono">AICTE-2026-ARMC-0012</code>) to view official statutory inquiry progress.
            </p>

            <div className="flex items-center space-x-2 max-w-xl">
              <input
                type="text"
                placeholder="Enter Token (e.g. AICTE-GRV-2026-1000 or Case ID)..."
                value={trackingInput}
                onChange={e => setTrackingInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleTrackSearch()}
                disabled={trackingLoading}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                {trackingLoading ? 'Searching...' : 'Track Grievance'}
              </button>
            </div>

            {trackingError && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-300 text-xs">
                {trackingError}
              </div>
            )}
          </div>

          {/* Tracked Grievance Result Card */}
          {trackedGrievance && (
            <div className="bg-slate-900 border border-blue-500/40 rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-black text-blue-400 px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                      Token: {trackedGrievance.trackingToken}
                    </span>
                    <span className="font-mono text-xs text-slate-400">({trackedGrievance.caseNumber})</span>
                    <StatusBadge type="status" value={trackedGrievance.status} size="md" />
                  </div>
                  <h2 className="text-xl font-bold text-white">{trackedGrievance.title}</h2>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <p>Filed On: <span className="font-mono text-white">{new Date(trackedGrievance.submissionDate).toLocaleDateString()}</span></p>
                  <p>Target SLA: <span className="font-mono text-amber-300 font-bold">{new Date(trackedGrievance.deadlineDate).toLocaleDateString()}</span></p>
                </div>
              </div>

              {/* Progress Milestones Visual Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Statutory Redressal Progress Pipeline
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-blue-950 border border-blue-600 text-blue-200">
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="font-bold text-[11px] block">1. Ingested</span>
                    <span className="text-[9px] text-slate-400">Lodged in System</span>
                  </div>

                  <div className="p-2 rounded bg-blue-950 border border-blue-600 text-blue-200">
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="font-bold text-[11px] block">2. AI Triaged</span>
                    <span className="text-[9px] text-slate-400">Severity Assessed</span>
                  </div>

                  <div className="p-2 rounded bg-blue-950 border border-blue-600 text-blue-200">
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="font-bold text-[11px] block">3. Allocated</span>
                    <span className="text-[9px] text-slate-400">{trackedGrievance.bureauName}</span>
                  </div>

                  <div className={`p-2 rounded border ${
                    trackedGrievance.status === 'INVESTIGATION_ORDERED' || trackedGrievance.status === 'SHOW_CAUSE_ISSUED' || trackedGrievance.status === 'HEARING_SCHEDULED' || trackedGrievance.status === 'ACTION_TAKEN' || trackedGrievance.status === 'CLOSED'
                      ? 'bg-blue-950 border-blue-600 text-blue-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <Clock className="w-4 h-4 mx-auto mb-1" />
                    <span className="font-bold text-[11px] block">4. Inquiry Active</span>
                    <span className="text-[9px] text-slate-400">Notice / Hearing</span>
                  </div>

                  <div className={`p-2 rounded border ${
                    trackedGrievance.status === 'ACTION_TAKEN' || trackedGrievance.status === 'CLOSED'
                      ? 'bg-emerald-950 border-emerald-600 text-emerald-200'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
                    <span className="font-bold text-[11px] block">5. Resolved</span>
                    <span className="text-[9px] text-slate-400">Directives Issued</span>
                  </div>
                </div>
              </div>

              {/* Public Timeline Events */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Official Procedural Milestones ({trackedGrievance.actions.length})
                </h4>

                <div className="space-y-2">
                  {trackedGrievance.actions.map((act: any) => (
                    <div key={act.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-bold text-blue-300 uppercase">{act.actionType.replace(/_/g, ' ')}</span>
                        <span className="font-mono">{new Date(act.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200">{act.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Citizen Supplementary Feedback Form */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    Submit Additional Information / Reply to Investigating Officer
                  </h4>
                </div>

                {feedbackSuccess && (
                  <div className="p-2.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs">
                    {feedbackSuccess}
                  </div>
                )}

                <textarea
                  rows={3}
                  value={feedbackNote}
                  onChange={e => setFeedbackNote(e.target.value)}
                  placeholder="Provide any additional witness statements, receipts, or reply to official notice..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleSendFeedback}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition"
                  >
                    Send to Investigating Cell
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: MY SUBMITTED GRIEVANCES                               */}
      {/* ============================================================ */}
      {activeTab === 'MY_CASES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">My Submitted Grievance Dossiers</h3>
              <p className="text-xs text-slate-400">Complaints lodged under student / citizen identity.</p>
            </div>
            <button
              onClick={fetchMyComplaints}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Refresh
            </button>
          </div>

          {myComplaintsLoading ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">Loading filed complaints...</div>
          ) : myComplaints.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400">
              <FilePlus2 className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No grievances filed yet.</p>
              <button
                onClick={() => setActiveTab('SUBMIT')}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                File Your First Grievance
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myComplaints.map(c => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-400 font-bold">{c.trackingToken || c.caseNumber}</span>
                      <StatusBadge type="status" value={c.status} />
                      <StatusBadge type="severity" value={c.severityLevel} />
                    </div>
                    <p className="font-bold text-white text-sm">{c.title}</p>
                    <p className="text-slate-400 text-[11px]">{c.institutionName} • {c.bureauName}</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setActiveTab('TRACK');
                        handleTrackSearch(c.trackingToken || c.caseNumber);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-semibold text-xs transition"
                    >
                      Track Progress
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: STUDENT RIGHTS, FEE REGULATIONS & HELPLINES           */}
      {/* ============================================================ */}
      {activeTab === 'RIGHTS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Anti-Ragging Mandate */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-red-700/60 shadow space-y-3">
              <div className="flex items-center space-x-2 text-red-400">
                <Flame className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-300">
                  Zero Tolerance Anti-Ragging Regulations
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Under the AICTE Prevention & Prohibition of Ragging Regulations, ragging in any form (physical hazing, psychological intimidation, forced humiliation) is a cognizable criminal offence.
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 leading-snug">
                <li>Every institution must maintain an active 24x7 Anti-Ragging Squad.</li>
                <li>Hostels must be inspected daily by senior faculty proctors.</li>
                <li>Failure by the college administration triggers immediate de-recognition and police FIR.</li>
              </ul>
              <div className="p-2.5 rounded bg-red-950/70 border border-red-800 text-[11px] text-red-200 font-bold">
                National Anti-Ragging Helpline: 1800-180-5522 (Toll-Free, 24 Hours)
              </div>
            </div>

            {/* Fee Refund Policy */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-blue-600/60 shadow space-y-3">
              <div className="flex items-center space-x-2 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-300">
                  Mandatory Fee Refund & Certificate Retention Norms
                </h3>
              </div>
              <p className="text-slate-300 leading-relaxed">
                As per the official AICTE Approval Process Handbook (Section 10):
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 leading-snug">
                <li><span className="font-semibold text-white">Full Fee Refund:</span> If a student withdraws admission before the formal counseling cutoff, the institute can deduct at most ₹1,000 as processing charges.</li>
                <li><span className="font-semibold text-white">15-Day Time Limit:</span> Refunds must be disbursed via RTGS/NEFT within 15 working days.</li>
                <li><span className="font-semibold text-white">Strict Prohibition on Retaining Original Documents:</span> No institution can legally retain original Class 10/12 marksheets or degree certificates.</li>
              </ul>
              <div className="p-2.5 rounded bg-blue-950/70 border border-blue-800 text-[11px] text-blue-200 font-bold">
                Student Grievance Cell: grievance@aicte-india.org
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
