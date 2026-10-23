/**
 * AICTE Case Intelligence & Risk Assessment System
 * Main React Application Shell
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Counters for sidebar badges
  const [activeConflictsCount, setActiveConflictsCount] = useState(0);
  const [urgentSafetyCount, setUrgentSafetyCount] = useState(0);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);

  useEffect(() => {
    loadUserAndBadges();
  }, []);

  const loadUserAndBadges = async () => {
    try {
      const [userRes, dashRes, notifRes, sugRes] = await Promise.all([
        api.getCurrentUser(),
        api.getDashboardData(),
        api.getNotifications(),
        api.getSuggestions('PENDING_REVIEW'),
      ]);

      setCurrentUser(userRes.user);
      setActiveConflictsCount(dashRes.kpis.activeConflicts);
      setUrgentSafetyCount(dashRes.kpis.criticalCases);
      setPendingSuggestionsCount(sugRes.suggestions.length);
      setNotifications(notifRes.notifications);
    } catch (e) {
      console.warn('Initial telemetry load warning:', e);
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

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <BrowserRouter>
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
            onRoleChange={handleRoleChange}
            notifications={notifications}
            onRefreshNotifications={loadUserAndBadges}
            collapsed={sidebarCollapsed}
          />

          {/* Page View Container */}
          <main className="flex-1 pt-20 px-6 pb-12 max-w-7xl w-full mx-auto">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage currentUser={currentUser} onRefresh={loadUserAndBadges} />} />
              <Route path="/citizen-portal" element={<CitizenPortalPage />} />
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
    </BrowserRouter>
  );
}
