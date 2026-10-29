/**
 * AICTE Institution-Centric Case Intelligence
 * Authoritative In-Memory + Persistent Disk Store
 * Implements full CRUD, Audit Logging, and Seed Data
 */

import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'BUREAU_OFFICER' | 'BUREAU_OFFICER_AB' | 'BUREAU_OFFICER_PGC' | 'BUREAU_OFFICER_ARMC' | 'REVIEWER' | 'READONLY_MANAGEMENT' | 'CITIZEN';
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
  type: string; // University, Engineering College, Polytechnic, Management Institute
  establishedYear: number;
  approvedIntake: number;
  riskScore: number; // 0 to 100
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
  actionType: 'STATUS_CHANGE' | 'OFFICER_REASSIGN' | 'BUREAU_TRANSFER' | 'NOTE_ADDED' | 'DEADLINE_EXTENDED' | 'SEVERITY_OVERRIDDEN' | 'LINK_CONFIRMED' | 'CONFLICT_ACKNOWLEDGED' | 'CASE_CREATED';
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
  severityScore: number; // 0-100
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
  similarityScore: number; // 0.0 - 1.0
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
  conflictType: 'APPROVAL_VS_VIGILANCE_DISPUTE' | 'SIMULTANEOUS_INSPECTIONS' | 'CONTRADICTORY_HEARINGS' | 'DUPLICATE_SANCTION_RISK' | 'UNCOORDINATED_PENALTY';
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
  entityType: 'CASE' | 'RELATIONSHIP' | 'CONFLICT' | 'SEVERITY' | 'INSTITUTION' | 'USER' | 'SYSTEM';
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

// In-Memory Database Structure
interface AppDatabase {
  users: User[];
  bureaus: Bureau[];
  institutions: Institution[];
  cases: ComplaintCase[];
  suggestions: CaseRelationshipSuggestion[];
  conflicts: CrossBureauConflictAlert[];
  auditLogs: AuditLogEntry[];
  notifications: NotificationItem[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV);
const BUNDLED_DB_FILE = path.resolve(process.cwd(), '.data', 'aicte_store.json');
const DATA_DIR = isServerless ? path.resolve('/tmp', '.data') : path.resolve(process.cwd(), '.data');
const DB_FILE = path.resolve(DATA_DIR, 'aicte_store.json');

export const GL_BAJAJ_INSTITUTIONS: Institution[] = [
  {
    id: 'inst-glb-itm',
    permanentId: 'AICTE-1-4648711',
    name: 'G.L. Bajaj Institute of Technology and Management',
    state: 'Uttar Pradesh',
    city: 'Greater Noida',
    address: 'Plot No. 2, Knowledge Park III, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh 201306',
    type: 'Engineering & Technology Institute',
    establishedYear: 2005,
    approvedIntake: 1440,
    riskScore: 38,
    riskCategory: 'LOW',
    activeCasesCount: 1,
    totalComplaintsCount: 2,
    hasActiveConflict: false,
    naacGrade: 'A+',
    nbaAccredited: true,
  },
  {
    id: 'inst-glb-imr',
    permanentId: 'AICTE-1-1378121',
    name: 'G.L. Bajaj Institute of Management and Research (GLBIMR)',
    state: 'Uttar Pradesh',
    city: 'Greater Noida',
    address: 'Plot No. 2, Knowledge Park III, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh 201306',
    type: 'Management Institute (Autonomous PGDM & MBA)',
    establishedYear: 2007,
    approvedIntake: 300,
    riskScore: 24,
    riskCategory: 'LOW',
    activeCasesCount: 1,
    totalComplaintsCount: 1,
    hasActiveConflict: false,
    naacGrade: 'A',
    nbaAccredited: true,
  },
  {
    id: 'inst-glb-med',
    permanentId: 'AICTE-1-98721450',
    name: 'GL Bajaj Institute of Medical Sciences & Research',
    state: 'Uttar Pradesh',
    city: 'Mathura',
    address: 'National Highway 2 (NH-2), Akbarpur, Chhata, Mathura, Uttar Pradesh 281406',
    type: 'Medical Sciences & Clinical Research Institute',
    establishedYear: 2021,
    approvedIntake: 150,
    riskScore: 29,
    riskCategory: 'LOW',
    activeCasesCount: 1,
    totalComplaintsCount: 1,
    hasActiveConflict: false,
    naacGrade: 'A',
    nbaAccredited: false,
  },
  {
    id: 'inst-glb-law',
    permanentId: 'AICTE-1-76492015',
    name: 'GL Bajaj Institute of Law',
    state: 'Uttar Pradesh',
    city: 'Greater Noida',
    address: 'Plot No. 2, Knowledge Park III, Institutional Area, Greater Noida, Uttar Pradesh 201306',
    type: 'Law & Integrated Governance Institute',
    establishedYear: 2020,
    approvedIntake: 240,
    riskScore: 18,
    riskCategory: 'LOW',
    activeCasesCount: 0,
    totalComplaintsCount: 1,
    hasActiveConflict: false,
    naacGrade: 'B++',
    nbaAccredited: false,
  },
];

export const GL_BAJAJ_CASES: ComplaintCase[] = [
  {
    id: 'case-11',
    caseNumber: 'AICTE-2026-AB-0091',
    trackingToken: 'AICTE-GRV-2026-9102',
    title: 'Annual Extension of Approval (EoA) verification for 60-seat Artificial Intelligence & Data Science expansion',
    description: 'Scrutiny of EoA application for 2026-27 session requesting 60 additional seats in B.Tech Computer Science & Engineering (AI & ML / Data Science) specialization. High-performance GPU computing lab infrastructure and AICTE Faculty cadre ratio under verification.',
    institutionId: 'inst-glb-itm',
    institutionName: 'G.L. Bajaj Institute of Technology and Management',
    permanentId: 'AICTE-1-4648711',
    bureauId: 'bur-ab',
    bureauName: 'Approval Bureau',
    category: 'UNAPPROVED_PROGRAM',
    submissionDate: '2026-10-16T10:15:00Z',
    source: 'AICTE_PORTAL',
    complainantType: 'OFFICIAL_AUDITOR',
    severityLevel: 'NORMAL',
    severityScore: 36,
    severityReason: 'Routine EoA expansion audit requiring laboratory and faculty verification before sanction order.',
    severityRuleMatched: 'RULE-AB-01: Standard scrutiny for sanctioned intake expansion under APH Chapter II.',
    isSafetyUrgent: false,
    status: 'UNDER_REVIEW',
    assignedOfficer: 'Priya Ramanathan',
    assignedOfficerEmail: 'officer.ab@aicte-india.org',
    priority: 'MEDIUM',
    deadlineDate: '2026-11-08T18:00:00Z',
    nextAction: 'Review physical inspection report of high-performance GPU server lab from Northern Regional Office.',
    linkedCaseIds: [],
    actions: [
      {
        id: 'act-11-1',
        caseId: 'case-11',
        timestamp: '2026-10-16T10:15:00Z',
        actorName: 'Priya Ramanathan',
        actorRole: 'BUREAU_OFFICER',
        actionType: 'CASE_CREATED',
        description: 'Scrutiny dossier initiated for GLBITM AI & Data Science expansion.',
      },
    ],
    tags: ['GLBITM', 'Intake Expansion', 'AI/ML Lab', 'Greater Noida', 'AKTU'],
    lastUpdated: '2026-10-20T14:00:00Z',
  },
  {
    id: 'case-12',
    caseNumber: 'AICTE-2026-PGC-0128',
    trackingToken: 'AICTE-GRV-2026-9128',
    title: 'Student grievance regarding summer internship corporate stipend transparency and refund of security deposit',
    description: 'PGDM Batch 2025-27 student representation requesting clarification regarding corporate internship placement processing charges and prompt release of annual library security deposit upon course completion.',
    institutionId: 'inst-glb-imr',
    institutionName: 'G.L. Bajaj Institute of Management and Research (GLBIMR)',
    permanentId: 'AICTE-1-1378121',
    bureauId: 'bur-pgc',
    bureauName: 'Public Grievance Cell',
    category: 'FEE_EXTORTION',
    submissionDate: '2026-10-14T14:30:00Z',
    source: 'STUDENT_GRIEVANCE_CELL',
    complainantType: 'STUDENT',
    severityLevel: 'TIME_SENSITIVE',
    severityScore: 60,
    severityReason: 'Time-sensitive student grievance regarding institutional fee deposit returns and placement overhead policies.',
    severityRuleMatched: 'RULE-PGC-02: Mandatory admission caution and library deposit refund within 15 working days.',
    isSafetyUrgent: false,
    status: 'HEARING_SCHEDULED',
    assignedOfficer: 'Smt. Ananya Sen',
    assignedOfficerEmail: 'officer.pgc@aicte-india.org',
    priority: 'URGENT',
    deadlineDate: '2026-10-29T17:00:00Z',
    nextAction: 'Convene virtual mediation meeting with Dean of Student Affairs and Complainant.',
    linkedCaseIds: [],
    actions: [
      {
        id: 'act-12-1',
        caseId: 'case-12',
        timestamp: '2026-10-14T14:30:00Z',
        actorName: 'System Gateway',
        actorRole: 'SYSTEM',
        actionType: 'CASE_CREATED',
        description: 'Grievance submitted via Student Grievance Portal.',
      },
      {
        id: 'act-12-2',
        caseId: 'case-12',
        timestamp: '2026-10-18T11:00:00Z',
        actorName: 'Smt. Ananya Sen',
        actorRole: 'BUREAU_OFFICER',
        actionType: 'STATUS_CHANGE',
        description: 'Scheduled conciliation session with GLBIMR administration.',
        previousValue: 'UNDER_REVIEW',
        newValue: 'HEARING_SCHEDULED',
      },
    ],
    tags: ['GLBIMR', 'PGDM', 'Security Deposit', 'Fee Policy', 'Greater Noida'],
    lastUpdated: '2026-10-21T15:20:00Z',
  },
  {
    id: 'case-13',
    caseNumber: 'AICTE-2026-ARMC-0034',
    trackingToken: 'AICTE-GRV-2026-9145',
    title: 'Preventive anti-ragging squad surprise hostel audit and senior-junior interaction verification',
    description: 'Proactive compliance audit of newly commissioned residential student hostel blocks at Mathura campus. Verification of 24/7 CCTV surveillance, biometric access gates, and display of National Anti-Ragging Helpline toll-free posters in all common rooms.',
    institutionId: 'inst-glb-med',
    institutionName: 'GL Bajaj Institute of Medical Sciences & Research',
    permanentId: 'AICTE-1-98721450',
    bureauId: 'bur-armc',
    bureauName: 'Anti-Ragging Monitoring Cell',
    category: 'SAFETY_RAGGING',
    submissionDate: '2026-10-11T09:00:00Z',
    source: 'NATIONAL_ANTI_RAGGING_HELPLINE',
    complainantType: 'OFFICIAL_AUDITOR',
    severityLevel: 'NORMAL',
    severityScore: 38,
    severityReason: 'Routine preventive inspection; no active physical harassment reported.',
    severityRuleMatched: 'RULE-ARMC-03: Mandatory pre-semester campus and hostel safety audit.',
    isSafetyUrgent: false,
    status: 'ACTION_TAKEN',
    assignedOfficer: 'Prof. M. K. Narang',
    assignedOfficerEmail: 'narang.armc@aicte-india.org',
    priority: 'ROUTINE',
    deadlineDate: '2026-10-31T18:00:00Z',
    nextAction: 'Archived inspection certificate; hostel premises found fully compliant with biometric gate logs.',
    linkedCaseIds: [],
    resolutionNotes: 'Inspection squad confirmed CCTV operational and Anti-Ragging Committee constituted with external civil society members.',
    actions: [
      {
        id: 'act-13-1',
        caseId: 'case-13',
        timestamp: '2026-10-11T09:00:00Z',
        actorName: 'Prof. M. K. Narang',
        actorRole: 'BUREAU_OFFICER',
        actionType: 'CASE_CREATED',
        description: 'Routine hostel inspection docket initiated.',
      },
      {
        id: 'act-13-2',
        caseId: 'case-13',
        timestamp: '2026-10-19T16:00:00Z',
        actorName: 'Prof. M. K. Narang',
        actorRole: 'BUREAU_OFFICER',
        actionType: 'STATUS_CHANGE',
        description: 'Inspection satisfactory. Action recorded.',
        previousValue: 'UNDER_REVIEW',
        newValue: 'ACTION_TAKEN',
      },
    ],
    tags: ['GL Bajaj Medical', 'Mathura Campus', 'Anti-Ragging Squad', 'Hostel Audit'],
    lastUpdated: '2026-10-19T16:15:00Z',
  },
  {
    id: 'case-14',
    caseNumber: 'AICTE-2026-PGC-0135',
    trackingToken: 'AICTE-GRV-2026-9150',
    title: 'Moot Court infrastructure and e-library legal database subscription enhancement request',
    description: 'Student bar council petition requesting expanded access to SCC Online and Manupatra databases across academic terminals. College administration procured institutional enterprise multi-user license.',
    institutionId: 'inst-glb-law',
    institutionName: 'GL Bajaj Institute of Law',
    permanentId: 'AICTE-1-76492015',
    bureauId: 'bur-pgc',
    bureauName: 'Public Grievance Cell',
    category: 'INFRASTRUCTURE_DEFICIT',
    submissionDate: '2026-10-04T12:00:00Z',
    source: 'STUDENT_GRIEVANCE_CELL',
    complainantType: 'STUDENT',
    severityLevel: 'NORMAL',
    severityScore: 22,
    severityReason: 'Academic library resource query resolved cordially by institution.',
    severityRuleMatched: 'RULE-PGC-01: Standard student academic infrastructure petition.',
    isSafetyUrgent: false,
    status: 'CLOSED',
    assignedOfficer: 'Smt. Ananya Sen',
    assignedOfficerEmail: 'officer.pgc@aicte-india.org',
    priority: 'ROUTINE',
    deadlineDate: '2026-10-25T17:00:00Z',
    nextAction: 'Closed upon receipt of enterprise legal software license purchase invoice.',
    linkedCaseIds: [],
    resolutionNotes: 'College administration submitted proof of 100-seat multi-user remote VPN access for legal databases; closed satisfactorily.',
    actions: [
      {
        id: 'act-14-1',
        caseId: 'case-14',
        timestamp: '2026-10-04T12:00:00Z',
        actorName: 'System Gateway',
        actorRole: 'SYSTEM',
        actionType: 'CASE_CREATED',
        description: 'Student petition registered.',
      },
      {
        id: 'act-14-2',
        caseId: 'case-14',
        timestamp: '2026-10-15T10:30:00Z',
        actorName: 'Smt. Ananya Sen',
        actorRole: 'BUREAU_OFFICER',
        actionType: 'STATUS_CHANGE',
        description: 'Verified compliance and closed grievance.',
        previousValue: 'UNDER_REVIEW',
        newValue: 'CLOSED',
      },
    ],
    tags: ['GL Bajaj Law', 'Library Resources', 'Moot Court', 'Greater Noida'],
    lastUpdated: '2026-10-15T11:00:00Z',
  },
];

class DataStore {
  private db: AppDatabase;

