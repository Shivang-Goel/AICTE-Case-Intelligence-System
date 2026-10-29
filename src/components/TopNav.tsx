import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  Bell,
  Sparkles,
  UserCheck,
  ChevronDown,
  Shield,
  Activity,
  Check,
  ExternalLink,
  GraduationCap,
  Menu,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { User, NotificationItem } from '../types';
import { api } from '../services/api';

interface Props {
  currentUser: User | null;
  onRoleChange: (role: string, userId?: string) => void;
  notifications: NotificationItem[];
  onRefreshNotifications: () => void;
  collapsed: boolean;
  onToggleSidebar?: () => void;
}

const ROLES = [
  {
    key: 'BUREAU_OFFICER_AB',
    userId: 'usr-officer-ab',
    name: 'Priya Ramanathan',
    title: 'Bureau Officer — Approval Bureau',
    desc: 'Extension of Approval (EoA), Intake Capacity, Faculty Cadre & Infrastructure Norms',
    badge: 'EoA & Norms',
    badgeColor: 'bg-blue-600',
  },
  {
    key: 'BUREAU_OFFICER_PGC',
    userId: 'usr-officer-pgc',
    name: 'Smt. Ananya Sen',
    title: 'Bureau Officer — Public Grievance Cell',
    desc: 'Mandatory 7-Day Fee Refunds, Withheld Marksheet Release, Faculty Arrears & SGRC',
    badge: 'Fees & Marksheets',
    badgeColor: 'bg-emerald-600',
  },
  {
    key: 'BUREAU_OFFICER_ARMC',
    userId: 'usr-officer-armc',
    name: 'Shri Vikram Malhotra',
    title: 'Bureau Officer — Anti-Ragging & Vigilance',
    desc: 'Zero-Tolerance Student Safety, 24h Surprise Flying Squads, Police FIRs & Forged NOCs',
    badge: 'Safety & Raids',
    badgeColor: 'bg-red-600',
  },
  {
    key: 'ADMIN',
    userId: 'usr-admin-1',
    name: 'Dr. Arvind Sharma',
    title: 'Chief Regulatory Officer (Council Admin)',
    desc: 'Full council governance, unified oversight, audit logs & system health',
    badge: 'Council Admin',
    badgeColor: 'bg-purple-600',
  },
  {
    key: 'REVIEWER',
    userId: 'usr-reviewer-1',
    name: 'Rajesh Deshmukh',
    title: 'Regulatory Reviewer & Ombudsman',
    desc: 'Adjudicate AI case linking and resolve cross-bureau conflicts',
    badge: 'AI Reviewer',
    badgeColor: 'bg-amber-600',
  },
  {
    key: 'READONLY_MANAGEMENT',
    userId: 'usr-mgmt-1',
    name: 'Sunita Verma',
    title: 'Executive Management (Read-Only)',
    desc: 'National macro analytics, board reports & statutory intelligence',
    badge: 'Executive',
    badgeColor: 'bg-indigo-600',
  },
  {
    key: 'CITIZEN',
    userId: 'usr-citizen-1',
    name: 'Aarav Sharma',
    title: 'Student / Complainant (Citizen)',
    desc: 'Public portal: File grievances, track status & view student protections',
    badge: 'Citizen / Student',
    badgeColor: 'bg-teal-600',
  },
];

