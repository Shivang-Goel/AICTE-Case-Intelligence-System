/**
 * Frontend Type Definitions for AICTE Case Intelligence
 */

export type UserRole =
  | 'ADMIN'
  | 'BUREAU_OFFICER'
  | 'BUREAU_OFFICER_AB'
  | 'BUREAU_OFFICER_PGC'
  | 'BUREAU_OFFICER_ARMC'
  | 'REVIEWER'
  | 'READONLY_MANAGEMENT'
  | 'CITIZEN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  bureauId?: string;
  bureauName?: string;
  designation: string;
}

export interface Bureau {
  id: string;
  code: string;
  name: string;
  description: string;
  headOfficer: string;
  activeCasesCount: number;
}

export interface Institution {
  id: string;
  permanentId: string;
  name: string;
  state: string;
  city: string;
  address: string;
  type: string;
  establishedYear: number;
  approvedIntake: number;
  riskScore: number;
  riskCategory: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  activeCasesCount: number;
  totalComplaintsCount: number;
  hasActiveConflict: boolean;
  naacGrade?: string;
  nbaAccredited: boolean;
}

export interface CaseAction {
  id: string;
  caseId: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  actionType: string;
  description: string;
  previousValue?: string;
  newValue?: string;
}

export interface ComplaintCase {
  id: string;
  caseNumber: string;
  trackingToken?: string;
  title: string;
  description: string;
  institutionId: string;
  institutionName: string;
  permanentId: string;
  bureauId: string;
  bureauName: string;
  category: 'SAFETY_RAGGING' | 'INFRASTRUCTURE_DEFICIT' | 'FACULTY_FRAUD' | 'FEE_EXTORTION' | 'UNAPPROVED_PROGRAM' | 'ADMISSION_IRREGULARITY' | 'EXAM_MALPRACTICE' | 'GOVERNANCE_DISPUTE';
  submissionDate: string;
  source: 'AICTE_PORTAL' | 'STUDENT_GRIEVANCE_CELL' | 'NATIONAL_ANTI_RAGGING_HELPLINE' | 'VIGILANCE_WHISTLEBLOWER' | 'COURT_PETITION';
  complainantType: 'STUDENT' | 'FACULTY' | 'PARENT' | 'CITIZEN' | 'OFFICIAL_AUDITOR';
  complainantName?: string;
  complainantEmail?: string;
  complainantPhone?: string;
  isAnonymous?: boolean;
  evidenceFiles?: string[];
  severityLevel: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'TIME_SENSITIVE';
  severityScore: number;
  severityReason: string;
  severityRuleMatched: string;
  isSafetyUrgent: boolean;
  status: 'NEW' | 'UNDER_REVIEW' | 'INVESTIGATION_ORDERED' | 'SHOW_CAUSE_ISSUED' | 'HEARING_SCHEDULED' | 'ACTION_TAKEN' | 'CLOSED' | 'REOPENED';
  assignedOfficer: string;
  assignedOfficerEmail: string;
  priority: 'CRITICAL' | 'URGENT' | 'MEDIUM' | 'ROUTINE';
  deadlineDate: string;
  nextAction: string;
  linkedCaseIds: string[];
  resolutionNotes?: string;
  actions: CaseAction[];
  tags: string[];
  lastUpdated: string;
}

export interface CaseRelationshipSuggestion {
  id: string;
  sourceCaseId: string;
  sourceCaseNumber: string;
  sourceTitle: string;
  targetCaseId: string;
  targetCaseNumber: string;
  targetTitle: string;
  institutionId: string;
  institutionName: string;
  similarityScore: number;
  method: 'HYBRID_TFIDF_SEMANTIC' | 'DETERMINISTIC_METADATA_FALLBACK' | 'EXACT_PERMANENT_ID';
  matchingFactors: {
    matchedKeywords: string[];
    sharedPermanentId: boolean;
    sharedInstitution: boolean;
    categoryMatch: boolean;
    temporalProximityDays: number;
    explanation: string;
  };
  status: 'PENDING_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'DISMISSED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewReason?: string;
}

export interface CrossBureauConflictAlert {
  id: string;
  institutionId: string;
  institutionName: string;
  permanentId: string;
  caseIds: string[];
  caseNumbers: string[];
  bureausInvolved: {
    bureauId: string;
    bureauName: string;
    caseId: string;
    caseNumber: string;
    assignedOfficer: string;
    status: string;
  }[];
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  conflictType: string;
  summary: string;
  recommendedAction: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  detectedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityReference?: string;
  details: string;
  ipAddress: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'URGENT_SAFETY' | 'CONFLICT_DETECTED' | 'DEADLINE_APPROACHING' | 'MATCH_SUGGESTED' | 'SYSTEM';
  timestamp: string;
  read: boolean;
  linkTo?: string;
  entityId?: string;
}

export interface DashboardData {
  kpis: {
    totalCases: number;
    openCases: number;
    criticalCases: number;
    highPriorityCases: number;
    activeConflicts: number;
    pendingSuggestions: number;
    overdueCases: number;
    approachingDeadlineCases: number;
    totalInstitutions: number;
    highRiskInstitutions: number;
  };
  bureauWorkload: {
    bureauId: string;
    code: string;
    name: string;
    total: number;
    active: number;
    critical: number;
    resolved: number;
  }[];
  severityDistribution: { level: string; count: number; color: string }[];
  categoryDistribution: { category: string; count: number }[];
  regionalSummary: { region: string; caseCount: number }[];
  trends: { date: string; newCases: number; resolved: number }[];
  recentCases: ComplaintCase[];
}