  constructor() {
    this.ensureDataDir();
    this.db = this.loadOrSeed();
  }

  private ensureDataDir() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
    } catch (e) {
      // In-memory fallback
    }
  }

  private saveToDisk() {
    try {
      this.ensureDataDir();
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      // Silently continue if disk write is disallowed in serverless
    }
  }

  private loadOrSeed(): AppDatabase {
    let fileToLoad: string | null = null;
    try {
      if (fs.existsSync(DB_FILE)) {
        fileToLoad = DB_FILE;
      } else if (fs.existsSync(BUNDLED_DB_FILE)) {
        fileToLoad = BUNDLED_DB_FILE;
      }
    } catch (e) {
      fileToLoad = null;
    }

    if (fileToLoad) {
      try {
        const raw = fs.readFileSync(fileToLoad, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.cases && parsed.institutions && parsed.users) {
          // Ensure trackingToken on all cases
          parsed.cases.forEach((c: any, idx: number) => {
            if (!c.trackingToken) c.trackingToken = `AICTE-GRV-2026-${1000 + idx}`;
          });
          // Ensure all 3 distinct bureau officers exist
          const expectedBureauOfficers: User[] = [
            {
              id: 'usr-officer-ab',
              name: 'Priya Ramanathan',
              email: 'officer.ab@aicte-india.org',
              role: 'BUREAU_OFFICER_AB',
              bureauId: 'bur-ab',
              bureauName: 'Approval Bureau',
              designation: 'Senior Approval Officer — Approval Bureau (APH & Intake Norms)',
            },
            {
              id: 'usr-officer-pgc',
              name: 'Smt. Ananya Sen',
              email: 'officer.pgc@aicte-india.org',
              role: 'BUREAU_OFFICER_PGC',
              bureauId: 'bur-pgc',
              bureauName: 'Public Grievance Cell',
              designation: 'Chief Grievance Officer — Public Grievance Cell (Fees, Marksheets & SGRC)',
            },
            {
              id: 'usr-officer-armc',
              name: 'Shri Vikram Malhotra',
              email: 'officer.armc@aicte-india.org',
              role: 'BUREAU_OFFICER_ARMC',
              bureauId: 'bur-armc',
              bureauName: 'Anti-Ragging & Vigilance Bureau',
              designation: 'Enforcement Director — Anti-Ragging & Vigilance Squad (Safety & FIRs)',
            },
          ];

          expectedBureauOfficers.forEach(bo => {
            const existingIdx = parsed.users.findIndex((u: any) => u.id === bo.id || u.email === bo.email);
            if (existingIdx >= 0) {
              parsed.users[existingIdx] = bo;
            } else {
              parsed.users.push(bo);
            }
          });

          let dirty = false;

          // Ensure citizen user exists
          if (!parsed.users.some((u: any) => u.role === 'CITIZEN')) {
            parsed.users.push({
              id: 'usr-citizen-1',
              name: 'Aarav Sharma',
              email: 'student.aarav@aicte-student.org',
              role: 'CITIZEN',
              designation: 'Enrolled B.Tech Student (Complainant / Citizen)',
            });
            dirty = true;
          }

          const reviewerUser = parsed.users.find((u: any) => u.id === 'usr-reviewer-1' || u.role === 'REVIEWER');
          if (reviewerUser && reviewerUser.bureauId !== 'bur-ombudsman') {
            reviewerUser.bureauId = 'bur-ombudsman';
            reviewerUser.bureauName = 'AI Intelligence & Ombudsman Docket';
            dirty = true;
          }

          // Ensure GL Bajaj institutions and cases exist
          GL_BAJAJ_INSTITUTIONS.forEach(gi => {
            if (!parsed.institutions.some((i: any) => i.id === gi.id || i.permanentId === gi.permanentId)) {
              parsed.institutions.push(gi);
              dirty = true;
            }
          });

          GL_BAJAJ_CASES.forEach(gc => {
            if (!parsed.cases.some((c: any) => c.id === gc.id || c.caseNumber === gc.caseNumber)) {
              parsed.cases.push(gc);
              dirty = true;
            }
          });

          if (dirty) {
            try {
              fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
            } catch (e) {
              console.warn('Could not sync merged data to disk:', e);
            }
          }

          return parsed;
        }
      } catch (e) {
        console.error('Error reading saved database, regenerating seed data', e);
      }
    }
    const seed = this.generateSeedData();
    this.db = seed;
    this.saveToDisk();
    return seed;
  }

  public resetToSeed(): AppDatabase {
    this.db = this.generateSeedData();
    this.saveToDisk();
    return this.db;
  }

  private generateSeedData(): AppDatabase {
    const users: User[] = [
      {
        id: 'usr-admin-1',
        name: 'Dr. Arvind Sharma',
        email: 'admin@aicte-india.org',
        role: 'ADMIN',
        designation: 'Advisor & Chief Regulatory Officer, AICTE HQ',
      },
      {
        id: 'usr-officer-ab',
        name: 'Priya Ramanathan',
        email: 'officer.ab@aicte-india.org',
        role: 'BUREAU_OFFICER_AB',
        bureauId: 'bur-ab',
        bureauName: 'Approval Bureau',
        designation: 'Senior Approval Officer — Approval Bureau (APH & Intake Norms)',
      },
      {
        id: 'usr-officer-pgc',
        name: 'Smt. Ananya Sen',
        email: 'officer.pgc@aicte-india.org',
        role: 'BUREAU_OFFICER_PGC',
        bureauId: 'bur-pgc',
        bureauName: 'Public Grievance Cell',
        designation: 'Chief Grievance Officer — Public Grievance Cell (Fees, Marksheets & SGRC)',
      },
      {
        id: 'usr-officer-armc',
        name: 'Shri Vikram Malhotra',
        email: 'officer.armc@aicte-india.org',
        role: 'BUREAU_OFFICER_ARMC',
        bureauId: 'bur-armc',
        bureauName: 'Anti-Ragging & Vigilance Bureau',
        designation: 'Enforcement Director — Anti-Ragging & Vigilance Squad (Safety & FIRs)',
      },
      {
        id: 'usr-reviewer-1',
        name: 'Rajesh Deshmukh',
        email: 'reviewer@aicte-india.org',
        role: 'REVIEWER',
        bureauId: 'bur-ombudsman',
        bureauName: 'AI Intelligence & Ombudsman Docket',
        designation: 'Lead Intelligence Reviewer & Ombudsman',
      },
      {
        id: 'usr-mgmt-1',
        name: 'Sunita Verma',
        email: 'management@aicte-india.org',
        role: 'READONLY_MANAGEMENT',
        designation: 'Member Secretary & Executive Board Observer',
      },
      {
        id: 'usr-citizen-1',
        name: 'Aarav Sharma',
        email: 'student.aarav@aicte-student.org',
        role: 'CITIZEN',
        designation: 'Enrolled B.Tech Student (Complainant / Citizen)',
      },
    ];

    const bureaus: Bureau[] = [
      {
        id: 'bur-ab',
        code: 'AB',
        name: 'Approval Bureau',
        description: 'Sanctions, extension of approval (EoA), intake capacity, and program accreditation compliance.',
        headOfficer: 'Dr. R. K. Soni',
        activeCasesCount: 4,
      },
      {
        id: 'bur-pgc',
        code: 'PGC',
        name: 'Public Grievance Cell',
        description: 'Student fees, certificates retention, faculty salaries, and campus infrastructure complaints.',
        headOfficer: 'Smt. Ananya Sen',
        activeCasesCount: 5,
      },
      {
        id: 'bur-armc',
        code: 'ARMC',
        name: 'Anti-Ragging Monitoring Cell',
        description: 'Urgent student safety, ragging allegations, harassment investigations, and immediate safety enforcement.',
        headOfficer: 'Prof. M. K. Narang',
        activeCasesCount: 2,
      },
      {
        id: 'bur-vig',
        code: 'VIB',
        name: 'Vigilance & Inspection Bureau',
        description: 'Ghost faculty detection, forged building safety certificates, fraudulent land titles, and financial fraud.',
        headOfficer: 'Shri Vikram Malhotra',
        activeCasesCount: 3,
      },
      {
        id: 'bur-lac',
        code: 'LAC',
        name: 'Legal & Arbitration Cell',
        description: 'High Court petitions, show-cause appeals, statutory arbitration, and compliance stays.',
        headOfficer: 'Adv. Neha Kulkarni',
        activeCasesCount: 2,
      },
    ];

    const institutions: Institution[] = [
      {
        id: 'inst-1',
        permanentId: 'AICTE-1-49281729',
        name: 'Apex Institute of Advanced Technology & Research',
        state: 'Maharashtra',
        city: 'Pune',
        address: 'Sector 24, Hinjawadi Knowledge Park, Pune 411057',
        type: 'Engineering College',
        establishedYear: 2008,
        approvedIntake: 720,
        riskScore: 89,
        riskCategory: 'CRITICAL',
        activeCasesCount: 3,
        totalComplaintsCount: 7,
        hasActiveConflict: true,
        naacGrade: 'B+',
        nbaAccredited: false,
      },
      {
        id: 'inst-2',
        permanentId: 'AICTE-1-78291044',
        name: 'St. Jude Institute of Engineering & Technology',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: 'Whitefield Main Road, Kadugodi, Bengaluru 560067',
        type: 'Engineering College',
        establishedYear: 2012,
        approvedIntake: 600,
        riskScore: 74,
        riskCategory: 'HIGH',
        activeCasesCount: 2,
        totalComplaintsCount: 4,
        hasActiveConflict: true,
        naacGrade: 'A',
        nbaAccredited: true,
      },
      {
        id: 'inst-3',
        permanentId: 'AICTE-1-33918270',
        name: 'National Capital Polytechnic & Skill Institute',
        state: 'Delhi-NCR',
        city: 'Greater Noida',
        address: 'Knowledge Park III, Institutional Area, Greater Noida 201306',
        type: 'Polytechnic',
        establishedYear: 2015,
        approvedIntake: 420,
        riskScore: 61,
        riskCategory: 'HIGH',
        activeCasesCount: 2,
        totalComplaintsCount: 5,
        hasActiveConflict: false,
        naacGrade: 'B',
        nbaAccredited: false,
      },
      {
        id: 'inst-4',
        permanentId: 'AICTE-1-88401923',
        name: 'Kalinga Institute of Maritime & Aviation Technology',
        state: 'Odisha',
        city: 'Bhubaneswar',
        address: 'Chandaka Industrial Estate, Infocity, Bhubaneswar 751024',
        type: 'Autonomous Technical Institute',
        establishedYear: 2010,
        approvedIntake: 360,
        riskScore: 42,
        riskCategory: 'MODERATE',
        activeCasesCount: 1,
        totalComplaintsCount: 3,
        hasActiveConflict: false,
        naacGrade: 'A+',
        nbaAccredited: true,
      },
      {
        id: 'inst-5',
        permanentId: 'AICTE-1-12093847',
        name: 'Vanguard College of Pharmacy & Clinical Sciences',
        state: 'Uttar Pradesh',
        city: 'Lucknow',
        address: 'Faizabad Road, Chinhat Knowledge Enclave, Lucknow 226028',
        type: 'Pharmacy College',
        establishedYear: 2017,
        approvedIntake: 240,
        riskScore: 35,
        riskCategory: 'LOW',
        activeCasesCount: 1,
        totalComplaintsCount: 2,
        hasActiveConflict: false,
        naacGrade: 'A',
        nbaAccredited: true,
      },
      {
        id: 'inst-6',
        permanentId: 'AICTE-1-55029381',
        name: 'Deccan Academy of Science & Management Studies',
        state: 'Telangana',
        city: 'Hyderabad',
        address: 'Gachibowli Financial District, Hyderabad 500032',
        type: 'Management Institute',
        establishedYear: 2004,
        approvedIntake: 300,
        riskScore: 28,
        riskCategory: 'LOW',
        activeCasesCount: 1,
        totalComplaintsCount: 2,
        hasActiveConflict: false,
        naacGrade: 'A++',
        nbaAccredited: true,
      },
      ...GL_BAJAJ_INSTITUTIONS,
    ];

    const cases: ComplaintCase[] = [
      {
        id: 'case-01',
        caseNumber: 'AICTE-2026-ARMC-0012',
        title: 'Severe physical ragging and intimidation in Hostel Block 4',
        description: 'First-year B.Tech students subjected to nighttime hazing, physical threats, and forced physical tasks by senior batches. College anti-ragging squad failed to take action despite formal written complaint to Chief Proctor.',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        permanentId: 'AICTE-1-49281729',
        bureauId: 'bur-armc',
        bureauName: 'Anti-Ragging Monitoring Cell',
        category: 'SAFETY_RAGGING',
        submissionDate: '2026-10-18T09:30:00Z',
        source: 'NATIONAL_ANTI_RAGGING_HELPLINE',
        complainantType: 'STUDENT',
        severityLevel: 'CRITICAL',
        severityScore: 98,
        severityReason: 'Direct allegation of physical violence, senior batch intimidation, and institutional cover-up triggering statutory mandatory intervention.',
        severityRuleMatched: 'RULE-ARMC-01: Direct physical hazing / safety compromise requires immediate show-cause and police liaison within 24h.',
        isSafetyUrgent: true,
        status: 'INVESTIGATION_ORDERED',
        assignedOfficer: 'Prof. M. K. Narang',
        assignedOfficerEmail: 'narang.armc@aicte-india.org',
        priority: 'CRITICAL',
        deadlineDate: '2026-10-24T18:00:00Z',
        nextAction: 'Liaise with District Magistrate and conduct surprise evening hostel inspection with local police nodal officer.',
        linkedCaseIds: ['case-02', 'case-03'],
        actions: [
          {
            id: 'act-01-1',
            caseId: 'case-01',
            timestamp: '2026-10-18T09:30:00Z',
            actorName: 'System Gateway',
            actorRole: 'SYSTEM',
            actionType: 'CASE_CREATED',
            description: 'Intake from National Anti-Ragging Helpline ref #NARH-MH-2026-8819.',
          },
          {
            id: 'act-01-2',
            caseId: 'case-01',
            timestamp: '2026-10-18T10:15:00Z',
            actorName: 'AI Risk Engine',
            actorRole: 'SYSTEM',
            actionType: 'SEVERITY_OVERRIDDEN',
            description: 'Automated triage flagged severity as CRITICAL (score 98) due to violent hazing indicators.',
            newValue: 'CRITICAL',
          },
          {
            id: 'act-01-3',
            caseId: 'case-01',
            timestamp: '2026-10-19T11:00:00Z',
            actorName: 'Prof. M. K. Narang',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Ordered formal inquiry team dispatch and sent emergency advisory notice to Institute Chairman.',
            previousValue: 'NEW',
            newValue: 'INVESTIGATION_ORDERED',
          },
        ],
        tags: ['Ragging', 'Hostel Safety', 'Student Welfare', 'Pune', 'Police Liaison'],
        lastUpdated: '2026-10-21T14:20:00Z',
      },
      {
        id: 'case-02',
        caseNumber: 'AICTE-2026-AB-0045',
        title: 'Unauthorized 120-seat MCA section and ghost faculty roster submitted for EoA',
        description: 'Institute has admitted 120 students in an unsanctioned Master of Computer Applications (MCA) division not listed in current AICTE Approval Handbook. Furthermore, 8 faculty profiles submitted for Approval Renewal are non-resident ghost faculty.',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        permanentId: 'AICTE-1-49281729',
        bureauId: 'bur-ab',
        bureauName: 'Approval Bureau',
        category: 'UNAPPROVED_PROGRAM',
        submissionDate: '2026-10-14T11:00:00Z',
        source: 'AICTE_PORTAL',
        complainantType: 'FACULTY',
        severityLevel: 'HIGH',
        severityScore: 84,
        severityReason: 'Unapproved program enrollment places student academic degrees in legal jeopardy; ghost faculty compromises mandatory teacher-student ratio.',
        severityRuleMatched: 'RULE-AB-04: Fraudulent faculty roster and excess unapproved admissions trigger freezing of EoA pending expert committee.',
        isSafetyUrgent: false,
        status: 'SHOW_CAUSE_ISSUED',
        assignedOfficer: 'Priya Ramanathan',
        assignedOfficerEmail: 'officer.ab@aicte-india.org',
        priority: 'URGENT',
        deadlineDate: '2026-10-25T17:00:00Z',
        nextAction: 'Review formal reply to Show-Cause Notice sent on 16th Oct regarding unsanctioned MCA intake and verify biometric Aadhaar logs.',
        linkedCaseIds: ['case-01', 'case-03'],
        actions: [
          {
            id: 'act-02-1',
            caseId: 'case-02',
            timestamp: '2026-10-14T11:00:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Registered upon receipt of whistle-blowing faculty affidavit with roster comparison.',
          },
          {
            id: 'act-02-2',
            caseId: 'case-02',
            timestamp: '2026-10-16T15:30:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Issued formal show cause notice giving institute 7 working days to furnish biometric records.',
            previousValue: 'UNDER_REVIEW',
            newValue: 'SHOW_CAUSE_ISSUED',
          },
        ],
        tags: ['Approval Violation', 'Unapproved Intake', 'Ghost Faculty', 'Pune'],
        lastUpdated: '2026-10-20T16:00:00Z',
      },
      {
        id: 'case-03',
        caseNumber: 'AICTE-2026-VIB-0019',
        title: 'Suspected forged municipal building safety & fire NOC certificates',
        description: 'Vigilance investigation into submitted documents for structural stability certificate and Municipal Corporation Fire NOC indicates fabricated registration stamps and signatures.',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        permanentId: 'AICTE-1-49281729',
        bureauId: 'bur-vig',
        bureauName: 'Vigilance & Inspection Bureau',
        category: 'FACULTY_FRAUD',
        submissionDate: '2026-10-19T14:10:00Z',
        source: 'VIGILANCE_WHISTLEBLOWER',
        complainantType: 'OFFICIAL_AUDITOR',
        severityLevel: 'CRITICAL',
        severityScore: 92,
        severityReason: 'Compromised fire safety certificates in high-density multi-story engineering campus represents immense life safety hazard.',
        severityRuleMatched: 'RULE-VIB-02: Forged statutory safety compliance requires immediate cross-verification with municipal commissioner.',
        isSafetyUrgent: true,
        status: 'UNDER_REVIEW',
        assignedOfficer: 'Shri Vikram Malhotra',
        assignedOfficerEmail: 'malhotra.vig@aicte-india.org',
        priority: 'CRITICAL',
        deadlineDate: '2026-10-23T23:59:00Z',
        nextAction: 'Dispatch certified letter to Pune Municipal Fire Department for physical verification of dispatch register.',
        linkedCaseIds: ['case-01', 'case-02'],
        actions: [
          {
            id: 'act-03-1',
            caseId: 'case-03',
            timestamp: '2026-10-19T14:10:00Z',
            actorName: 'Shri Vikram Malhotra',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Logged vigilance case based on anonymous audit tip with scanned stamp discrepancies.',
          },
        ],
        tags: ['Fire NOC', 'Document Forgery', 'Campus Safety', 'Vigilance', 'Pune'],
        lastUpdated: '2026-10-22T10:45:00Z',
      },
      {
        id: 'case-04',
        caseNumber: 'AICTE-2026-PGC-0089',
        title: 'Illegal capitation fee exaction and refusal to return original class 12 marksheets',
        description: 'Management demanding ₹1.5 Lakhs unreceipted infrastructure development fee prior to issuing hall tickets; retaining original educational documents contrary to AICTE Gazette Notification.',
        institutionId: 'inst-2',
        institutionName: 'St. Jude Institute of Engineering & Technology',
        permanentId: 'AICTE-1-78291044',
        bureauId: 'bur-pgc',
        bureauName: 'Public Grievance Cell',
        category: 'FEE_EXTORTION',
        submissionDate: '2026-10-09T08:15:00Z',
        source: 'STUDENT_GRIEVANCE_CELL',
        complainantType: 'STUDENT',
        severityLevel: 'HIGH',
        severityScore: 78,
        severityReason: 'Withholding marksheet documents directly prohibits student from applying for internships or competitive tests.',
        severityRuleMatched: 'RULE-PGC-03: Original document retention constitutes strict regulatory violation under Section 10.',
        isSafetyUrgent: false,
        status: 'HEARING_SCHEDULED',
        assignedOfficer: 'Smt. Ananya Sen',
        assignedOfficerEmail: 'ananya.pgc@aicte-india.org',
        priority: 'URGENT',
        deadlineDate: '2026-10-27T12:00:00Z',
        nextAction: 'Convene virtual grievance hearing between Student Council Representative and Principal on 27th Oct.',
        linkedCaseIds: ['case-05'],
        actions: [
          {
            id: 'act-04-1',
            caseId: 'case-04',
            timestamp: '2026-10-09T08:15:00Z',
            actorName: 'System Gateway',
            actorRole: 'SYSTEM',
            actionType: 'CASE_CREATED',
            description: 'Complaint submitted by parent association.',
          },
          {
            id: 'act-04-2',
            caseId: 'case-04',
            timestamp: '2026-10-15T14:00:00Z',
            actorName: 'Smt. Ananya Sen',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Summoned institution for conciliation hearing.',
            previousValue: 'UNDER_REVIEW',
            newValue: 'HEARING_SCHEDULED',
          },
        ],
        tags: ['Fee Extortion', 'Document Retention', 'Grievance', 'Bengaluru'],
        lastUpdated: '2026-10-19T18:00:00Z',
      },
      {
        id: 'case-05',
        caseNumber: 'AICTE-2026-LAC-0031',
        title: 'High Court writ petition filed by institute contesting fee ceiling regulation',
        description: 'Institute has obtained an interim status quo order from Karnataka High Court in WP No. 29104/2026 against AICTE state fee regulatory committee recommendations.',
        institutionId: 'inst-2',
        institutionName: 'St. Jude Institute of Engineering & Technology',
        permanentId: 'AICTE-1-78291044',
        bureauId: 'bur-lac',
        bureauName: 'Legal & Arbitration Cell',
        category: 'GOVERNANCE_DISPUTE',
        submissionDate: '2026-10-11T16:20:00Z',
        source: 'COURT_PETITION',
        complainantType: 'CITIZEN',
        severityLevel: 'TIME_SENSITIVE',
        severityScore: 72,
        severityReason: 'Legal stay impinges on parallel PGC hearings regarding student refund demands; requires coordinated counsel response.',
        severityRuleMatched: 'RULE-LAC-01: Ongoing litigation with interim order requires immediate alert to parallel grievance cells.',
        isSafetyUrgent: false,
        status: 'UNDER_REVIEW',
        assignedOfficer: 'Adv. Neha Kulkarni',
        assignedOfficerEmail: 'neha.lac@aicte-india.org',
        priority: 'MEDIUM',
        deadlineDate: '2026-10-28T17:00:00Z',
        nextAction: 'File statement of objections clarifying that document withholding is independent of fee slab litigation.',
        linkedCaseIds: ['case-04'],
        actions: [
          {
            id: 'act-05-1',
            caseId: 'case-05',
            timestamp: '2026-10-11T16:20:00Z',
            actorName: 'Adv. Neha Kulkarni',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Petition papers served by Standing Counsel.',
          },
        ],
        tags: ['Court Stay', 'Fee Slab', 'Legal', 'Bengaluru'],
        lastUpdated: '2026-10-21T11:30:00Z',
      },
      {
        id: 'case-06',
        caseNumber: 'AICTE-2026-PGC-0094',
        title: 'Non-payment of faculty salaries for 5 months and EPF deduction non-remittance',
        description: '18 polytechnic instructors have not received monthly salary since May 2026 despite regular classes. Monthly salary slips show EPF deductions that were never deposited with EPFO portal.',
        institutionId: 'inst-3',
        institutionName: 'National Capital Polytechnic & Skill Institute',
        permanentId: 'AICTE-1-33918270',
        bureauId: 'bur-pgc',
        bureauName: 'Public Grievance Cell',
        category: 'FACULTY_FRAUD',
        submissionDate: '2026-10-02T10:00:00Z',
        source: 'AICTE_PORTAL',
        complainantType: 'FACULTY',
        severityLevel: 'HIGH',
        severityScore: 82,
        severityReason: 'Severe economic duress on teaching faculty threatens pedagogical continuity and violates mandatory service conditions.',
        severityRuleMatched: 'RULE-PGC-05: Non-payment of salaries beyond 90 days triggers punitive audit of institute bank accounts.',
        isSafetyUrgent: false,
        status: 'SHOW_CAUSE_ISSUED',
        assignedOfficer: 'Smt. Ananya Sen',
        assignedOfficerEmail: 'ananya.pgc@aicte-india.org',
        priority: 'URGENT',
        deadlineDate: '2026-10-22T17:00:00Z', // Overdue or at risk!
        nextAction: 'Escalate to Regional Officer for freezing of security deposit bank guarantee.',
        linkedCaseIds: ['case-07'],
        actions: [
          {
            id: 'act-06-1',
            caseId: 'case-06',
            timestamp: '2026-10-02T10:00:00Z',
            actorName: 'Smt. Ananya Sen',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Joint petition received from Faculty Welfare Association.',
          },
          {
            id: 'act-06-2',
            caseId: 'case-06',
            timestamp: '2026-10-08T12:00:00Z',
            actorName: 'Smt. Ananya Sen',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Issued Show Cause notice. Deadline lapsed without compliance.',
            previousValue: 'UNDER_REVIEW',
            newValue: 'SHOW_CAUSE_ISSUED',
          },
        ],
        tags: ['Faculty Salary', 'EPF Default', 'Greater Noida'],
        lastUpdated: '2026-10-22T09:00:00Z',
      },
      {
        id: 'case-07',
        caseNumber: 'AICTE-2026-AB-0051',
        title: 'Deficient laboratory equipment in Mechatronics and Electrical Workshop',
        description: 'Random inspection report indicates 60% of basic oscilloscope and lathe equipment non-operational. Deficit violates minimum laboratory norms specified for Diploma engineering.',
        institutionId: 'inst-3',
        institutionName: 'National Capital Polytechnic & Skill Institute',
        permanentId: 'AICTE-1-33918270',
        bureauId: 'bur-ab',
        bureauName: 'Approval Bureau',
        category: 'INFRASTRUCTURE_DEFICIT',
        submissionDate: '2026-10-05T13:45:00Z',
        source: 'AICTE_PORTAL',
        complainantType: 'STUDENT',
        severityLevel: 'NORMAL',
        severityScore: 58,
        severityReason: 'Deficient lab setup impacts practical curriculum; requires rectification before next semester exam cycle.',
        severityRuleMatched: 'RULE-AB-02: Infrastructure deficit allows 30-day compliance window before reduction in intake.',
        isSafetyUrgent: false,
        status: 'UNDER_REVIEW',
        assignedOfficer: 'Priya Ramanathan',
        assignedOfficerEmail: 'officer.ab@aicte-india.org',
        priority: 'MEDIUM',
        deadlineDate: '2026-11-05T17:00:00Z',
        nextAction: 'Schedule surprise re-inspection of electrical workshops on 10th Nov.',
        linkedCaseIds: ['case-06'],
        actions: [
          {
            id: 'act-07-1',
            caseId: 'case-07',
            timestamp: '2026-10-05T13:45:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Registered following student complaint with photos.',
          },
        ],
        tags: ['Lab Deficiency', 'Infrastructure', 'Polytechnic'],
        lastUpdated: '2026-10-18T14:15:00Z',
      },
      {
        id: 'case-08',
        caseNumber: 'AICTE-2026-AB-0062',
        title: 'Application for 25% intake expansion while flight simulator certification pending',
        description: 'Institute has applied for EoA with additional 60 seats in B.Tech Aeronautical Engineering despite DGCA grounded status on primary simulator facility.',
        institutionId: 'inst-4',
        institutionName: 'Kalinga Institute of Maritime & Aviation Technology',
        permanentId: 'AICTE-1-88401923',
        bureauId: 'bur-ab',
        bureauName: 'Approval Bureau',
        category: 'UNAPPROVED_PROGRAM',
        submissionDate: '2026-10-12T15:00:00Z',
        source: 'AICTE_PORTAL',
        complainantType: 'OFFICIAL_AUDITOR',
        severityLevel: 'NORMAL',
        severityScore: 52,
        severityReason: 'Expansion request premature until inter-agency DGCA clearance is validated.',
        severityRuleMatched: 'RULE-AB-06: Aviation curricula require dual AICTE-DGCA concurrence before seat expansion.',
        isSafetyUrgent: false,
        status: 'UNDER_REVIEW',
        assignedOfficer: 'Priya Ramanathan',
        assignedOfficerEmail: 'officer.ab@aicte-india.org',
        priority: 'MEDIUM',
        deadlineDate: '2026-11-02T18:00:00Z',
        nextAction: 'Await official verification letter from Director General of Civil Aviation.',
        linkedCaseIds: [],
        actions: [
          {
            id: 'act-08-1',
            caseId: 'case-08',
            timestamp: '2026-10-12T15:00:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Scrutiny of annual EoA application documents.',
          },
        ],
        tags: ['Aviation', 'Intake Expansion', 'DGCA Clearance', 'Bhubaneswar'],
        lastUpdated: '2026-10-15T12:00:00Z',
      },
      {
        id: 'case-09',
        caseNumber: 'AICTE-2026-PGC-0105',
        title: 'Non-refund of admission caution deposit to withdrawn candidate within statutory 15 days',
        description: 'Candidate surrendered seat prior to the national counseling mop-up round cutoff. Institute has deducted ₹45,000 arbitrarily and delayed balance refund beyond the mandatory 15 days.',
        institutionId: 'inst-5',
        institutionName: 'Vanguard College of Pharmacy & Clinical Sciences',
        permanentId: 'AICTE-1-12093847',
        bureauId: 'bur-pgc',
        bureauName: 'Public Grievance Cell',
        category: 'FEE_EXTORTION',
        submissionDate: '2026-10-17T11:20:00Z',
        source: 'STUDENT_GRIEVANCE_CELL',
        complainantType: 'PARENT',
        severityLevel: 'TIME_SENSITIVE',
        severityScore: 65,
        severityReason: 'Fee refund guidelines mandate full refund with at most ₹1,000 processing fee when vacated before cutoff.',
        severityRuleMatched: 'RULE-PGC-02: Mandatory admission cancellation refund within 15 working days.',
        isSafetyUrgent: false,
        status: 'ACTION_TAKEN',
        assignedOfficer: 'Smt. Ananya Sen',
        assignedOfficerEmail: 'ananya.pgc@aicte-india.org',
        priority: 'MEDIUM',
        deadlineDate: '2026-10-26T17:00:00Z',
        nextAction: 'Case resolved; institute deposited ₹44,000 via RTGS to parent account on 21st Oct. Awaiting candidate confirmation.',
        linkedCaseIds: [],
        resolutionNotes: 'Refund disbursed and transaction reference #HDFC0029104 confirmed by candidate.',
        actions: [
          {
            id: 'act-09-1',
            caseId: 'case-09',
            timestamp: '2026-10-17T11:20:00Z',
            actorName: 'System Gateway',
            actorRole: 'SYSTEM',
            actionType: 'CASE_CREATED',
            description: 'Online grievance lodged with bank payment receipts.',
          },
          {
            id: 'act-09-2',
            caseId: 'case-09',
            timestamp: '2026-10-21T16:00:00Z',
            actorName: 'Smt. Ananya Sen',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Direct notice prompted institute accounts to release pending refund.',
            previousValue: 'NEW',
            newValue: 'ACTION_TAKEN',
          },
        ],
        tags: ['Fee Refund', 'Admission Policy', 'Lucknow'],
        lastUpdated: '2026-10-21T16:30:00Z',
      },
      {
        id: 'case-10',
        caseNumber: 'AICTE-2026-AB-0077',
        title: 'Routine routine compliance report review for MBA accreditation renewal',
        description: 'Submission of triennial compliance report for Master of Business Administration program. Faculty cadres and library volumes meet statutory standards.',
        institutionId: 'inst-6',
        institutionName: 'Deccan Academy of Science & Management Studies',
        permanentId: 'AICTE-1-55029381',
        bureauId: 'bur-ab',
        bureauName: 'Approval Bureau',
        category: 'GOVERNANCE_DISPUTE',
        submissionDate: '2026-10-01T09:00:00Z',
        source: 'AICTE_PORTAL',
        complainantType: 'OFFICIAL_AUDITOR',
        severityLevel: 'NORMAL',
        severityScore: 22,
        severityReason: 'Routine renewal with exemplary audit track record; no active sanctions.',
        severityRuleMatched: 'RULE-AB-01: Standard fast-track clearance for institutes with NAAC A++ accreditation.',
        isSafetyUrgent: false,
        status: 'CLOSED',
        assignedOfficer: 'Priya Ramanathan',
        assignedOfficerEmail: 'officer.ab@aicte-india.org',
        priority: 'ROUTINE',
        deadlineDate: '2026-10-30T17:00:00Z',
        nextAction: 'EoA renewal certificate dispatched.',
        linkedCaseIds: [],
        resolutionNotes: 'Approved for 3-year extension of approval with no adverse findings.',
        actions: [
          {
            id: 'act-10-1',
            caseId: 'case-10',
            timestamp: '2026-10-01T09:00:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'CASE_CREATED',
            description: 'Annual compliance review initiated.',
          },
          {
            id: 'act-10-2',
            caseId: 'case-10',
            timestamp: '2026-10-10T11:00:00Z',
            actorName: 'Priya Ramanathan',
            actorRole: 'BUREAU_OFFICER',
            actionType: 'STATUS_CHANGE',
            description: 'Approved and closed.',
            previousValue: 'UNDER_REVIEW',
            newValue: 'CLOSED',
          },
        ],
        tags: ['Accreditation', 'Fast-Track', 'Hyderabad'],
        lastUpdated: '2026-10-10T11:30:00Z',
      },
      ...GL_BAJAJ_CASES,
    ];

    const suggestions: CaseRelationshipSuggestion[] = [
      {
        id: 'sug-1',
        sourceCaseId: 'case-01',
        sourceCaseNumber: 'AICTE-2026-ARMC-0012',
        sourceTitle: 'Severe physical ragging and intimidation in Hostel Block 4',
        targetCaseId: 'case-03',
        targetCaseNumber: 'AICTE-2026-VIB-0019',
        targetTitle: 'Suspected forged municipal building safety & fire NOC certificates',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        similarityScore: 0.94,
        method: 'HYBRID_TFIDF_SEMANTIC',
        matchingFactors: {
          matchedKeywords: ['Hostel Block 4', 'safety compliance', 'building inspection', 'Apex Institute', 'Pune'],
          sharedPermanentId: true,
          sharedInstitution: true,
          categoryMatch: false,
          temporalProximityDays: 1,
          explanation: 'Both complaints center around Hostel Block 4 of Apex Institute. Case-01 alleges senior harassment inside unmonitored wing, while Case-03 investigates forged safety/fire NOC for the exact same high-occupancy residential building.',
        },
        status: 'PENDING_REVIEW',
      },
      {
        id: 'sug-2',
        sourceCaseId: 'case-02',
        sourceCaseNumber: 'AICTE-2026-AB-0045',
        sourceTitle: 'Unauthorized 120-seat MCA section and ghost faculty roster submitted for EoA',
        targetCaseId: 'case-03',
        targetCaseNumber: 'AICTE-2026-VIB-0019',
        targetTitle: 'Suspected forged municipal building safety & fire NOC certificates',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        similarityScore: 0.88,
        method: 'HYBRID_TFIDF_SEMANTIC',
        matchingFactors: {
          matchedKeywords: ['forged certificates', 'fraudulent compliance', 'approval renewal', 'Apex Institute'],
          sharedPermanentId: true,
          sharedInstitution: true,
          categoryMatch: false,
          temporalProximityDays: 5,
          explanation: 'Demonstrates a unified pattern of regulatory fraud: Approval Bureau is reviewing ghost faculty roster submitted for EoA, while Vigilance is reviewing forged municipal stamps submitted in the same approval package.',
        },
        status: 'CONFIRMED',
        reviewedBy: 'Rajesh Deshmukh',
        reviewedAt: '2026-10-21T15:30:00Z',
        reviewReason: 'Confirmed systemic compliance breach across Approval and Vigilance dossiers for Apex Institute.',
      },
      {
        id: 'sug-3',
        sourceCaseId: 'case-04',
        sourceCaseNumber: 'AICTE-2026-PGC-0089',
        sourceTitle: 'Illegal capitation fee exaction and refusal to return original class 12 marksheets',
        targetCaseId: 'case-05',
        targetCaseNumber: 'AICTE-2026-LAC-0031',
        targetTitle: 'High Court writ petition filed by institute contesting fee ceiling regulation',
        institutionId: 'inst-2',
        institutionName: 'St. Jude Institute of Engineering & Technology',
        similarityScore: 0.91,
        method: 'HYBRID_TFIDF_SEMANTIC',
        matchingFactors: {
          matchedKeywords: ['capitation fee', 'fee ceiling regulation', 'student withholding', 'St. Jude'],
          sharedPermanentId: true,
          sharedInstitution: true,
          categoryMatch: false,
          temporalProximityDays: 2,
          explanation: 'The institute is defending its extra fee levies in High Court (Case-05) while simultaneously withholding marksheets of students refusing to pay the disputed sums (Case-04). Coordinated legal strategy is required.',
        },
        status: 'CONFIRMED',
        reviewedBy: 'Rajesh Deshmukh',
        reviewedAt: '2026-10-20T17:00:00Z',
        reviewReason: 'Confirmed nexus between student grievance withholding and ongoing High Court writ petition.',
      },
      {
        id: 'sug-4',
        sourceCaseId: 'case-06',
        sourceCaseNumber: 'AICTE-2026-PGC-0094',
        sourceTitle: 'Non-payment of faculty salaries for 5 months and EPF deduction non-remittance',
        targetCaseId: 'case-07',
        targetCaseNumber: 'AICTE-2026-AB-0051',
        targetTitle: 'Deficient laboratory equipment in Mechatronics and Electrical Workshop',
        institutionId: 'inst-3',
        institutionName: 'National Capital Polytechnic & Skill Institute',
        similarityScore: 0.79,
        method: 'DETERMINISTIC_METADATA_FALLBACK',
        matchingFactors: {
          matchedKeywords: ['National Capital Polytechnic', 'institutional deficit', 'Greater Noida'],
          sharedPermanentId: true,
          sharedInstitution: true,
          categoryMatch: false,
          temporalProximityDays: 3,
          explanation: 'Shared institution signals severe financial distress: failure to pay teaching staff coincided with breakdown of core laboratory maintenance.',
        },
        status: 'PENDING_REVIEW',
      },
    ];

    const conflicts: CrossBureauConflictAlert[] = [
      {
        id: 'conf-1',
        institutionId: 'inst-1',
        institutionName: 'Apex Institute of Advanced Technology & Research',
        permanentId: 'AICTE-1-49281729',
        caseIds: ['case-01', 'case-02', 'case-03'],
        caseNumbers: ['AICTE-2026-ARMC-0012', 'AICTE-2026-AB-0045', 'AICTE-2026-VIB-0019'],
        bureausInvolved: [
          {
            bureauId: 'bur-armc',
            bureauName: 'Anti-Ragging Monitoring Cell',
            caseId: 'case-01',
            caseNumber: 'AICTE-2026-ARMC-0012',
            assignedOfficer: 'Prof. M. K. Narang',
            status: 'INVESTIGATION_ORDERED',
          },
          {
            bureauId: 'bur-ab',
            bureauName: 'Approval Bureau',
            caseId: 'case-02',
            caseNumber: 'AICTE-2026-AB-0045',
            assignedOfficer: 'Priya Ramanathan',
            status: 'SHOW_CAUSE_ISSUED',
          },
          {
            bureauId: 'bur-vig',
            bureauName: 'Vigilance & Inspection Bureau',
            caseId: 'case-03',
            caseNumber: 'AICTE-2026-VIB-0019',
            assignedOfficer: 'Shri Vikram Malhotra',
            status: 'UNDER_REVIEW',
          },
        ],
        riskLevel: 'CRITICAL',
        conflictType: 'APPROVAL_VS_VIGILANCE_DISPUTE',
        summary: 'Severe three-way bureaucratic collision on Apex Institute: Approval Bureau is evaluating Extension of Approval (EoA) renewal while Vigilance has unverified fire NOC forgery allegations and Anti-Ragging Cell has ordered emergency hostel inquiries.',
        recommendedAction: 'Convene Joint Inter-Bureau Emergency Committee. Freeze issuance of EoA certificate until Vigilance confirms fire safety authenticity and ARMC submits hostel compliance report.',
        status: 'ACTIVE',
        detectedAt: '2026-10-19T14:30:00Z',
      },
      {
        id: 'conf-2',
        institutionId: 'inst-2',
        institutionName: 'St. Jude Institute of Engineering & Technology',
        permanentId: 'AICTE-1-78291044',
        caseIds: ['case-04', 'case-05'],
        caseNumbers: ['AICTE-2026-PGC-0089', 'AICTE-2026-LAC-0031'],
        bureausInvolved: [
          {
            bureauId: 'bur-pgc',
            bureauName: 'Public Grievance Cell',
            caseId: 'case-04',
            caseNumber: 'AICTE-2026-PGC-0089',
            assignedOfficer: 'Smt. Ananya Sen',
            status: 'HEARING_SCHEDULED',
          },
          {
            bureauId: 'bur-lac',
            bureauName: 'Legal & Arbitration Cell',
            caseId: 'case-05',
            caseNumber: 'AICTE-2026-LAC-0031',
            assignedOfficer: 'Adv. Neha Kulkarni',
            status: 'UNDER_REVIEW',
          },
        ],
        riskLevel: 'HIGH',
        conflictType: 'CONTRADICTORY_HEARINGS',
        summary: 'Risk of contradictory findings: Public Grievance Cell scheduled a hearing on marksheet retention linked to fees, while Legal Cell is drafting High Court defense on the broader fee structure stay.',
        recommendedAction: 'Coordinate legal standing counsel notes with PGC hearing officer so hearing orders do not violate High Court interim status quo.',
        status: 'ACKNOWLEDGED',
        detectedAt: '2026-10-15T10:00:00Z',
        acknowledgedBy: 'Dr. Arvind Sharma',
        acknowledgedAt: '2026-10-16T09:30:00Z',
      },
    ];

    const auditLogs: AuditLogEntry[] = [
      {
        id: 'aud-01',
        timestamp: '2026-10-23T09:45:12Z',
        actorId: 'usr-admin-1',
        actorName: 'Dr. Arvind Sharma',
        actorRole: 'ADMIN',
        action: 'CONFLICT_ALERT_REVIEWED',
        entityType: 'CONFLICT',
        entityId: 'conf-1',
        entityReference: 'Apex Institute of Advanced Technology & Research',
        details: 'Admin reviewed critical cross-bureau conflict alert conf-1 and dispatched notification to ARMC, AB, and VIB heads.',
        ipAddress: '10.240.12.18',
      },
      {
        id: 'aud-02',
        timestamp: '2026-10-21T15:30:00Z',
        actorId: 'usr-reviewer-1',
        actorName: 'Rajesh Deshmukh',
        actorRole: 'REVIEWER',
        action: 'RELATIONSHIP_CONFIRMED',
        entityType: 'RELATIONSHIP',
        entityId: 'sug-2',
        entityReference: 'AICTE-2026-AB-0045 <-> AICTE-2026-VIB-0019',
        details: 'Confirmed AI-suggested link between MCA unapproved intake and forged fire safety documentation.',
        ipAddress: '10.240.12.22',
      },
      {
        id: 'aud-03',
        timestamp: '2026-10-20T17:00:00Z',
        actorId: 'usr-reviewer-1',
        actorName: 'Rajesh Deshmukh',
        actorRole: 'REVIEWER',
        action: 'RELATIONSHIP_CONFIRMED',
        entityType: 'RELATIONSHIP',
        entityId: 'sug-3',
        entityReference: 'AICTE-2026-PGC-0089 <-> AICTE-2026-LAC-0031',
        details: 'Confirmed link between student fee grievance and High Court WP 29104/2026.',
        ipAddress: '10.240.12.22',
      },
      {
        id: 'aud-04',
        timestamp: '2026-10-19T14:35:00Z',
        actorId: 'system',
        actorName: 'AI Intelligence Engine',
        actorRole: 'SYSTEM',
        action: 'CROSS_BUREAU_CONFLICT_DETECTED',
        entityType: 'CONFLICT',
        entityId: 'conf-1',
        entityReference: 'inst-1',
        details: 'Automated scan detected overlapping cases across ARMC, AB, and VIB for AICTE-1-49281729.',
        ipAddress: '127.0.0.1',
      },
      {
        id: 'aud-05',
        timestamp: '2026-10-18T10:15:00Z',
        actorId: 'system',
        actorName: 'AI Risk Engine',
        actorRole: 'SYSTEM',
        action: 'SEVERITY_ASSESSED',
        entityType: 'SEVERITY',
        entityId: 'case-01',
        entityReference: 'AICTE-2026-ARMC-0012',
        details: 'Classified severity as CRITICAL (Score 98/100) triggered by violent hazing indicator keywords.',
        ipAddress: '127.0.0.1',
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif-1',
        title: 'CRITICAL SAFETY ALERT',
        message: 'Severe ragging allegation at Apex Institute requires immediate police liaison (AICTE-2026-ARMC-0012).',
        type: 'URGENT_SAFETY',
        timestamp: '2026-10-23T08:15:00Z',
        read: false,
        linkTo: '/cases/case-01',
        entityId: 'case-01',
      },
      {
        id: 'notif-2',
        title: 'CROSS-BUREAU CONFLICT DETECTED',
        message: '3 overlapping investigations detected across ARMC, AB, and VIB on Apex Institute (AICTE-1-49281729).',
        type: 'CONFLICT_DETECTED',
        timestamp: '2026-10-22T14:30:00Z',
        read: false,
        linkTo: '/conflicts',
        entityId: 'conf-1',
      },
      {
        id: 'notif-3',
        title: 'DEADLINE AT RISK (< 48 HOURS)',
        message: 'Case AICTE-2026-VIB-0019 deadline expires tomorrow. Verification letter dispatch pending.',
        type: 'DEADLINE_APPROACHING',
        timestamp: '2026-10-22T09:00:00Z',
        read: false,
        linkTo: '/cases/case-03',
        entityId: 'case-03',
      },
      {
        id: 'notif-4',
        title: 'NEW AI CASE LINK SUGGESTED',
        message: 'High semantic match (94%) detected between Case ARMC-0012 and VIB-0019 on Hostel Block 4.',
        type: 'MATCH_SUGGESTED',
        timestamp: '2026-10-21T16:00:00Z',
        read: true,
        linkTo: '/linking',
        entityId: 'sug-1',
      },
    ];

    return {
      users,
      bureaus,
      institutions,
      cases,
      suggestions,
      conflicts,
      auditLogs,
      notifications,
    };
  }

  // --- CRUD Operations ---

  public getUsers(): User[] {
    return this.db.users;
  }

  public getUserById(id: string): User | undefined {
    return this.db.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getBureaus(): Bureau[] {
    return this.db.bureaus;
  }

  public getInstitutions(): Institution[] {
    return this.db.institutions;
  }

  public getInstitutionById(id: string): Institution | undefined {
    return this.db.institutions.find(i => i.id === id || i.permanentId === id);
  }

  public getCases(): ComplaintCase[] {
    return this.db.cases;
  }

  public getCaseById(id: string): ComplaintCase | undefined {
    return this.db.cases.find(c => c.id === id || c.caseNumber === id || c.trackingToken === id);
  }

  public getCaseByTrackingToken(token: string): ComplaintCase | undefined {
    const q = token.trim().toLowerCase();
    return this.db.cases.find(c =>
      (c.trackingToken && c.trackingToken.toLowerCase() === q) ||
      c.caseNumber.toLowerCase() === q ||
      c.id.toLowerCase() === q
    );
  }

  public createCase(newCase: Omit<ComplaintCase, 'id' | 'caseNumber' | 'actions' | 'lastUpdated'>, actor: { id: string; name: string; role: string }): ComplaintCase {
    const count = this.db.cases.length + 1;
    const bureauObj = this.db.bureaus.find(b => b.id === newCase.bureauId);
    const bureauCode = bureauObj ? bureauObj.code : 'GEN';
    const caseNumber = `AICTE-2026-${bureauCode}-${String(count).padStart(4, '0')}`;
    const id = `case-${String(count).padStart(2, '0')}`;
    const trackingToken = newCase.trackingToken || `AICTE-GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const initialAction: CaseAction = {
      id: `act-${id}-1`,
      caseId: id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'CASE_CREATED',
      description: `Grievance registered under ${newCase.bureauName} by ${actor.name} (${actor.role}).`,
    };

    const complaintCase: ComplaintCase = {
      ...newCase,
      id,
      caseNumber,
      trackingToken,
      actions: [initialAction],
      lastUpdated: new Date().toISOString(),
      linkedCaseIds: newCase.linkedCaseIds || [],
    };

    this.db.cases.unshift(complaintCase);

    // Update institution case count
    const inst = this.db.institutions.find(i => i.id === newCase.institutionId);
    if (inst) {
      inst.totalComplaintsCount += 1;
      inst.activeCasesCount += 1;
    }

    // Add Audit Log
    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_CREATED',
      entityType: 'CASE',
      entityId: id,
      entityReference: caseNumber,
      details: `New complaint registered for ${newCase.institutionName}: "${newCase.title}". Severity: ${newCase.severityLevel}`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return complaintCase;
  }

  public updateCaseStatus(caseId: string, newStatus: ComplaintCase['status'], actor: { id: string; name: string; role: string }, comment?: string): ComplaintCase | null {
    const c = this.getCaseById(caseId);
    if (!c) return null;

    const previousStatus = c.status;
    c.status = newStatus;
    c.lastUpdated = new Date().toISOString();

    const action: CaseAction = {
      id: `act-${c.id}-${c.actions.length + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'STATUS_CHANGE',
      description: comment || `Status updated from ${previousStatus} to ${newStatus}.`,
      previousValue: previousStatus,
      newValue: newStatus,
    };
    c.actions.unshift(action);

    // Update institution active count if closed/reopened
    const inst = this.db.institutions.find(i => i.id === c.institutionId);
    if (inst) {
      if (newStatus === 'CLOSED' && previousStatus !== 'CLOSED') {
        inst.activeCasesCount = Math.max(0, inst.activeCasesCount - 1);
      } else if (previousStatus === 'CLOSED' && newStatus !== 'CLOSED') {
        inst.activeCasesCount += 1;
      }
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_STATUS_UPDATED',
      entityType: 'CASE',
      entityId: c.id,
      entityReference: c.caseNumber,
      details: `Status changed from ${previousStatus} to ${newStatus}. Note: ${comment || 'No note'}`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return c;
  }

  public reassignOfficer(caseId: string, newOfficer: string, newEmail: string, actor: { id: string; name: string; role: string }, reason?: string): ComplaintCase | null {
    const c = this.getCaseById(caseId);
    if (!c) return null;

    const prevOfficer = c.assignedOfficer;
    c.assignedOfficer = newOfficer;
    c.assignedOfficerEmail = newEmail;
    c.lastUpdated = new Date().toISOString();

    c.actions.unshift({
      id: `act-${c.id}-${c.actions.length + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'OFFICER_REASSIGN',
      description: `Reassigned from ${prevOfficer} to ${newOfficer}. Reason: ${reason || 'Workload rebalancing'}`,
      previousValue: prevOfficer,
      newValue: newOfficer,
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'OFFICER_REASSIGNED',
      entityType: 'CASE',
      entityId: c.id,
      entityReference: c.caseNumber,
      details: `Investigating officer updated to ${newOfficer}.`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return c;
  }

  public transferBureau(caseId: string, newBureauId: string, actor: { id: string; name: string; role: string }, reason: string): ComplaintCase | null {
    const c = this.getCaseById(caseId);
    if (!c) return null;

    const targetBureau = this.db.bureaus.find(b => b.id === newBureauId);
    if (!targetBureau) return null;

    const prevBureauName = c.bureauName;
    c.bureauId = targetBureau.id;
    c.bureauName = targetBureau.name;
    c.lastUpdated = new Date().toISOString();

    c.actions.unshift({
      id: `act-${c.id}-${c.actions.length + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'BUREAU_TRANSFER',
      description: `Transferred jurisdiction from ${prevBureauName} to ${targetBureau.name}. Reason: ${reason}`,
      previousValue: prevBureauName,
      newValue: targetBureau.name,
    });

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'BUREAU_TRANSFERRED',
      entityType: 'CASE',
      entityId: c.id,
      entityReference: c.caseNumber,
      details: `Jurisdiction shifted to ${targetBureau.name}. Justification: ${reason}`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return c;
  }

  public addCaseNote(caseId: string, note: string, actor: { id: string; name: string; role: string }): ComplaintCase | null {
    const c = this.getCaseById(caseId);
    if (!c) return null;

    c.actions.unshift({
      id: `act-${c.id}-${c.actions.length + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'NOTE_ADDED',
      description: note,
    });
    c.lastUpdated = new Date().toISOString();

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'CASE_NOTE_ADDED',
      entityType: 'CASE',
      entityId: c.id,
      entityReference: c.caseNumber,
      details: `Case action note recorded: ${note.substring(0, 80)}...`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return c;
  }

  public updateDeadline(caseId: string, newDeadline: string, nextAction: string, actor: { id: string; name: string; role: string }): ComplaintCase | null {
    const c = this.getCaseById(caseId);
    if (!c) return null;

    const prevDeadline = c.deadlineDate;
    c.deadlineDate = newDeadline;
    c.nextAction = nextAction;
    c.lastUpdated = new Date().toISOString();

    c.actions.unshift({
      id: `act-${c.id}-${c.actions.length + 1}`,
      caseId: c.id,
      timestamp: new Date().toISOString(),
      actorName: actor.name,
      actorRole: actor.role,
      actionType: 'DEADLINE_EXTENDED',
      description: `Deadline set to ${newDeadline}. Next scheduled action: ${nextAction}`,
      previousValue: prevDeadline,
      newValue: newDeadline,
    });

    this.saveToDisk();
    return c;
  }

  // --- Case Relationship Suggestions ---

  public getSuggestions(): CaseRelationshipSuggestion[] {
    return this.db.suggestions;
  }

  public getSuggestionById(id: string): CaseRelationshipSuggestion | undefined {
    return this.db.suggestions.find(s => s.id === id);
  }

  public addSuggestion(suggestion: CaseRelationshipSuggestion) {
    const existing = this.db.suggestions.find(
      s => (s.sourceCaseId === suggestion.sourceCaseId && s.targetCaseId === suggestion.targetCaseId) ||
           (s.sourceCaseId === suggestion.targetCaseId && s.targetCaseId === suggestion.sourceCaseId)
    );
    if (!existing) {
      this.db.suggestions.unshift(suggestion);
      this.saveToDisk();
    }
  }

  public reviewSuggestion(suggestionId: string, status: 'CONFIRMED' | 'REJECTED' | 'DISMISSED', actor: { id: string; name: string; role: string }, reason: string): CaseRelationshipSuggestion | null {
    const s = this.getSuggestionById(suggestionId);
    if (!s) return null;

    s.status = status;
    s.reviewedBy = actor.name;
    s.reviewedAt = new Date().toISOString();
    s.reviewReason = reason;

    if (status === 'CONFIRMED') {
      const src = this.getCaseById(s.sourceCaseId);
      const tgt = this.getCaseById(s.targetCaseId);
      if (src && !src.linkedCaseIds.includes(s.targetCaseId)) {
        src.linkedCaseIds.push(s.targetCaseId);
      }
      if (tgt && !tgt.linkedCaseIds.includes(s.sourceCaseId)) {
        tgt.linkedCaseIds.push(s.sourceCaseId);
      }
    } else if (status === 'REJECTED') {
      const src = this.getCaseById(s.sourceCaseId);
      const tgt = this.getCaseById(s.targetCaseId);
      if (src) src.linkedCaseIds = src.linkedCaseIds.filter(id => id !== s.targetCaseId);
      if (tgt) tgt.linkedCaseIds = tgt.linkedCaseIds.filter(id => id !== s.sourceCaseId);
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: status === 'CONFIRMED' ? 'RELATIONSHIP_CONFIRMED' : 'RELATIONSHIP_REJECTED',
      entityType: 'RELATIONSHIP',
      entityId: s.id,
      entityReference: `${s.sourceCaseNumber} <-> ${s.targetCaseNumber}`,
      details: `Case matching decision: ${status}. Reason: ${reason}`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return s;
  }

  // --- Cross-Bureau Conflicts ---

  public getConflicts(): CrossBureauConflictAlert[] {
    return this.db.conflicts;
  }

  public getConflictById(id: string): CrossBureauConflictAlert | undefined {
    return this.db.conflicts.find(c => c.id === id);
  }

  public addConflict(conflict: CrossBureauConflictAlert) {
    const existing = this.db.conflicts.find(c => c.institutionId === conflict.institutionId && c.status === 'ACTIVE');
    if (!existing) {
      this.db.conflicts.unshift(conflict);
      const inst = this.getInstitutionById(conflict.institutionId);
      if (inst) inst.hasActiveConflict = true;
      this.saveToDisk();
    }
  }

  public updateConflictStatus(conflictId: string, status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED', actor: { id: string; name: string; role: string }, notes?: string): CrossBureauConflictAlert | null {
    const conf = this.getConflictById(conflictId);
    if (!conf) return null;

    conf.status = status;
    if (status === 'ACKNOWLEDGED') {
      conf.acknowledgedBy = actor.name;
      conf.acknowledgedAt = new Date().toISOString();
    } else if (status === 'RESOLVED' || status === 'DISMISSED') {
      conf.resolvedAt = new Date().toISOString();
      conf.resolutionNotes = notes || 'Conflict reconciled through inter-bureau coordination.';

      // Check if any other active conflicts exist for this institution
      const remainingActive = this.db.conflicts.some(c => c.institutionId === conf.institutionId && c.id !== conf.id && c.status === 'ACTIVE');
      const inst = this.getInstitutionById(conf.institutionId);
      if (inst) inst.hasActiveConflict = remainingActive;
    }

    this.addAuditLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: `CONFLICT_${status}`,
      entityType: 'CONFLICT',
      entityId: conf.id,
      entityReference: conf.institutionName,
      details: `Conflict status shifted to ${status}. Details: ${notes || 'None'}`,
      ipAddress: '127.0.0.1',
    });

    this.saveToDisk();
    return conf;
  }

  // --- Audit Logs ---

  public getAuditLogs(): AuditLogEntry[] {
    return this.db.auditLogs;
  }

  public addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const id = `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newEntry: AuditLogEntry = {
      ...entry,
      id,
      timestamp: new Date().toISOString(),
    };
    this.db.auditLogs.unshift(newEntry);
    if (this.db.auditLogs.length > 500) {
      this.db.auditLogs.pop();
    }
  }

  // --- Notifications ---

  public getNotifications(): NotificationItem[] {
    return this.db.notifications;
  }

  public markNotificationAsRead(id: string): boolean {
    const n = this.db.notifications.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  public markAllNotificationsAsRead() {
    this.db.notifications.forEach(n => (n.read = true));
    this.saveToDisk();
  }

  public addNotification(notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) {
    const newNotif: NotificationItem = {
      ...notification,
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.db.notifications.unshift(newNotif);
    this.saveToDisk();
  }
}

export const dataStore = new DataStore();
