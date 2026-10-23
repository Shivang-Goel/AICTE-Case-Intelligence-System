import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Inbox,
  FilePlus2,
  Building2,
  Sparkles,
  AlertTriangle,
  Flame,
  Network,
  Clock,
  BarChart3,
  Bell,
  ListOrdered,
  Activity,
  Shield,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeConflictsCount: number;
  urgentSafetyCount: number;
  pendingSuggestionsCount: number;
  unreadNotificationsCount: number;
  userRole?: string;
  bureauId?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
  badge?: number;
  badgeColor?: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
}

export const Sidebar: React.FC<Props> = ({
  collapsed,
  onToggle,
  activeConflictsCount,
  urgentSafetyCount,
  pendingSuggestionsCount,
  unreadNotificationsCount,
  userRole = 'ADMIN',
  bureauId,
}) => {
  const isCitizen = userRole === 'CITIZEN';
  const isApprovalOfficer = userRole === 'BUREAU_OFFICER_AB' || bureauId === 'bur-ab';
  const isGrievanceOfficer = userRole === 'BUREAU_OFFICER_PGC' || bureauId === 'bur-pgc';
  const isVigilanceOfficer = userRole === 'BUREAU_OFFICER_ARMC' || bureauId === 'bur-armc' || bureauId === 'bur-vig';

  const citizenNavSections: NavSection[] = [
    {
      heading: 'STUDENT & CITIZEN PORTAL',
      items: [
        { name: 'Public Grievance Portal', path: '/citizen-portal', icon: GraduationCap, highlight: true },
        { name: 'Track Grievance Status', path: '/citizen-portal', icon: Clock },
        { name: 'Institutions Directory', path: '/institutions', icon: Building2 },
      ],
    },
    {
      heading: 'PUBLIC TRANSPARENCY',
      items: [
        { name: 'Public Cases Registry', path: '/cases', icon: Inbox },
        { name: 'National Overview', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Rights & Helplines', path: '/citizen-portal', icon: ShieldCheck },
      ],
    },
  ];

  const approvalOfficerSections: NavSection[] = [
    {
      heading: 'APPROVAL JURISDICTION',
      items: [
        { name: 'Approval Bureau Desk', path: '/dashboard', icon: LayoutDashboard, highlight: true },
        { name: 'EoA & Scrutiny Cases', path: '/cases', icon: Inbox },
        { name: 'Institution 360° Norms', path: '/institutions', icon: Building2 },
      ],
    },
    {
      heading: 'INTELLIGENCE & CONFLICTS',
      items: [
        {
          name: 'Approval Conflict Alerts',
          path: '/conflicts',
          icon: AlertTriangle,
          badge: activeConflictsCount > 0 ? activeConflictsCount : undefined,
          badgeColor: 'bg-red-600 animate-pulse',
        },
        {
          name: 'AI Matching Docket',
          path: '/linking',
          icon: Sparkles,
          badge: pendingSuggestionsCount > 0 ? pendingSuggestionsCount : undefined,
          badgeColor: 'bg-blue-600',
        },
        { name: 'Institution Norms Graph', path: '/graph', icon: Network },
      ],
    },
    {
      heading: 'HEARINGS & ANALYTICS',
      items: [
        { name: 'Hearing Schedules & SLAs', path: '/workflows', icon: Clock },
        { name: 'Intake Norms Analytics', path: '/analytics', icon: BarChart3 },
        {
          name: 'Notifications',
          path: '/notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-cyan-600',
        },
        { name: 'Audit Trail', path: '/audit-logs', icon: ListOrdered },
      ],
    },
  ];

  const grievanceOfficerSections: NavSection[] = [
    {
      heading: 'GRIEVANCE OMBUDSMAN',
      items: [
        { name: 'Grievance Redressal Desk', path: '/dashboard', icon: LayoutDashboard, highlight: true },
        { name: 'Fee & Marksheet Claims', path: '/cases', icon: Inbox },
        { name: 'Citizen Public Portal', path: '/citizen-portal', icon: GraduationCap },
        { name: 'Institution Compliance', path: '/institutions', icon: Building2 },
      ],
    },
    {
      heading: 'ADJUDICATION & MEDIATION',
      items: [
        {
          name: 'Urgent Grievance Queue',
          path: '/severity',
          icon: Flame,
          badge: urgentSafetyCount > 0 ? urgentSafetyCount : undefined,
          badgeColor: 'bg-amber-600',
        },
        {
          name: 'Inter-Bureau Disputes',
          path: '/conflicts',
          icon: AlertTriangle,
          badge: activeConflictsCount > 0 ? activeConflictsCount : undefined,
          badgeColor: 'bg-red-600 animate-pulse',
        },
        { name: 'Complainant Case Graph', path: '/graph', icon: Network },
      ],
    },
    {
      heading: 'SLA TRACKING & AUDITS',
      items: [
        { name: '7-Day SLA & Lok Adalat', path: '/workflows', icon: Clock },
        { name: 'Redressal Analytics', path: '/analytics', icon: BarChart3 },
        {
          name: 'Citizen Alerts',
          path: '/notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-cyan-600',
        },
        { name: 'Grievance Audit Trail', path: '/audit-logs', icon: ListOrdered },
      ],
    },
  ];

  const vigilanceOfficerSections: NavSection[] = [
    {
      heading: 'VIGILANCE & SAFETY WAR ROOM',
      items: [
        { name: 'Vigilance War Room', path: '/dashboard', icon: LayoutDashboard, highlight: true },
        { name: 'Ragging & Fraud Cases', path: '/cases', icon: Inbox },
        {
          name: 'Critical Ragging SOS (24h)',
          path: '/severity',
          icon: Flame,
          badge: urgentSafetyCount > 0 ? urgentSafetyCount : undefined,
          badgeColor: 'bg-red-600 animate-pulse',
        },
        { name: 'High-Risk Watchlist 360°', path: '/institutions', icon: Building2 },
      ],
    },
    {
      heading: 'CRIMINAL & FIELD OPS',
      items: [
        {
          name: 'Cross-Bureau Collisions',
          path: '/conflicts',
          icon: AlertTriangle,
          badge: activeConflictsCount > 0 ? activeConflictsCount : undefined,
          badgeColor: 'bg-red-600',
        },
        { name: 'Syndicate Network Graph', path: '/graph', icon: Network },
        {
          name: 'AI Fraud Detection',
          path: '/linking',
          icon: Sparkles,
          badge: pendingSuggestionsCount > 0 ? pendingSuggestionsCount : undefined,
          badgeColor: 'bg-blue-600',
        },
      ],
    },
    {
      heading: 'ENFORCEMENT LOGS',
      items: [
        { name: 'Squad Raids & FIR Logs', path: '/audit-logs', icon: ListOrdered },
        { name: 'Investigation SLAs', path: '/workflows', icon: Clock },
        {
          name: 'Emergency SOS Alerts',
          path: '/notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-red-600',
        },
        { name: 'System Security Health', path: '/system-health', icon: Activity },
      ],
    },
  ];

  const generalCouncilSections: NavSection[] = [
    {
      heading: 'COUNCIL INTELLIGENCE',
      items: [
        { name: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Case Management', path: '/cases', icon: Inbox },
        { name: 'Citizen Public Portal', path: '/citizen-portal', icon: GraduationCap },
        { name: 'Institution 360°', path: '/institutions', icon: Building2 },
      ],
    },
    {
      heading: 'AI & CONFLICT DETECTION',
      items: [
        {
          name: 'AI Case Linking',
          path: '/linking',
          icon: Sparkles,
          badge: pendingSuggestionsCount > 0 ? pendingSuggestionsCount : undefined,
          badgeColor: 'bg-blue-600',
        },
        {
          name: 'Cross-Bureau Conflicts',
          path: '/conflicts',
          icon: AlertTriangle,
          badge: activeConflictsCount > 0 ? activeConflictsCount : undefined,
          badgeColor: 'bg-red-600 animate-pulse',
        },
        {
          name: 'Urgency & Risk Queue',
          path: '/severity',
          icon: Flame,
          badge: urgentSafetyCount > 0 ? urgentSafetyCount : undefined,
          badgeColor: 'bg-amber-600',
        },
        { name: 'Relationship Graph', path: '/graph', icon: Network },
      ],
    },
    {
      heading: 'OPERATIONS & REPORTING',
      items: [
        { name: 'Workflows & SLAs', path: '/workflows', icon: Clock },
        { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
        {
          name: 'Notifications',
          path: '/notifications',
          icon: Bell,
          badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
          badgeColor: 'bg-cyan-600',
        },
        { name: 'Audit Trail', path: '/audit-logs', icon: ListOrdered },
        { name: 'System Health', path: '/system-health', icon: Activity },
      ],
    },
  ];

  const navSections = isCitizen
    ? citizenNavSections
    : isApprovalOfficer
    ? approvalOfficerSections
    : isGrievanceOfficer
    ? grievanceOfficerSections
    : isVigilanceOfficer
    ? vigilanceOfficerSections
    : generalCouncilSections;

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 flex items-center justify-center border border-blue-500/30 flex-shrink-0 shadow-md">
            <Shield className="w-5 h-5 text-blue-200" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-extrabold tracking-tight text-white flex items-center gap-1.5">
                AICTE <span className="text-blue-400 font-semibold text-xs px-1 py-0.5 rounded bg-blue-950/80 border border-blue-800/60">SIH26264</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase truncate">
                Case Intelligence System
              </span>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.heading}
              </h4>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/90 text-white shadow-md shadow-blue-700/20 font-semibold'
                        : item.highlight
                        ? 'text-blue-300 hover:bg-blue-950/50 hover:text-blue-200 border border-blue-800/40 bg-blue-950/20'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${collapsed ? 'justify-center px-2' : ''}`
                  }
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </div>
                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white shadow-sm ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900" />
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 m-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-semibold">
            <span>AICTE Regulatory Hub</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
          </div>
          <p className="text-[10px] text-slate-500 leading-tight">
            Permanent ID Cross-Referencing & Multi-Bureau Collision Engine active.
          </p>
        </div>
      )}
    </aside>
  );
};
