/**
 * Unified API Client for AICTE Case Intelligence
 */

import {
  User,
  Institution,
  ComplaintCase,
  CaseRelationshipSuggestion,
  CrossBureauConflictAlert,
  AuditLogEntry,
  NotificationItem,
  DashboardData,
  Bureau,
} from '../types';

const BASE_URL = '/api/v1';

class ApiService {
  private currentRole: string = 'ADMIN';

  public setRole(role: string, userId?: string) {
    this.currentRole = role;
    localStorage.setItem('aicte_user_role', role);
    if (userId) {
      localStorage.setItem('aicte_user_id', userId);
    }
  }

  public getRole(): string {
    return localStorage.getItem('aicte_user_role') || this.currentRole;
  }

  public getUserId(): string {
    return localStorage.getItem('aicte_user_id') || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const userId = this.getUserId();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-role': this.getRole(),
      ...(userId ? { 'x-user-id': userId } : {}),
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errMessage = `HTTP error ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) errMessage = errorJson.error;
      } catch (e) {
        // fallback to status text
      }
      throw new Error(errMessage);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  public async getDemoUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/auth/demo-users');
  }

  public async getCurrentUser(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/me');
  }

  public async login(usernameOrEmail: string, password?: string): Promise<{ token: string; user: User; message: string }> {
    const res = await this.request<{ token: string; user: User; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
    });
    if (res.user) {
      this.setRole(res.user.role, res.user.id);
      localStorage.setItem('aicte_auth_token', res.token);
      localStorage.setItem('aicte_logged_user', JSON.stringify(res.user));
    }
    return res;
  }

  public logout(): void {
    localStorage.removeItem('aicte_auth_token');
    localStorage.removeItem('aicte_logged_user');
    localStorage.removeItem('aicte_user_role');
    localStorage.removeItem('aicte_user_id');
  }

  // Health
  public async getSystemHealth(): Promise<any> {
    return this.request<any>('/health');
  }

  // Dashboard
  public async getDashboardData(): Promise<DashboardData> {
    return this.request<DashboardData>('/dashboard');
  }

  // Cases
  public async getCases(params: Record<string, string> = {}): Promise<{
    data: ComplaintCase[];
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
  }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/cases${query ? `?${query}` : ''}`);
  }

  public async getCaseById(id: string): Promise<{
    case: ComplaintCase;
    linkedCases: ComplaintCase[];
    candidateSuggestions: CaseRelationshipSuggestion[];
    institution?: Institution;
  }> {
    return this.request(`/cases/${id}`);
  }

  public async createCase(caseData: Partial<ComplaintCase>): Promise<{
    case: ComplaintCase;
    severityEvaluation: any;
    generatedSuggestionsCount: number;
    message: string;
  }> {
    return this.request('/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  public async updateCaseStatus(caseId: string, status: string, comment?: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request(`/cases/${caseId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    });
  }

  public async reassignOfficer(caseId: string, officerName: string, officerEmail?: string, reason?: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request(`/cases/${caseId}/reassign`, {
      method: 'PATCH',
      body: JSON.stringify({ officerName, officerEmail, reason }),
    });
  }

  public async transferBureau(caseId: string, bureauId: string, reason: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request(`/cases/${caseId}/transfer`, {
      method: 'PATCH',
      body: JSON.stringify({ bureauId, reason }),
    });
  }

  public async addCaseNote(caseId: string, note: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request(`/cases/${caseId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  }

  public async updateDeadline(caseId: string, deadlineDate: string, nextAction: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request(`/cases/${caseId}/deadline`, {
      method: 'PATCH',
      body: JSON.stringify({ deadlineDate, nextAction }),
    });
  }

  // Institutions
  public async getInstitutions(params: Record<string, string> = {}): Promise<{ institutions: Institution[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/institutions${query ? `?${query}` : ''}`);
  }

  public async getInstitutionById(id: string): Promise<{
    institution: Institution;
    cases: ComplaintCase[];
    conflicts: CrossBureauConflictAlert[];
    suggestions: CaseRelationshipSuggestion[];
    bureausInvolved: { bureauName: string; count: number }[];
  }> {
    return this.request(`/institutions/${id}`);
  }

  // AI Case Linking
  public async getSuggestions(status: string = 'ALL'): Promise<{ suggestions: CaseRelationshipSuggestion[] }> {
    return this.request(`/linking/suggestions?status=${status}`);
  }

  public async compareCases(caseIdA: string, caseIdB: string): Promise<any> {
    return this.request('/linking/compare', {
      method: 'POST',
      body: JSON.stringify({ caseIdA, caseIdB }),
    });
  }

  public async reviewSuggestion(id: string, status: 'CONFIRMED' | 'REJECTED' | 'DISMISSED', reason: string): Promise<{ suggestion: CaseRelationshipSuggestion; message: string }> {
    return this.request(`/linking/suggestions/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  }

  public async manualLink(sourceCaseId: string, targetCaseId: string, reason: string): Promise<any> {
    return this.request('/linking/manual-link', {
      method: 'POST',
      body: JSON.stringify({ sourceCaseId, targetCaseId, reason }),
    });
  }

  // Cross-Bureau Conflicts
  public async getConflicts(status: string = 'ALL'): Promise<{ conflicts: CrossBureauConflictAlert[] }> {
    return this.request(`/conflicts?status=${status}`);
  }

  public async updateConflictStatus(id: string, status: string, notes?: string): Promise<{ conflict: CrossBureauConflictAlert; message: string }> {
    return this.request(`/conflicts/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  }

  public async triggerConflictScan(): Promise<{ message: string; activeConflictsCount: number; conflicts: CrossBureauConflictAlert[] }> {
    return this.request('/conflicts/scan', {
      method: 'POST',
    });
  }

  // Severity & Urgency
  public async getSeverityQueue(): Promise<{ queue: ComplaintCase[] }> {
    return this.request('/severity/queue');
  }

  public async evaluateSeverity(payload: { title: string; description: string; category: string; complainantType?: string }): Promise<any> {
    return this.request('/severity/evaluate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async overrideSeverity(caseId: string, newSeverity: string, overrideReason: string): Promise<{ case: ComplaintCase; message: string }> {
    return this.request('/severity/override', {
      method: 'POST',
      body: JSON.stringify({ caseId, newSeverity, overrideReason }),
    });
  }

  // Graph
  public async getGraphData(): Promise<{ nodes: any[]; edges: any[] }> {
    return this.request('/graph');
  }

  // Workflows & Deadlines
  public async getDeadlines(): Promise<{ deadlines: any[] }> {
    return this.request('/workflows/deadlines');
  }

  // Notifications
  public async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.request('/notifications');
  }

  public async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  public async markAllNotificationsRead(): Promise<{ success: boolean }> {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  // Audit Logs
  public async getAuditLogs(params: Record<string, string> = {}): Promise<{ auditLogs: AuditLogEntry[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs${query ? `?${query}` : ''}`);
  }

  // Citizen & Public Grievance Portal
  public async trackGrievance(token: string): Promise<{ grievance: any }> {
    return this.request(`/citizen/track/${encodeURIComponent(token)}`);
  }

  public async submitCitizenFeedback(token: string, note: string, evidenceFile?: string): Promise<{ message: string; case: any }> {
    return this.request(`/citizen/track/${encodeURIComponent(token)}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ note, evidenceFile }),
    });
  }

  public async getMyComplaints(): Promise<{ complaints: ComplaintCase[] }> {
    return this.request('/citizen/my-complaints');
  }

  // Specialized Bureau Actions
  public async executeApprovalAction(payload: {
    caseId?: string;
    institutionId?: string;
    actionType: string;
    details: string;
    seatReduction?: number;
    inspectionDate?: string;
  }): Promise<{ success: boolean; message: string; updatedStatus: string }> {
    return this.request('/bureau-actions/approval', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async executeGrievanceAction(payload: {
    caseId?: string;
    institutionId?: string;
    actionType: string;
    details: string;
    refundAmount?: string;
    deadlineDate?: string;
  }): Promise<{ success: boolean; message: string; updatedStatus: string }> {
    return this.request('/bureau-actions/grievance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async executeVigilanceAction(payload: {
    caseId?: string;
    institutionId?: string;
    actionType: string;
    details: string;
    squadLead?: string;
    policeStation?: string;
  }): Promise<{ success: boolean; message: string; updatedStatus: string }> {
    return this.request('/bureau-actions/vigilance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Reset Demo
  public async resetDemo(): Promise<any> {
    return this.request('/demo/reset', { method: 'POST' });
  }
}

export const api = new ApiService();