export const TopNav: React.FC<Props> = ({
  currentUser,
  onRoleChange,
  notifications,
  onRefreshNotifications,
  collapsed,
  onToggleSidebar,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    cases: any[];
    institutions: any[];
  }>({ cases: [], institutions: [] });
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isCitizenPortal = location.pathname.startsWith('/citizen-portal');

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live search handler
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults({ cases: [], institutions: [] });
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [casesRes, instRes] = await Promise.all([
          api.getCases({ search: searchQuery, limit: '4' }),
          api.getInstitutions({ search: searchQuery }),
        ]);
        setSearchResults({
          cases: casesRes.data || [],
          institutions: (instRes.institutions || []).slice(0, 3),
        });
        setIsSearching(true);
      } catch (e) {
        console.error('Search error', e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    onRefreshNotifications();
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    await api.markNotificationRead(notif.id);
    onRefreshNotifications();
    setNotifDropdownOpen(false);
    if (notif.linkTo) {
      navigate(notif.linkTo);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 transition-all duration-300 ${
        collapsed ? 'left-20' : 'left-64'
      } flex items-center justify-between px-4 sm:px-6`}
    >
      <div className="flex items-center space-x-2 w-full max-w-md">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition flex-shrink-0"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        {/* Global Search Bar */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 2) setIsSearching(true);
              }}
              placeholder="Search AICTE Case ID, Institution, or Keywords..."
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-10 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

        {/* Search Results Dropdown */}
        {isSearching && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 z-50 max-h-96 overflow-y-auto">
            {searchResults.cases.length === 0 && searchResults.institutions.length === 0 ? (
              <p className="text-xs text-slate-400 p-3 text-center">No matching records found.</p>
            ) : (
              <div className="space-y-3">
                {searchResults.institutions.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Institutions
                    </h5>
                    {searchResults.institutions.map(inst => (
                      <button
                        key={inst.id}
                        onClick={() => {
                          setIsSearching(false);
                          setSearchQuery('');
                          navigate(`/institutions/${inst.id}`);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-xs flex items-center justify-between transition"
                      >
                        <div>
                          <p className="font-semibold text-white">{inst.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{inst.permanentId} • {inst.city}, {inst.state}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.cases.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                      Cases & Complaints
                    </h5>
                    {searchResults.cases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setIsSearching(false);
                          setSearchQuery('');
                          navigate(`/cases/${c.id}`);
                        }}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-slate-800 text-xs flex items-center justify-between transition"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-blue-400 font-bold text-[11px]">{c.caseNumber}</span>
                            <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">{c.bureauName}</span>
                          </div>
                          <p className="text-slate-300 font-medium truncate max-w-sm">{c.title}</p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Portal Switcher Button */}
        <button
          onClick={() => {
            if (isCitizenPortal) {
              navigate('/dashboard');
            } else {
              navigate('/citizen-portal');
            }
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
            isCitizenPortal
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 ring-1 ring-blue-400/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-1 ring-emerald-400/60 animate-pulse'
          }`}
          title={isCitizenPortal ? 'Return to AICTE Council Regulatory Hub' : 'Open Student & Citizen Public Grievance Portal'}
        >
          <GraduationCap className="w-4 h-4 flex-shrink-0" />
          <span className="font-extrabold">
            {isCitizenPortal ? '🏛️ Council Hub' : '🎓 Student Portal'}
          </span>
        </button>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
            className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-slate-900 animate-ping" />
            )}
          </button>

          {notifDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Intelligence Alerts</h4>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-red-600 text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[10px] text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No notifications.</p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-2.5 rounded-lg text-xs cursor-pointer transition border ${
                        n.read
                          ? 'bg-slate-950/40 border-slate-800 text-slate-400'
                          : 'bg-slate-800/80 border-blue-500/30 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          n.type === 'URGENT_SAFETY' ? 'text-red-400' :
                          n.type === 'CONFLICT_DETECTED' ? 'text-amber-400' : 'text-blue-400'
                        }`}>
                          {n.title}
                        </span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </div>
                      <p className="mt-1 text-slate-300 text-[11px] leading-snug">{n.message}</p>
                      <span className="text-[9px] text-slate-500 mt-1 block">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher & User Profile */}
        <div ref={roleRef} className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 rounded-lg hover:bg-slate-800/80 transition border border-slate-800 text-left"
          >
            <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-500/40 flex items-center justify-center text-blue-300 font-bold text-xs">
              {currentUser?.name ? currentUser.name.charAt(0) : 'A'}
            </div>
            <div className="hidden md:flex flex-col">
              <span className="text-xs font-semibold text-white leading-tight">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-blue-400 font-medium">
                {currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'ADMIN'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-80 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain custom-nav-scroll bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 mb-2 sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Role / Persona (Demo RBAC)
                </p>
                <p className="text-[10px] text-slate-500">
                  Simulate different AICTE authorization levels:
                </p>
              </div>

              {/* Direct Quick-Launch for Student Portal */}
              <div className="p-1 mb-2 bg-emerald-950/60 border border-emerald-500/50 rounded-lg">
                <button
                  onClick={() => {
                    const citizenRole = ROLES.find(r => r.key === 'CITIZEN');
                    if (citizenRole) {
                      onRoleChange(citizenRole.key, citizenRole.userId);
                    }
                    setRoleDropdownOpen(false);
                    navigate('/citizen-portal');
                  }}
                  className="w-full text-left p-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-between transition shadow"
                >
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-emerald-100" />
                    <span>Launch Student Grievance Portal</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-emerald-200" />
                </button>
              </div>

              <div className="space-y-1">
                {ROLES.map(role => {
                  const isActive = currentUser?.role === role.key;
                  return (
                    <button
                      key={role.key}
                      onClick={() => {
                        onRoleChange(role.key, role.userId);
                        setRoleDropdownOpen(false);
                        if (role.key === 'CITIZEN') {
                          navigate('/citizen-portal');
                        } else {
                          navigate('/dashboard');
                        }
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition flex items-start justify-between ${
                        isActive
                          ? 'bg-blue-950/70 text-blue-200 border border-blue-600/50'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="space-y-0.5 flex-1 pr-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">{role.title}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold text-white ${role.badgeColor}`}>
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium">{role.name}</p>
                        <p className="text-[9px] text-slate-400 leading-tight">{role.desc}</p>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              {/* Sign Out / Go to Login Page */}
              <div className="pt-2 border-t border-slate-800 mt-2">
                <button
                  onClick={() => {
                    api.logout();
                    setRoleDropdownOpen(false);
                    navigate('/login');
                  }}
                  className="w-full text-left p-2 rounded-lg text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out & Go to Login Page</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
