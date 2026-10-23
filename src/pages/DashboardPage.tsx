import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Flame,
  Clock,
  Sparkles,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Download,
  ShieldAlert,
  Layers,
  ChevronRight,
  ShieldCheck,
  Scale,
  Siren,
  Banknote,
  GraduationCap,
  Award,
  Users,
  Search,
  Check,
  X,
  ExternalLink,
  Calendar,
  AlertCircle,
  FileCheck2,
  FileWarning,
  Eye,
  Send,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { api } from '../services/api';
import { DashboardData, User, ComplaintCase, Institution } from '../types';
import { StatusBadge } from '../components/StatusBadge';

type BureauDeskType = 'COUNCIL_UNIFIED' | 'APPROVAL_BUREAU' | 'PUBLIC_GRIEVANCE' | 'ANTI_RAGGING_VIGILANCE';

interface Props {
  currentUser?: User | null;
  onRefresh?: () => void;
}

export const DashboardPage: React.FC<Props> = ({ currentUser, onRefresh }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDesk, setActiveDesk] = useState<BureauDeskType>('COUNCIL_UNIFIED');
  const [cases, setCases] = useState<ComplaintCase[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const navigate = useNavigate();

  // Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionModalType, setActionModalType] = useState<string>('');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedInstId, setSelectedInstId] = useState<string>('');
  const [actionDetails, setActionDetails] = useState<string>('');
  const [actionSubParam, setActionSubParam] = useState<string>('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Synchronize active desk based on logged in user role
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'BUREAU_OFFICER_AB' || currentUser.bureauId === 'bur-ab') {
        setActiveDesk('APPROVAL_BUREAU');
      } else if (currentUser.role === 'BUREAU_OFFICER_PGC' || currentUser.bureauId === 'bur-pgc') {
        setActiveDesk('PUBLIC_GRIEVANCE');
      } else if (currentUser.role === 'BUREAU_OFFICER_ARMC' || currentUser.bureauId === 'bur-armc' || currentUser.bureauId === 'bur-vig') {
        setActiveDesk('ANTI_RAGGING_VIGILANCE');
      } else {
        setActiveDesk('COUNCIL_UNIFIED');
      }
    }
  }, [currentUser?.role, currentUser?.bureauId]);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashRes, casesRes, instRes] = await Promise.all([
        api.getDashboardData(),
        api.getCases({ limit: '100' }),
        api.getInstitutions(),
      ]);
      setData(dashRes);
      setCases(casesRes.data);
      setInstitutions(instRes.institutions);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load executive dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenActionModal = (actionType: string, defaultCaseId?: string, defaultInstId?: string) => {
    setActionModalType(actionType);
    setSelectedCaseId(defaultCaseId || (cases[0]?.id || ''));
    setSelectedInstId(defaultInstId || (institutions[0]?.id || ''));
    setActionDetails('');
    setActionSubParam('');
    setActionSuccessMsg(null);
    setActionModalOpen(true);
  };

  const handleExecuteBureauAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionSubmitting(true);
      let res: any;

      if (activeDesk === 'APPROVAL_BUREAU') {
        res = await api.executeApprovalAction({
          caseId: selectedCaseId || undefined,
          institutionId: selectedInstId || undefined,
          actionType: actionModalType,
          details: actionDetails || 'Statutory order issued under AICTE Approval Process Handbook (APH 2024-27).',
          seatReduction: actionSubParam ? parseInt(actionSubParam) : undefined,
          inspectionDate: actionSubParam || undefined,
        });
      } else if (activeDesk === 'PUBLIC_GRIEVANCE') {
        res = await api.executeGrievanceAction({
          caseId: selectedCaseId || undefined,
          institutionId: selectedInstId || undefined,
          actionType: actionModalType,
          details: actionDetails || 'Formal grievance redressal directive issued under AICTE Regulations 2019/2023.',
          refundAmount: actionSubParam || undefined,
          deadlineDate: actionSubParam || undefined,
        });
      } else {
        res = await api.executeVigilanceAction({
          caseId: selectedCaseId || undefined,
          institutionId: selectedInstId || undefined,
          actionType: actionModalType,
          details: actionDetails || 'Emergency safety intervention pursuant to Supreme Court Anti-Ragging Mandate.',
          squadLead: actionSubParam || undefined,
          policeStation: actionSubParam || undefined,
        });
      }

      setActionSuccessMsg(res.message);
      loadDashboard();
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setActionModalOpen(false);
        setActionSuccessMsg(null);
      }, 2000);
    } catch (err: any) {
      alert(err.message || 'Action failed to execute.');
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-800/60 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-800/40 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/40 rounded-xl" />
          <div className="h-80 bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-red-500/30 rounded-xl space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Dashboard Telemetry Error</h3>
        <p className="text-sm text-slate-400">{error || 'Unable to connect to intelligence API.'}</p>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { kpis, bureauWorkload, severityDistribution, categoryDistribution, trends, recentCases } = data;

  // Filter cases for each distinct bureau docket
  const approvalCases = cases.filter(
    c => c.bureauName?.toLowerCase().includes('approval') ||
         c.category === 'INFRASTRUCTURE_DEFICIT' ||
         c.category === 'FACULTY_FRAUD' ||
         c.category === 'UNAPPROVED_PROGRAM'
  );

  const grievanceCases = cases.filter(
    c => c.bureauName?.toLowerCase().includes('grievance') ||
         c.category === 'FEE_EXTORTION' ||
         c.category === 'ADMISSION_IRREGULARITY' ||
         c.complainantType === 'STUDENT'
  );

  const vigilanceCases = cases.filter(
    c => c.bureauName?.toLowerCase().includes('anti-ragging') ||
         c.bureauName?.toLowerCase().includes('vigilance') ||
         c.category === 'SAFETY_RAGGING' ||
         c.isSafetyUrgent ||
         c.severityLevel === 'CRITICAL'
  );

  return (
    <div className="space-y-6">
      {/* Bureau Desk Selector Tab Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveDesk('COUNCIL_UNIFIED')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeDesk === 'COUNCIL_UNIFIED'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Council Central Intelligence</span>
          </button>

          <button
            onClick={() => setActiveDesk('APPROVAL_BUREAU')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeDesk === 'APPROVAL_BUREAU'
                ? 'bg-blue-700 text-white shadow-md ring-1 ring-blue-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-blue-300" />
            <span>Approval Bureau Desk</span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-900/80 text-[10px] text-blue-200">
              {approvalCases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveDesk('PUBLIC_GRIEVANCE')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeDesk === 'PUBLIC_GRIEVANCE'
                ? 'bg-emerald-700 text-white shadow-md ring-1 ring-emerald-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-300" />
            <span>Public Grievance Desk</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-900/80 text-[10px] text-emerald-200">
              {grievanceCases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveDesk('ANTI_RAGGING_VIGILANCE')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              activeDesk === 'ANTI_RAGGING_VIGILANCE'
                ? 'bg-red-700 text-white shadow-md ring-1 ring-red-400/50'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Siren className="w-3.5 h-3.5 text-red-300 animate-pulse" />
            <span>Anti-Ragging & Vigilance Desk</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-900/80 text-[10px] text-red-200">
              {vigilanceCases.length}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs pr-2">
          <span className="text-slate-400 hidden sm:inline">Active Persona:</span>
          <span className="px-2 py-1 rounded bg-slate-800 font-semibold text-slate-200 border border-slate-700 text-[11px]">
            {currentUser?.name || 'Administrator'} ({currentUser?.role?.replace(/_/g, ' ') || 'ADMIN'})
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. APPROVAL BUREAU OFFICER VIEW                                            */}
      {/* ========================================================================= */}
      {activeDesk === 'APPROVAL_BUREAU' && (
        <div className="space-y-6">
          {/* Approval Bureau Statutory Jurisdiction Header */}
          <div className="bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    Statutory Bureau Mandate: Approval Process Handbook (APH 2024-27)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Clearance Level: Statutory Sanction Authority
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <Award className="w-6 h-6 text-blue-400" />
                  <span>Approval Bureau — Extension of Approval (EoA) & Intake Scrutiny</span>
                </h1>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Responsible for assessing institutional compliance against AICTE norms: Faculty-Cadre Ratios (1:15/1:20), Built-Up Laboratory Area, Approved Intake Quotas, Land Titles, and Course Clearances.
                </p>
              </div>

              {/* Approval Bureau Quick Action Operational Desk */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenActionModal('APPROVE_EOA')}
                  className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Process EoA Sanction</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('ISSUE_DEFICIENCY_NOTICE')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <FileWarning className="w-3.5 h-3.5" />
                  <span>Issue Deficiency Notice</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('FREEZE_SEATS')}
                  className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Freeze Intake Seats</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('ORDER_SCRUTINY_INSPECTION')}
                  className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Depute EVC Scrutiny</span>
                </button>
              </div>
            </div>
          </div>

          {/* Approval Bureau Specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending EoA Scrutiny</span>
                <Award className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white">8 Institutions</p>
              <p className="text-[10px] text-blue-400/80 mt-1 font-semibold">2026-27 Academic Cycle</p>
            </div>

            <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cadre & Built-Up Deficiencies</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">6 Violations</p>
              <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">Shortfall &gt; 25% of APH norms</p>
            </div>

            <div className="bg-slate-900 border border-orange-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-orange-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Sanctioned Seats Under Review</span>
                <Users className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-orange-300">3,240 Seats</p>
              <p className="text-[10px] text-orange-400/80 mt-1 font-semibold">Subject to provisional freeze</p>
            </div>

            <div className="bg-slate-900 border border-red-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-red-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Inter-Bureau EoA Holds</span>
                <ShieldAlert className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-black text-red-300">{kpis.activeConflicts} Collisions</p>
              <p className="text-[10px] text-red-400/80 mt-1 font-semibold">Vigilance / Police enquiry active</p>
            </div>
          </div>

          {/* Approval Conflict Advisory */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-blue-200 uppercase tracking-wider">
                Regulatory Guardrail: Approval Process Handbook Section 4.3(b)
              </span>
              <p className="text-slate-300">
                Extension of Approval (EoA) cannot be granted to institutions with open cross-bureau vigilance inquiries or criminal forged fire certificates. Always verify with the Cross-Bureau Conflict Centre before issuing clearance.
              </p>
            </div>
          </div>

          {/* Approval Bureau Work Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Approval Bureau Active Docket & Hearing Schedule</span>
                </h3>
                <p className="text-xs text-slate-400">Institutions with pending approvals, cadre reviews, or intake reductions</p>
              </div>
              <button
                onClick={() => navigate('/cases')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
              >
                <span>View Full Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3">Permanent ID & Institution</th>
                    <th className="py-2.5 px-3">Category & Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Intake / Risk</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {approvalCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No active Approval Bureau cases in queue.
                      </td>
                    </tr>
                  ) : (
                    approvalCases.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono text-blue-400 font-bold">{c.caseNumber}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-white truncate max-w-xs">{c.institutionName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{c.permanentId}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-medium text-slate-200">{c.category.replace(/_/g, ' ')}</span>
                          <p className="text-[11px] text-slate-400 truncate max-w-sm">{c.title}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge type="status" value={c.status} />
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            Score: {c.severityScore}/100
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenActionModal('ISSUE_DEFICIENCY_NOTICE', c.id, c.institutionId)}
                            className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white border border-blue-500/40 text-[11px] font-bold transition mr-1.5"
                          >
                            Act
                          </button>
                          <button
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PUBLIC GRIEVANCE CELL OFFICER VIEW                                      */}
      {/* ========================================================================= */}
      {activeDesk === 'PUBLIC_GRIEVANCE' && (
        <div className="space-y-6">
          {/* Public Grievance Statutory Jurisdiction Header */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                    Statutory Mandate: AICTE Student Grievance Redressal Regulations (2019/2023)
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Clearance Level: Summary Restitution Directorate
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <Scale className="w-6 h-6 text-emerald-400" />
                  <span>Public Grievance Cell — Fees, Marksheets & Student Ombudsman</span>
                </h1>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Enforcing strict council mandates: Mandatory 7-day refund of tuition fees/caution money, absolute ban on withholding original educational certificates, faculty salary arrears recovery, and campus SGRC oversight.
                </p>
              </div>

              {/* Public Grievance Operational Action Desk */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenActionModal('MANDATE_FEE_REFUND_7D')}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow"
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Order 7-Day Fee Refund</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('ORDER_RELEASE_CERTIFICATES')}
                  className="px-3 py-2 rounded-xl bg-teal-900/80 hover:bg-teal-800 text-teal-200 border border-teal-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Order Marksheet Release</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('SCHEDULE_LOK_ADALAT')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Lok Adalat</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('FACULTY_SALARY_AUDIT')}
                  className="px-3 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Faculty Salary Audit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grievance Cell Specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-emerald-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Fee Refund Disputed Amount</span>
                <Banknote className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-300">₹42.8 Lakhs</p>
              <p className="text-[10px] text-emerald-400/80 mt-1 font-semibold">14 Student claims in recovery</p>
            </div>

            <div className="bg-slate-900 border border-teal-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-teal-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Withheld Original Marksheets</span>
                <GraduationCap className="w-4 h-4 text-teal-400" />
              </div>
              <p className="text-2xl font-black text-teal-300">11 Students</p>
              <p className="text-[10px] text-teal-400/80 mt-1 font-semibold">48h Return Order served</p>
            </div>

            <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Faculty Salary Arrears</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">₹85.4 Lakhs</p>
              <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">6th/7th CPC wage defaults</p>
            </div>

            <div className="bg-slate-900 border border-blue-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-blue-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Avg Redressal Velocity</span>
                <Clock className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-300">11.4 Days</p>
              <p className="text-[10px] text-blue-400/80 mt-1 font-semibold">Statutory SLA Target: 15 Days</p>
            </div>
          </div>

          {/* Grievance Cell Work Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Public Grievance Queue & Token Tracking
                </h3>
                <p className="text-xs text-slate-400">Cases filed by students, parents, and faculty requiring restitution</p>
              </div>
              <button
                onClick={() => navigate('/citizen-portal')}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
              >
                <span>Citizen Public Intake Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Tracking Token</th>
                    <th className="py-2.5 px-3">Complainant / Protection</th>
                    <th className="py-2.5 px-3">Institution & Subject</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Deadline</th>
                    <th className="py-2.5 px-3 text-right">Summary Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {grievanceCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No active Grievance Cell cases.
                      </td>
                    </tr>
                  ) : (
                    grievanceCases.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">
                          {c.trackingToken || c.caseNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-white block">
                            {c.isAnonymous ? 'Anonymous Whistleblower' : c.complainantName || 'Student'}
                          </span>
                          <span className="text-[10px] text-slate-400">{c.complainantType || 'STUDENT'}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-white truncate max-w-xs">{c.institutionName}</p>
                          <p className="text-[11px] text-slate-400 truncate max-w-sm">{c.title}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge type="status" value={c.status} />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {new Date(c.deadlineDate).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenActionModal('MANDATE_FEE_REFUND_7D', c.id, c.institutionId)}
                            className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/40 text-[11px] font-bold transition mr-1.5"
                          >
                            Order Refund
                          </button>
                          <button
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            Timeline
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ANTI-RAGGING & VIGILANCE OFFICER VIEW                                   */}
      {/* ========================================================================= */}
      {activeDesk === 'ANTI_RAGGING_VIGILANCE' && (
        <div className="space-y-6">
          {/* Anti-Ragging & Vigilance Statutory Jurisdiction Header */}
          <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-slate-950 border border-red-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-400/30 uppercase tracking-wider animate-pulse">
                    Supreme Court Raghavan Mandate • Criminal Vigilance Directorate
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Clearance Level: Special Investigative Powers
                  </span>
                </div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                  <Siren className="w-6 h-6 text-red-400 animate-pulse" />
                  <span>Anti-Ragging & Vigilance War Room — Zero-Tolerance Physical Safety & Fraud Probes</span>
                </h1>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  Direct authority to deploy 24h unannounced surprise flying squads, lodge criminal FIRs with local Superintendents of Police, issue emergency student protective injunctions, and impound forged certificates.
                </p>
              </div>

              {/* Anti-Ragging / Vigilance Operational Action Desk */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenActionModal('DISPATCH_FLYING_SQUAD')}
                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow shadow-red-600/30"
                >
                  <Siren className="w-3.5 h-3.5" />
                  <span>Dispatch 24h Flying Squad</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('LODGE_POLICE_FIR')}
                  className="px-3 py-2 rounded-xl bg-orange-950/80 hover:bg-orange-900 text-orange-200 border border-orange-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Lodge Police FIR Notice</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('ISSUE_STUDENT_PROTECTION_ORDER')}
                  className="px-3 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-500/30 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Student Protective Injunction</span>
                </button>
                <button
                  onClick={() => handleOpenActionModal('SUBPOENA_CCTV_MINUTES')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center space-x-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Subpoena Campus CCTV</span>
                </button>
              </div>
            </div>
          </div>

          {/* Vigilance Cell Specific KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-red-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-red-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Critical Ragging SOS Alerts</span>
                <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-red-300">2 Active</p>
              <p className="text-[10px] text-red-400/80 mt-1 font-semibold">Immediate 24-Hour SLA Triggered</p>
            </div>

            <div className="bg-slate-900 border border-orange-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-orange-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Surprise Squad Raids Deployed</span>
                <Siren className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-orange-300">5 Raids</p>
              <p className="text-[10px] text-orange-400/80 mt-1 font-semibold">Unannounced physical inspections</p>
            </div>

            <div className="bg-slate-900 border border-amber-800/40 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Police FIRs / Magistrate Cases</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">3 Cases</p>
              <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">Coordinated criminal referrals</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Criminal Watchlist Institutions</span>
                <Building2 className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-black text-white">4 Institutions</p>
              <p className="text-[10px] text-red-400 mt-1 font-semibold">Ghost faculty & forged land rackets</p>
            </div>
          </div>

          {/* Emergency Safety Protocol Banner */}
          <div className="p-4 rounded-xl bg-red-950/50 border border-red-600/50 flex items-start space-x-3 shadow-lg shadow-red-950/40">
            <Flame className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-red-200 uppercase tracking-wider">
                Supreme Court Mandate Alert: 24-Hour Zero-Tolerance Protocol
              </span>
              <p className="text-red-300 leading-relaxed">
                Ragging allegations involving physical harm, hostel confinement, or psychological extortion mandate instant on-site flying squad mobilization and direct FIR registration under IPC 340/354/506 within 24 hours of notification.
              </p>
            </div>
          </div>

          {/* Vigilance & Safety Work Queue */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Critical Safety & Criminal Vigilance Docket
                </h3>
                <p className="text-xs text-slate-400">Ragging investigations, surprise inspections, and police referrals</p>
              </div>
              <button
                onClick={() => navigate('/severity')}
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1"
              >
                <span>Full Urgency & Risk Queue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Case ID</th>
                    <th className="py-2.5 px-3">Institution & Region</th>
                    <th className="py-2.5 px-3">Allegation Type</th>
                    <th className="py-2.5 px-3">Severity & SLA</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Emergency Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vigilanceCases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No critical vigilance cases requiring emergency dispatch.
                      </td>
                    </tr>
                  ) : (
                    vigilanceCases.map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-mono text-red-400 font-bold">{c.caseNumber}</td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-white truncate max-w-xs">{c.institutionName}</p>
                          <span className="text-[10px] text-slate-500 font-mono">{c.permanentId}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-red-300 block">{c.category.replace(/_/g, ' ')}</span>
                          <p className="text-[11px] text-slate-400 truncate max-w-sm">{c.title}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-950 text-red-300 border border-red-700/60 animate-pulse">
                            CRITICAL (24h)
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge type="status" value={c.status} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleOpenActionModal('DISPATCH_FLYING_SQUAD', c.id, c.institutionId)}
                            className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition mr-1.5 shadow"
                          >
                            Raid
                          </button>
                          <button
                            onClick={() => handleOpenActionModal('LODGE_POLICE_FIR', c.id, c.institutionId)}
                            className="px-2 py-1 rounded bg-orange-950 hover:bg-orange-900 text-orange-200 border border-orange-700/50 text-[11px] transition mr-1.5"
                          >
                            FIR
                          </button>
                          <button
                            onClick={() => navigate(`/cases/${c.id}`)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COUNCIL CENTRAL INTELLIGENCE VIEW (ADMIN & OVERVIEW)                    */}
      {/* ========================================================================= */}
      {activeDesk === 'COUNCIL_UNIFIED' && (
        <div className="space-y-6">
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950/70 to-slate-900 border border-blue-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-wider">
                    Council Unified Overview
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    All-India Regulatory Coordination Hub
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  AICTE Case Intelligence & Risk Assessment System
                </h1>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Unified statutory repository connecting Approval Bureau, Public Grievance Cell, Anti-Ragging Monitoring Cell, and Vigilance Bureau with automatic duplicate detection and conflict prevention.
                </p>
              </div>

              <div className="flex items-center space-x-3 flex-shrink-0">
                <button
                  onClick={() => navigate('/cases')}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span>Case Management</span>
                </button>
                <button
                  onClick={() => navigate('/conflicts')}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                >
                  <span>Conflict Centre</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Conflict Alert Banner */}
          {kpis.activeConflicts > 0 && (
            <div
              onClick={() => navigate('/conflicts')}
              className="cursor-pointer bg-red-950/70 border border-red-600/70 rounded-xl p-4 flex items-center justify-between hover:bg-red-950/90 transition shadow-lg shadow-red-950/50"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-red-600/30 text-red-400 border border-red-500/40">
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-red-200 tracking-wide uppercase">
                      Cross-Bureau Conflict Warning
                    </span>
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded bg-red-600 text-white">
                      {kpis.activeConflicts} Active Collisions
                    </span>
                  </div>
                  <p className="text-xs text-red-300">
                    Multiple bureaus are actively investigating identical institutions (e.g. Approval Bureau reviewing EoA while Vigilance probes Fire NOC forgery).
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 text-xs font-bold text-red-200 hover:text-white">
                <span>Coordinate in Conflict Centre</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          )}

          {/* Unified KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div
              onClick={() => navigate('/cases')}
              className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Cases</span>
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-white">{kpis.totalCases}</p>
              <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1">
                <span className="text-blue-400 font-semibold">{kpis.openCases} Open</span>
                <span>•</span>
                <span>{kpis.totalCases - kpis.openCases} Closed</span>
              </div>
            </div>

            <div
              onClick={() => navigate('/severity')}
              className="cursor-pointer bg-slate-900 border border-red-800/40 hover:border-red-500 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-red-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Critical Safety</span>
                <Flame className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-red-300">{kpis.criticalCases}</p>
              <p className="text-[10px] text-red-400/80 mt-1 font-semibold">Immediate human triage</p>
            </div>

            <div
              onClick={() => navigate('/conflicts')}
              className="cursor-pointer bg-slate-900 border border-amber-800/40 hover:border-amber-500 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Conflicts</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-300">{kpis.activeConflicts}</p>
              <p className="text-[10px] text-amber-400/80 mt-1 font-semibold">Inter-bureau risk alerts</p>
            </div>

            <div
              onClick={() => navigate('/linking')}
              className="cursor-pointer bg-slate-900 border border-blue-800/40 hover:border-blue-500 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-blue-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">AI Match Queue</span>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-black text-blue-300">{kpis.pendingSuggestions}</p>
              <p className="text-[10px] text-blue-400/80 mt-1 font-semibold">Semantic match links</p>
            </div>

            <div
              onClick={() => navigate('/workflows')}
              className="cursor-pointer bg-slate-900 border border-orange-800/40 hover:border-orange-500 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-orange-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Overdue / At Risk</span>
                <Clock className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-black text-orange-300">{kpis.overdueCases}</p>
              <p className="text-[10px] text-orange-400/80 mt-1 font-semibold">{kpis.approachingDeadlineCases} &lt; 72h window</p>
            </div>

            <div
              onClick={() => navigate('/institutions')}
              className="cursor-pointer bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 transition shadow"
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Inst.</span>
                <Building2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{kpis.totalInstitutions}</p>
              <p className="text-[10px] text-red-400 mt-1 font-semibold">{kpis.highRiskInstitutions} high-risk index</p>
            </div>
          </div>

          {/* Visual Analytics: Bureau Workload & Severity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Bureau-wise Active Workload & Case Distribution
                  </h3>
                  <p className="text-xs text-slate-400">Current allocation across AICTE statutory cells</p>
                </div>
                <button
                  onClick={() => navigate('/workflows')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                >
                  <span>SLA Tracker</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bureauWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="active" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Active Cases" />
                    <Bar dataKey="critical" fill="#ef4444" radius={[4, 4, 0, 0]} name="Critical Cases" />
                    <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Disposed / Resolved" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-800 text-xs">
                {bureauWorkload.map(b => (
                  <div key={b.bureauId} className="p-2 rounded bg-slate-950/50 border border-slate-800">
                    <span className="font-bold text-white block">{b.code}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{b.name}</span>
                    <span className="text-xs font-mono font-bold text-blue-400 mt-1 block">{b.active} active</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Severity Distribution
                </h3>
                <p className="text-xs text-slate-400">Triage profile of active repository</p>
              </div>

              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={severityDistribution}
                      dataKey="count"
                      nameKey="level"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                    >
                      {severityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                {severityDistribution.map(s => (
                  <div key={s.level} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-slate-300 font-medium">{s.level.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{s.count} cases</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUTORY BUREAU OPERATIONAL ACTION MODAL                                 */}
      {/* ========================================================================= */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg ${
                  activeDesk === 'APPROVAL_BUREAU' ? 'bg-blue-600/20 text-blue-400' :
                  activeDesk === 'PUBLIC_GRIEVANCE' ? 'bg-emerald-600/20 text-emerald-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {activeDesk === 'APPROVAL_BUREAU' ? <Award className="w-5 h-5" /> :
                   activeDesk === 'PUBLIC_GRIEVANCE' ? <Scale className="w-5 h-5" /> :
                   <Siren className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    {actionModalType.replace(/_/g, ' ')}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Executing official statutory action under {activeDesk.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs space-y-2 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold">{actionSuccessMsg}</p>
                <p className="text-[10px] text-emerald-300">Case status and audit logs updated successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleExecuteBureauAction} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Select Target Case / Complaint
                  </label>
                  <select
                    value={selectedCaseId}
                    onChange={e => setSelectedCaseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    {cases.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.caseNumber} — {c.institutionName} ({c.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dynamic Parameter Field */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    {actionModalType === 'FREEZE_SEATS' ? 'Seats to Freeze / Reduce' :
                     actionModalType === 'MANDATE_FEE_REFUND_7D' ? 'Refund Amount (INR)' :
                     actionModalType === 'DISPATCH_FLYING_SQUAD' ? 'Flying Squad Lead Officer' :
                     actionModalType === 'LODGE_POLICE_FIR' ? 'Police Station / SP Jurisdiction' :
                     actionModalType === 'SCHEDULE_LOK_ADALAT' ? 'Hearing Date & Time' :
                     'Directive Reference / Parameter'}
                  </label>
                  <input
                    type="text"
                    value={actionSubParam}
                    onChange={e => setActionSubParam(e.target.value)}
                    placeholder={
                      actionModalType === 'FREEZE_SEATS' ? 'e.g. 60' :
                      actionModalType === 'MANDATE_FEE_REFUND_7D' ? 'e.g. 2,50,000' :
                      actionModalType === 'DISPATCH_FLYING_SQUAD' ? 'e.g. Dr. K. M. Rao (Senior Inspector)' :
                      actionModalType === 'LODGE_POLICE_FIR' ? 'e.g. Hinjawadi Police Station, Pune' :
                      actionModalType === 'SCHEDULE_LOK_ADALAT' ? 'e.g. 2026-11-05 11:00 AM' :
                      'Enter reference parameter...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Order Details & Statutory Grounds
                  </label>
                  <textarea
                    rows={3}
                    value={actionDetails}
                    onChange={e => setActionDetails(e.target.value)}
                    placeholder="Enter formal reasons, section numbers, inspection findings, and conditions..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActionModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionSubmitting}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition flex items-center space-x-1.5"
                  >
                    {actionSubmitting ? <span>Executing...</span> : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Issue Statutory Order</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
