/**
 * CaseSetu — AICTE Case Intelligence & Risk Assessment System
 * Main React Application Shell
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CasesPage } from './pages/CasesPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { ComplaintIntakePage } from './pages/ComplaintIntakePage';
import { InstitutionsPage } from './pages/InstitutionsPage';
import { Institution360Page } from './pages/Institution360Page';
import { CaseLinkingPage } from './pages/CaseLinkingPage';
import { ConflictCentrePage } from './pages/ConflictCentrePage';
import { SeverityQueuePage } from './pages/SeverityQueuePage';
import { RelationshipGraphPage } from './pages/RelationshipGraphPage';
import { WorkflowDeadlinesPage } from './pages/WorkflowDeadlinesPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SystemHealthPage } from './pages/SystemHealthPage';
import { CitizenPortalPage } from './pages/CitizenPortalPage';
import { api } from './services/api';
import { User, NotificationItem } from './types';

interface LayoutProps {
  currentUser: User | null;
  onRoleChange: (role: string, userId?: string) => void;
  loadUserAndBadges: () => void;
  notifications: NotificationItem[];
  activeConflictsCount: number;
  urgentSafetyCount: number;
  pendingSuggestionsCount: number;
}

function MainLayout({
  currentUser,
  onRoleChange,
  loadUserAndBadges,
  notifications,
  activeConflictsCount,
  urgentSafetyCount,
  pendingSuggestionsCount,
}: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const hasToken = Boolean(localStorage.getItem('aicte_auth_token'));
  const isCitizenPortal = location.pathname.startsWith('/citizen-portal');
  const isLoginPage = location.pathname === '/login';

  // If citizen portal is requested, allow public access
  if (isCitizenPortal) {
    return (
      <div className="min-h-screen bg-[#080d1a] text-slate-100">
        <CitizenPortalPage />
      </div>
    );
  }

  // If user is not logged in, enforce login page
  if (!hasToken || !currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLoginSuccess={loadUserAndBadges} />} />
        <Route path="/citizen-portal" element={<CitizenPortalPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // If already logged in and visiting /login, redirect to dashboard
  if (isLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex">
      {/* Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeConflictsCount={activeConflictsCount}
        urgentSafetyCount={urgentSafetyCount}
        pendingSuggestionsCount={pendingSuggestionsCount}
        unreadNotificationsCount={unreadNotificationsCount}
        userRole={currentUser?.role}
        bureauId={currentUser?.bureauId}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Navigation */}
        <TopNav
          currentUser={currentUser}
          onRoleChange={onRoleChange}
          notifications={notifications}
          onRefreshNotifications={loadUserAndBadges}
          collapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Page View Container */}
        <main className="flex-1 pt-20 px-6 pb-12 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} onRefresh={loadUserAndBadges} />} />
            <Route path="/cases" element={<CasesPage />} />
            <Route path="/cases/:id" element={<CaseDetailPage />} />
            <Route path="/intake" element={<ComplaintIntakePage />} />
            <Route path="/institutions" element={<InstitutionsPage />} />
            <Route path="/institutions/:id" element={<Institution360Page />} />
            <Route path="/linking" element={<CaseLinkingPage />} />
            <Route path="/conflicts" element={<ConflictCentrePage />} />
            <Route path="/severity" element={<SeverityQueuePage />} />
            <Route path="/graph" element={<RelationshipGraphPage />} />
            <Route path="/workflows" element={<WorkflowDeadlinesPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/system-health" element={<SystemHealthPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeConflictsCount, setActiveConflictsCount] = useState(0);
  const [urgentSafetyCount, setUrgentSafetyCount] = useState(0);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadUserAndBadges();
  }, []);

  const loadUserAndBadges = async () => {
    try {
      const userRes = await api.getCurrentUser();
      setCurrentUser(userRes.user);

      if (userRes.user) {
        const [dashRes, notifRes, sugRes] = await Promise.all([
          api.getDashboardData(),
          api.getNotifications(),
          api.getSuggestions('PENDING_REVIEW'),
        ]);

        setActiveConflictsCount(dashRes.kpis.activeConflicts);
        setUrgentSafetyCount(dashRes.kpis.criticalCases);
        setPendingSuggestionsCount(sugRes.suggestions.length);
        setNotifications(notifRes.notifications);
      }
    } catch (e) {
      console.warn('Initial telemetry load warning:', e);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleRoleChange = async (role: string, userId?: string) => {
    api.setRole(role, userId);
    try {
      const res = await api.getCurrentUser();
      setCurrentUser(res.user);
      loadUserAndBadges();
    } catch (e) {
      console.error(e);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Connecting to CaseSetu Secure Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <MainLayout
        currentUser={currentUser}
        onRoleChange={handleRoleChange}
        loadUserAndBadges={loadUserAndBadges}
        notifications={notifications}
        activeConflictsCount={activeConflictsCount}
        urgentSafetyCount={urgentSafetyCount}
        pendingSuggestionsCount={pendingSuggestionsCount}
      />
    </BrowserRouter>
  );
}
