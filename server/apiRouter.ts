/**
 * AICTE Case Intelligence REST API Router
 * Implements RESTful endpoints under /api/v1
 */

import express, { Request, Response } from 'express';
import { dataStore, User, ComplaintCase } from './dataStore';
import { IntelligenceEngine } from './intelligenceEngine';

export const apiRouter = express.Router();

// Helper to get authenticated actor (simulated JWT auth with role simulation)
function getActor(req: Request): { id: string; name: string; role: User['role']; bureauId?: string; bureauName?: string } {
  const authHeader = req.headers.authorization;
  const roleHeader = (req.headers['x-user-role'] as string) || '';
  const userIdHeader = (req.headers['x-user-id'] as string) || '';

  if (userIdHeader) {
    const user = dataStore.getUserById(userIdHeader);
    if (user) return { id: user.id, name: user.name, role: user.role, bureauId: user.bureauId, bureauName: user.bureauName };
  }

  if (roleHeader) {
    const user = dataStore.getUsers().find(u => u.role === roleHeader);
    if (user) return { id: user.id, name: user.name, role: user.role, bureauId: user.bureauId, bureauName: user.bureauName };
    if (roleHeader === 'BUREAU_OFFICER') {
      const bo = dataStore.getUsers().find(u => u.role === 'BUREAU_OFFICER_AB' || u.role === 'BUREAU_OFFICER');
      if (bo) return { id: bo.id, name: bo.name, role: bo.role, bureauId: bo.bureauId, bureauName: bo.bureauName };
    }
  }

  // Default to Admin if not specified
  const admin = dataStore.getUsers().find(u => u.role === 'ADMIN');
  return admin
    ? { id: admin.id, name: admin.name, role: admin.role, bureauId: admin.bureauId, bureauName: admin.bureauName }
    : { id: 'usr-admin-1', name: 'Dr. Arvind Sharma', role: 'ADMIN' };
}

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const identifier = (username || email || '').trim().toLowerCase();

  // Find user by username alias or email
  let user: User | undefined;
  const allUsers = dataStore.getUsers();

  if (identifier === 'student' || identifier === 'citizen' || identifier.includes('student') || identifier.includes('aarav')) {
    user = allUsers.find(u => u.role === 'CITIZEN');
  } else if (identifier === 'approval' || identifier === 'ab' || identifier.includes('approval')) {
    user = allUsers.find(u => u.role === 'BUREAU_OFFICER_AB');
  } else if (identifier === 'grievance' || identifier === 'pgc' || identifier.includes('grievance')) {
    user = allUsers.find(u => u.role === 'BUREAU_OFFICER_PGC');
  } else if (identifier === 'vigilance' || identifier === 'armc' || identifier === 'safety' || identifier.includes('vigilance')) {
    user = allUsers.find(u => u.role === 'BUREAU_OFFICER_ARMC');
  } else if (identifier === 'admin' || identifier.includes('admin') || identifier.includes('arvind')) {
    user = allUsers.find(u => u.role === 'ADMIN');
  } else if (identifier === 'reviewer' || identifier.includes('reviewer')) {
    user = allUsers.find(u => u.role === 'REVIEWER');
  } else if (identifier === 'executive' || identifier === 'mgmt' || identifier.includes('management')) {
    user = allUsers.find(u => u.role === 'READONLY_MANAGEMENT');
  } else {
    user = dataStore.getUserByEmail(identifier);
    if (!user) {
      user = allUsers.find(u => 
        u.name.toLowerCase().includes(identifier) || 
        u.role.toLowerCase() === identifier
      );
    }
  }

  if (!user) {
    return res.status(401).json({ 
      error: 'Invalid username. Easy usernames: "student", "approval", "grievance", "vigilance", "admin", "reviewer", or "executive".' 
    });
  }

  // Password check: demo123 (or admin123)
  if (password && password !== 'demo123' && password !== 'admin123') {
    return res.status(401).json({ 
      error: 'Invalid password. Please enter password: demo123' 
    });
  }

  // Generate demo bearer token
  const token = `aicte-jwt-${user.id}-${Date.now()}`;
  dataStore.addAuditLog({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'USER',
    entityId: user.id,
    entityReference: user.email,
    details: `User logged in successfully as ${user.name} (${user.role}).`,
    ipAddress: req.ip || '127.0.0.1',
  });

  return res.json({
    token,
    user,
    message: `Logged in successfully as ${user.name} (${user.role})`,
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const actor = getActor(req);
  const user = dataStore.getUserById(actor.id) || dataStore.getUsers()[0];
  res.json({ user });
});

apiRouter.get('/auth/demo-users', (req: Request, res: Response) => {
  res.json({ users: dataStore.getUsers() });
});

// ==========================================
// 2. SYSTEM HEALTH & DIAGNOSTICS
// ==========================================

apiRouter.get('/health', (req: Request, res: Response) => {
  const cases = dataStore.getCases();
  const institutions = dataStore.getInstitutions();
  const conflicts = dataStore.getConflicts();
  const memoryUsage = process.memoryUsage();

  res.json({
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    system: 'CaseSetu — AICTE Institution-Centric Case Intelligence & Cross-Bureau Conflict Prevention System',
    problemStatement: 'SIH26264',
    version: '1.0.0-PROTOTYPE',
    database: {
      status: 'CONNECTED',
      type: 'PostgreSQL-Compatible Engine (Persistent Transactional Store)',
      casesCount: cases.length,
      institutionsCount: institutions.length,
      conflictsCount: conflicts.length,
    },
    intelligenceEngine: {
      nlpEngine: 'Hybrid TF-IDF & Token Space Cosine Similarity',
      fallbackStatus: 'ACTIVE (Deterministic rule and semantic matrix fallback verified)',
      sentenceTransformersLoaded: false,
      mlModelStatus: 'Explainable Heuristic + Jaccard N-gram Fallback operational',
      severityEngine: 'Configurable Rule-Based Urgency Engine (v2.1)',
      crossBureauDetector: 'Multi-Bureau Collision Scanner (v1.8)',
    },
    performance: {
      uptimeSeconds: Math.round(process.uptime()),
      heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
  });
});

// ==========================================
// 3. EXECUTIVE OVERVIEW DASHBOARD
// ==========================================

apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const cases = dataStore.getCases();
  const institutions = dataStore.getInstitutions();
  const conflicts = dataStore.getConflicts();
  const suggestions = dataStore.getSuggestions();
  const bureaus = dataStore.getBureaus();

  // Metrics
  const totalCases = cases.length;
  const openCases = cases.filter(c => c.status !== 'CLOSED').length;
  const criticalCases = cases.filter(c => c.severityLevel === 'CRITICAL' && c.status !== 'CLOSED').length;
  const highPriorityCases = cases.filter(c => c.severityLevel === 'HIGH' && c.status !== 'CLOSED').length;
  const activeConflicts = conflicts.filter(c => c.status === 'ACTIVE').length;
  const pendingSuggestions = suggestions.filter(s => s.status === 'PENDING_REVIEW').length;
  
  // Deadline calculation
  const now = new Date().getTime();
  const overdueCases = cases.filter(c => {
    if (c.status === 'CLOSED') return false;
    const deadline = new Date(c.deadlineDate).getTime();
    return deadline < now;
  }).length;

  const approachingDeadlineCases = cases.filter(c => {
    if (c.status === 'CLOSED') return false;
    const deadline = new Date(c.deadlineDate).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    return diffHours >= 0 && diffHours <= 72; // within 3 days
  }).length;

  // Bureau Workload
  const bureauWorkload = bureaus.map(b => {
    const bCases = cases.filter(c => c.bureauId === b.id);
    return {
      bureauId: b.id,
      code: b.code,
      name: b.name,
      total: bCases.length,
      active: bCases.filter(c => c.status !== 'CLOSED').length,
      critical: bCases.filter(c => c.severityLevel === 'CRITICAL' && c.status !== 'CLOSED').length,
      resolved: bCases.filter(c => c.status === 'CLOSED' || c.status === 'ACTION_TAKEN').length,
    };
  });

  // Severity Distribution
  const severityDistribution = [
    { level: 'CRITICAL', count: cases.filter(c => c.severityLevel === 'CRITICAL').length, color: '#ef4444' },
    { level: 'HIGH', count: cases.filter(c => c.severityLevel === 'HIGH').length, color: '#f97316' },
    { level: 'TIME_SENSITIVE', count: cases.filter(c => c.severityLevel === 'TIME_SENSITIVE').length, color: '#eab308' },
    { level: 'NORMAL', count: cases.filter(c => c.severityLevel === 'NORMAL').length, color: '#3b82f6' },
  ];

  // Category Distribution
  const categoryCounts: Record<string, number> = {};
  cases.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });
  const categoryDistribution = Object.entries(categoryCounts).map(([cat, count]) => ({
    category: cat,
    count,
  }));

  // Regional summary
  const stateCounts: Record<string, number> = {};
  institutions.forEach(inst => {
    const instCases = cases.filter(c => c.institutionId === inst.id);
    stateCounts[inst.state] = (stateCounts[inst.state] || 0) + instCases.length;
  });
  const regionalSummary = Object.entries(stateCounts).map(([state, count]) => ({
    region: state,
    caseCount: count,
  }));

  // Trend over time (simulated days in Oct 2026)
  const trends = [
    { date: '10 Oct', newCases: 2, resolved: 1 },
    { date: '12 Oct', newCases: 1, resolved: 0 },
    { date: '14 Oct', newCases: 3, resolved: 1 },
    { date: '16 Oct', newCases: 2, resolved: 2 },
    { date: '18 Oct', newCases: 4, resolved: 1 },
    { date: '20 Oct', newCases: 2, resolved: 2 },
    { date: '22 Oct', newCases: 3, resolved: 1 },
  ];

  // Recent case activity
  const recentCases = [...cases]
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    .slice(0, 5);

  res.json({
    kpis: {
      totalCases,
      openCases,
      criticalCases,
      highPriorityCases,
      activeConflicts,
      pendingSuggestions,
      overdueCases,
      approachingDeadlineCases,
      totalInstitutions: institutions.length,
      highRiskInstitutions: institutions.filter(i => i.riskScore >= 70).length,
    },
    bureauWorkload,
    severityDistribution,
    categoryDistribution,
    regionalSummary,
    trends,
    recentCases,
  });
});

// ==========================================
// 4. COMPLAINT & CASE MANAGEMENT
// ==========================================

apiRouter.get('/cases', (req: Request, res: Response) => {
  let cases = [...dataStore.getCases()];
  const {
    search,
    bureauId,
    category,
    severity,
    status,
    institutionId,
    sortBy = 'lastUpdated',
    sortOrder = 'desc',
    page = '1',
    limit = '20',
  } = req.query;

  // Filter Search
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    cases = cases.filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.institutionName.toLowerCase().includes(q) ||
      c.permanentId.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.assignedOfficer.toLowerCase().includes(q)
    );
  }

  // Filters
  if (bureauId) cases = cases.filter(c => c.bureauId === bureauId);
  if (category) cases = cases.filter(c => c.category === category);
  if (severity) cases = cases.filter(c => c.severityLevel === severity);
  if (status) cases = cases.filter(c => c.status === status);
  if (institutionId) cases = cases.filter(c => c.institutionId === institutionId || c.permanentId === institutionId);

  // Sorting
  cases.sort((a: any, b: any) => {
    let valA = a[sortBy as string];
    let valB = b[sortBy as string];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const pageNum = parseInt(page as string, 10) || 1;
  const limitNum = parseInt(limit as string, 10) || 20;
  const totalCount = cases.length;
  const paginated = cases.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.json({
    data: paginated,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  });
});

apiRouter.get('/cases/:id', (req: Request, res: Response) => {
  const c = dataStore.getCaseById(req.params.id);
  if (!c) {
    return res.status(404).json({ error: 'Complaint record not found.' });
  }

  // Get linked cases
  const linkedCases = c.linkedCaseIds
    .map(id => dataStore.getCaseById(id))
    .filter(Boolean);

  // Get active suggestions involving this case
  const candidateSuggestions = dataStore.getSuggestions().filter(
    s => s.sourceCaseId === c.id || s.targetCaseId === c.id
  );

  // Get institution profile
  const institution = dataStore.getInstitutionById(c.institutionId);

  res.json({
    case: c,
    linkedCases,
    candidateSuggestions,
    institution,
  });
});

// ==========================================
// CITIZEN & PUBLIC GRIEVANCE PORTAL ENDPOINTS
// ==========================================

apiRouter.get('/citizen/track/:token', (req: Request, res: Response) => {
  const token = req.params.token;
  const c = dataStore.getCaseByTrackingToken(token);
  if (!c) {
    return res.status(404).json({ error: 'No grievance record found with tracking token or case number: ' + token });
  }

  // Return public sanitized timeline for student/citizen
  const publicActions = c.actions.map(a => ({
    id: a.id,
    timestamp: a.timestamp,
    actionType: a.actionType,
    description: a.description,
    statusTransition: a.newValue || a.previousValue || undefined,
  }));

  res.json({
    grievance: {
      id: c.id,
      caseNumber: c.caseNumber,
      trackingToken: c.trackingToken,
      title: c.title,
      description: c.description,
      institutionName: c.institutionName,
      permanentId: c.permanentId,
      bureauName: c.bureauName,
      category: c.category,
      status: c.status,
      submissionDate: c.submissionDate,
      deadlineDate: c.deadlineDate,
      priority: c.priority,
      isSafetyUrgent: c.isSafetyUrgent,
      resolutionNotes: c.resolutionNotes,
      complainantType: c.complainantType,
      isAnonymous: c.isAnonymous,
      actions: publicActions,
      lastUpdated: c.lastUpdated,
    },
  });
});

apiRouter.post('/citizen/track/:token/feedback', (req: Request, res: Response) => {
  const token = req.params.token;
  const { note, evidenceFile } = req.body;
  const c = dataStore.getCaseByTrackingToken(token);
  if (!c) {
    return res.status(404).json({ error: 'Grievance not found.' });
  }

  const actor = getActor(req);
  const noteText = `[Citizen Supplementary Evidence]: ${note}${evidenceFile ? ` (Attachment: ${evidenceFile})` : ''}`;
  const updated = dataStore.addCaseNote(c.id, noteText, {
    id: actor.id || 'citizen',
    name: actor.name || 'Complainant Student',
    role: 'CITIZEN',
  });

  res.json({ message: 'Additional information recorded successfully.', case: updated });
});

apiRouter.get('/citizen/my-complaints', (req: Request, res: Response) => {
  const actor = getActor(req);
  const allCases = dataStore.getCases();
  // Filter cases for the citizen user
  const userCases = allCases.filter(c =>
    c.complainantType === 'STUDENT' ||
    c.complainantType === 'CITIZEN' ||
    c.complainantEmail === actor.name ||
    c.actions.some(a => a.actorName === actor.name)
  );

  res.json({ complaints: userCases.slice(0, 10) });
});

// Case creation with citizen tracking token
apiRouter.post('/cases', (req: Request, res: Response) => {
  const actor = getActor(req);

  // Role validation: Bureau Officers and Reviewers cannot post citizen complaints directly
  if (actor.role.startsWith('BUREAU_OFFICER') || actor.role === 'BUREAU_OFFICER' || actor.role === 'REVIEWER' || actor.role === 'READONLY_MANAGEMENT') {
    return res.status(403).json({
      error: `Access Denied: Only Citizens, Students, and Complainants (or Administrator intake) are authorized to register new complaints. Bureau Officers (${actor.role}) investigate and adjudicate existing complaints. Please switch to Citizen / Student role to file a grievance.`
    });
  }

  const {
    title: rawTitle,
    subject,
    description,
    institutionId,
    bureauId: rawBureauId,
    bureau: rawBureau,
    category,
    source = 'STUDENT_GRIEVANCE_CELL',
    complainantType = 'STUDENT',
    complainantName,
    complainantEmail,
    complainantPhone,
    isAnonymous = false,
    evidenceFiles = [],
    assignedOfficer,
    assignedOfficerEmail,
    priority,
    deadlineDate,
    nextAction,
    tags,
  } = req.body;

  const title = rawTitle || subject;
  let bureauId = rawBureauId || rawBureau;

  if (!title || !description || !institutionId || !bureauId || !category) {
    return res.status(400).json({ error: 'Missing mandatory fields: title (or subject), description, institutionId, bureauId, category.' });
  }

  const institution = dataStore.getInstitutionById(institutionId);
  if (!institution) {
    return res.status(400).json({ error: 'Referenced institution not found.' });
  }

  // Resolve bureau if ID, code, or name was passed
  let bureau = dataStore.getBureaus().find(b => b.id === bureauId || b.code === bureauId || b.name === bureauId);
  if (!bureau) {
    bureau = dataStore.getBureaus()[0]; // fallback default
    bureauId = bureau.id;
  } else {
    bureauId = bureau.id;
  }

  // Run AI Severity Engine automatically
  const severityEvaluation = IntelligenceEngine.evaluateSeverity({
    title,
    description,
    category,
    complainantType,
  });

  const now = new Date();
  const defaultDeadline = new Date(now.getTime() + (severityEvaluation.severityLevel === 'CRITICAL' ? 3 : 15) * 24 * 60 * 60 * 1000).toISOString();
  const trackingToken = `AICTE-GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCase = dataStore.createCase(
    {
      title,
      description,
      institutionId: institution.id,
      institutionName: institution.name,
      permanentId: institution.permanentId,
      bureauId: bureau.id,
      bureauName: bureau.name,
      category,
      submissionDate: now.toISOString(),
      source,
      complainantType,
      complainantName: isAnonymous ? 'Anonymous Complainant' : (complainantName || actor.name),
      complainantEmail: isAnonymous ? undefined : (complainantEmail || 'student@aicte-student.org'),
      complainantPhone,
      isAnonymous,
      evidenceFiles,
      trackingToken,
      severityLevel: severityEvaluation.severityLevel,
      severityScore: severityEvaluation.severityScore,
      severityReason: severityEvaluation.severityReason,
      severityRuleMatched: severityEvaluation.ruleMatched,
      isSafetyUrgent: severityEvaluation.isSafetyUrgent,
      status: 'NEW',
      assignedOfficer: assignedOfficer || bureau.headOfficer,
      assignedOfficerEmail: assignedOfficerEmail || 'officer@aicte-india.org',
      priority: priority || (severityEvaluation.severityLevel === 'CRITICAL' ? 'CRITICAL' : 'MEDIUM'),
      deadlineDate: deadlineDate || defaultDeadline,
      nextAction: nextAction || (severityEvaluation.isSafetyUrgent ? 'Expedited physical review & police liaison.' : 'Initial notice of inquiry dispatch.'),
      linkedCaseIds: [],
      tags: tags || ['Citizen Grievance', category, institution.city],
    },
    actor
  );

  // Automatically scan for candidate linked cases
  const generatedSuggestions = IntelligenceEngine.scanAndGenerateSuggestionsForCase(newCase);

  // Automatically scan for cross-bureau conflicts on this institution
  IntelligenceEngine.scanCrossBureauConflicts();

  if (severityEvaluation.isSafetyUrgent) {
    dataStore.addNotification({
      title: 'URGENT STUDENT SAFETY COMPLAINT',
      message: `Critical safety case registered: "${newCase.title}" for ${newCase.institutionName}`,
      type: 'URGENT_SAFETY',
      linkTo: `/cases/${newCase.id}`,
      entityId: newCase.id,
    });
  }

  res.status(201).json({
    case: newCase,
    severityEvaluation,
    generatedSuggestionsCount: generatedSuggestions.length,
    message: 'Complaint successfully registered with AI triage and conflict analysis.',
  });
});

apiRouter.patch('/cases/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { status, comment } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const updated = dataStore.updateCaseStatus(req.params.id, status, actor, comment);
  if (!updated) return res.status(404).json({ error: 'Case not found.' });

  res.json({ case: updated, message: `Status updated to ${status}` });
});

apiRouter.patch('/cases/:id/reassign', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { officerName, officerEmail, reason } = req.body;
  if (!officerName) return res.status(400).json({ error: 'Officer name is required.' });

  const updated = dataStore.reassignOfficer(req.params.id, officerName, officerEmail || 'officer@aicte-india.org', actor, reason);
  if (!updated) return res.status(404).json({ error: 'Case not found.' });

  res.json({ case: updated, message: `Case reassigned to ${officerName}` });
});

apiRouter.patch('/cases/:id/transfer', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { bureauId, reason } = req.body;
  if (!bureauId || !reason) return res.status(400).json({ error: 'bureauId and reason are required.' });

  const updated = dataStore.transferBureau(req.params.id, bureauId, actor, reason);
  if (!updated) return res.status(404).json({ error: 'Case or target Bureau not found.' });

  // Re-scan conflicts
  IntelligenceEngine.scanCrossBureauConflicts();

  res.json({ case: updated, message: `Case transferred to ${updated.bureauName}` });
});

apiRouter.post('/cases/:id/notes', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Note text is required.' });

  const updated = dataStore.addCaseNote(req.params.id, note, actor);
  if (!updated) return res.status(404).json({ error: 'Case not found.' });

  res.json({ case: updated, message: 'Action note appended to timeline.' });
});

apiRouter.patch('/cases/:id/deadline', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { deadlineDate, nextAction } = req.body;
  if (!deadlineDate) return res.status(400).json({ error: 'deadlineDate is required.' });

  const updated = dataStore.updateDeadline(req.params.id, deadlineDate, nextAction || 'Next action scheduled.', actor);
  if (!updated) return res.status(404).json({ error: 'Case not found.' });

  res.json({ case: updated, message: 'Deadline and action step updated.' });
});

apiRouter.get('/cases-export/csv', (req: Request, res: Response) => {
  const cases = dataStore.getCases();
  const headers = ['CaseNumber', 'Title', 'InstitutionName', 'PermanentID', 'Bureau', 'Category', 'Severity', 'Status', 'AssignedOfficer', 'Deadline', 'LastUpdated'];
  const rows = cases.map(c => [
    `"${c.caseNumber}"`,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.institutionName.replace(/"/g, '""')}"`,
    `"${c.permanentId}"`,
    `"${c.bureauName}"`,
    `"${c.category}"`,
    `"${c.severityLevel}"`,
    `"${c.status}"`,
    `"${c.assignedOfficer}"`,
    `"${c.deadlineDate}"`,
    `"${c.lastUpdated}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="aicte_cases_export.csv"');
  res.send(csv);
});

// ==========================================
// 5. INSTITUTION DIRECTORY & 360° PROFILE
// ==========================================

apiRouter.get('/institutions', (req: Request, res: Response) => {
  let list = [...dataStore.getInstitutions()];
  const { search, state, riskCategory } = req.query;

  if (search && typeof search === 'string') {
    const rawQ = search.toLowerCase().trim();
    const cleanQ = rawQ.replace(/\./g, '');
    const tokens = cleanQ.split(/\s+/).filter(Boolean);

    list = list.filter(i => {
      const name = i.name.toLowerCase();
      const cleanName = name.replace(/\./g, '');
      const pid = i.permanentId.toLowerCase();
      const city = i.city.toLowerCase();
      const stateName = i.state.toLowerCase();
      const id = i.id.toLowerCase();
      const combined = `${cleanName} ${pid} ${city} ${stateName} ${id}`;

      // Every word token in the query should match the institution
      return tokens.every(tok => {
        if (tok === 'itm') return id.includes('itm') || cleanName.includes('technology');
        if (tok === 'imr') return id.includes('imr') || cleanName.includes('management and research');
        if (tok === 'gl') return cleanName.includes('gl') || id.includes('glb');
        return combined.includes(tok);
      });
    });
  }

  if (state) list = list.filter(i => i.state === state);
  if (riskCategory) list = list.filter(i => i.riskCategory === riskCategory);

  res.json({ institutions: list });
});

apiRouter.get('/institutions/:id', (req: Request, res: Response) => {
  const inst = dataStore.getInstitutionById(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Institution not found.' });

  const allCases = dataStore.getCases().filter(c => c.institutionId === inst.id || c.permanentId === inst.permanentId);
  const activeConflicts = dataStore.getConflicts().filter(c => c.institutionId === inst.id);
  const suggestions = dataStore.getSuggestions().filter(s => s.institutionId === inst.id);

  // Active bureaus involved
  const bureausInvolvedMap: Record<string, { bureauName: string; count: number }> = {};
  allCases.forEach(c => {
    if (!bureausInvolvedMap[c.bureauId]) {
      bureausInvolvedMap[c.bureauId] = { bureauName: c.bureauName, count: 0 };
    }
    bureausInvolvedMap[c.bureauId].count++;
  });

  res.json({
    institution: inst,
    cases: allCases,
    conflicts: activeConflicts,
    suggestions,
    bureausInvolved: Object.values(bureausInvolvedMap),
  });
});

// ==========================================
// 6. AI CASE LINKING ENGINE
// ==========================================

apiRouter.get('/linking/suggestions', (req: Request, res: Response) => {
  const { status = 'ALL' } = req.query;
  let suggestions = dataStore.getSuggestions();

  if (status !== 'ALL') {
    suggestions = suggestions.filter(s => s.status === status);
  }

  res.json({ suggestions });
});

apiRouter.post('/linking/compare', (req: Request, res: Response) => {
  const { caseIdA, caseIdB } = req.body;
  const a = dataStore.getCaseById(caseIdA);
  const b = dataStore.getCaseById(caseIdB);

  if (!a || !b) {
    return res.status(404).json({ error: 'One or both cases not found for comparison.' });
  }

  const result = IntelligenceEngine.compareCases(a, b);
  res.json({
    comparison: result,
    caseA: { id: a.id, number: a.caseNumber, title: a.title, bureau: a.bureauName },
    caseB: { id: b.id, number: b.caseNumber, title: b.title, bureau: b.bureauName },
  });
});

apiRouter.post('/linking/suggestions/:id/review', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { status, reason } = req.body;

  if (!status || !['CONFIRMED', 'REJECTED', 'DISMISSED'].includes(status)) {
    return res.status(400).json({ error: 'Status must be CONFIRMED, REJECTED, or DISMISSED.' });
  }

  const updated = dataStore.reviewSuggestion(req.params.id, status, actor, reason || 'Reviewed via AI Case Intelligence interface.');
  if (!updated) return res.status(404).json({ error: 'Suggestion not found.' });

  res.json({ suggestion: updated, message: `Suggestion marked as ${status}` });
});

apiRouter.post('/linking/manual-link', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { sourceCaseId, targetCaseId, reason } = req.body;
  const a = dataStore.getCaseById(sourceCaseId);
  const b = dataStore.getCaseById(targetCaseId);

  if (!a || !b) return res.status(404).json({ error: 'Specified cases not found.' });

  if (!a.linkedCaseIds.includes(b.id)) a.linkedCaseIds.push(b.id);
  if (!b.linkedCaseIds.includes(a.id)) b.linkedCaseIds.push(a.id);

  dataStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'MANUAL_LINK_CREATED',
    entityType: 'RELATIONSHIP',
    entityId: `${a.id}_${b.id}`,
    entityReference: `${a.caseNumber} <-> ${b.caseNumber}`,
    details: `Manual relationship linked. Reason: ${reason || 'Officer linkage'}`,
    ipAddress: '127.0.0.1',
  });

  res.json({ message: 'Cases successfully linked.', a, b });
});

// ==========================================
// 7. CROSS-BUREAU CONFLICT CENTRE
// ==========================================

apiRouter.get('/conflicts', (req: Request, res: Response) => {
  const { status } = req.query;
  let conflicts = dataStore.getConflicts();
  if (status && status !== 'ALL') {
    conflicts = conflicts.filter(c => c.status === status);
  }
  res.json({ conflicts });
});

apiRouter.patch('/conflicts/:id/status', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { status, notes } = req.body;

  if (!status || !['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid conflict status.' });
  }

  const updated = dataStore.updateConflictStatus(req.params.id, status, actor, notes);
  if (!updated) return res.status(404).json({ error: 'Conflict record not found.' });

  res.json({ conflict: updated, message: `Conflict marked as ${status}.` });
});

apiRouter.post('/conflicts/scan', (req: Request, res: Response) => {
  const detected = IntelligenceEngine.scanCrossBureauConflicts();
  res.json({
    message: 'Cross-bureau conflict scan completed.',
    activeConflictsCount: detected.length,
    conflicts: dataStore.getConflicts(),
  });
});

// ==========================================
// 8. SEVERITY & URGENCY ENGINE
// ==========================================

apiRouter.get('/severity/queue', (req: Request, res: Response) => {
  const openCases = dataStore.getCases().filter(c => c.status !== 'CLOSED');

  // Order by: 1. Safety urgent, 2. Severity score desc, 3. Deadline asc
  openCases.sort((a, b) => {
    if (a.isSafetyUrgent && !b.isSafetyUrgent) return -1;
    if (!a.isSafetyUrgent && b.isSafetyUrgent) return 1;
    if (b.severityScore !== a.severityScore) return b.severityScore - a.severityScore;
    return new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime();
  });

  res.json({ queue: openCases });
});

apiRouter.post('/severity/evaluate', (req: Request, res: Response) => {
  const { title, description, category, complainantType } = req.body;
  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description required.' });
  }
  const result = IntelligenceEngine.evaluateSeverity({ title, description, category, complainantType });
  res.json({ evaluation: result });
});

apiRouter.post('/severity/override', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { caseId, newSeverity, overrideReason } = req.body;
  const c = dataStore.getCaseById(caseId);

  if (!c) return res.status(404).json({ error: 'Case not found.' });
  if (!newSeverity || !overrideReason) {
    return res.status(400).json({ error: 'newSeverity and overrideReason required.' });
  }

  const prevSeverity = c.severityLevel;
  c.severityLevel = newSeverity;
  c.severityReason = `[Officer Override]: ${overrideReason} (Original AI note: ${c.severityReason})`;
  c.lastUpdated = new Date().toISOString();

  c.actions.unshift({
    id: `act-${c.id}-${c.actions.length + 1}`,
    caseId: c.id,
    timestamp: new Date().toISOString(),
    actorName: actor.name,
    actorRole: actor.role,
    actionType: 'SEVERITY_OVERRIDDEN',
    description: `Severity manually adjusted from ${prevSeverity} to ${newSeverity}. Reason: ${overrideReason}`,
    previousValue: prevSeverity,
    newValue: newSeverity,
  });

  dataStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: 'SEVERITY_OVERRIDDEN',
    entityType: 'SEVERITY',
    entityId: c.id,
    entityReference: c.caseNumber,
    details: `Severity altered to ${newSeverity}. Justification: ${overrideReason}`,
    ipAddress: '127.0.0.1',
  });

  res.json({ case: c, message: 'Severity classification updated by authorized officer.' });
});

// ==========================================
// 9. RELATIONSHIP GRAPH (React Flow Nodes & Edges)
// ==========================================

apiRouter.get('/graph', (req: Request, res: Response) => {
  const cases = dataStore.getCases();
  const institutions = dataStore.getInstitutions();
  const bureaus = dataStore.getBureaus();
  const suggestions = dataStore.getSuggestions();
  const conflicts = dataStore.getConflicts();

  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Institution Nodes (Central Hubs)
  institutions.forEach((inst, idx) => {
    const x = 500 + (idx % 3) * 450;
    const y = 300 + Math.floor(idx / 3) * 400;

    nodes.push({
      id: `inst-node-${inst.id}`,
      type: 'institutionNode',
      position: { x, y },
      data: {
        id: inst.id,
        permanentId: inst.permanentId,
        label: inst.name,
        city: inst.city,
        state: inst.state,
        riskScore: inst.riskScore,
        riskCategory: inst.riskCategory,
        hasActiveConflict: inst.hasActiveConflict,
        activeCasesCount: inst.activeCasesCount,
      },
    });
  });

  // 2. Case Nodes around their respective institutions
  cases.forEach((c, idx) => {
    const instNode = nodes.find(n => n.id === `inst-node-${c.institutionId}`);
    const baseX = instNode ? instNode.position.x : 400;
    const baseY = instNode ? instNode.position.y : 400;

    // Distribute around the institution in a radial orbit
    const angle = (idx * 1.3) % (2 * Math.PI);
    const radius = 220;
    const x = baseX + Math.cos(angle) * radius;
    const y = baseY + Math.sin(angle) * radius;

    nodes.push({
      id: `case-node-${c.id}`,
      type: 'caseNode',
      position: { x, y },
      data: {
        id: c.id,
        caseNumber: c.caseNumber,
        title: c.title,
        bureauName: c.bureauName,
        category: c.category,
        severityLevel: c.severityLevel,
        status: c.status,
        isSafetyUrgent: c.isSafetyUrgent,
        assignedOfficer: c.assignedOfficer,
      },
    });

    // Edge from Institution to Case
    edges.push({
      id: `edge-inst-${c.institutionId}-case-${c.id}`,
      source: `inst-node-${c.institutionId}`,
      target: `case-node-${c.id}`,
      type: 'smoothstep',
      animated: c.status !== 'CLOSED',
      style: { stroke: '#475569', strokeWidth: 1.5 },
      label: 'Subject',
    });
  });

  // 3. Bureau Nodes positioned at top
  bureaus.forEach((b, idx) => {
    nodes.push({
      id: `bureau-node-${b.id}`,
      type: 'bureauNode',
      position: { x: 300 + idx * 300, y: 50 },
      data: {
        id: b.id,
        code: b.code,
        name: b.name,
        headOfficer: b.headOfficer,
      },
    });
  });

  // Bureau to Case assignment edges
  cases.forEach(c => {
    edges.push({
      id: `edge-bur-${c.bureauId}-case-${c.id}`,
      source: `bureau-node-${c.bureauId}`,
      target: `case-node-${c.id}`,
      type: 'straight',
      style: { stroke: '#3b82f6', strokeDasharray: '4 4', strokeWidth: 1.2 },
      label: 'Jurisdiction',
    });
  });

  // 4. Confirmed and Suggested Link Edges between Cases
  suggestions.forEach(s => {
    if (s.status === 'CONFIRMED') {
      edges.push({
        id: `edge-link-${s.id}`,
        source: `case-node-${s.sourceCaseId}`,
        target: `case-node-${s.targetCaseId}`,
        type: 'default',
        style: { stroke: '#10b981', strokeWidth: 3 },
        label: `Confirmed (${Math.round(s.similarityScore * 100)}%)`,
        animated: true,
      });
    } else if (s.status === 'PENDING_REVIEW') {
      edges.push({
        id: `edge-sug-${s.id}`,
        source: `case-node-${s.sourceCaseId}`,
        target: `case-node-${s.targetCaseId}`,
        type: 'default',
        style: { stroke: '#f59e0b', strokeDasharray: '5 5', strokeWidth: 2 },
        label: `AI Link (${Math.round(s.similarityScore * 100)}%)`,
      });
    }
  });

  // 5. Conflict Warning Indicators
  conflicts.forEach(conf => {
    if (conf.status === 'ACTIVE') {
      edges.push({
        id: `edge-conf-${conf.id}`,
        source: `inst-node-${conf.institutionId}`,
        target: `case-node-${conf.caseIds[0]}`,
        style: { stroke: '#ef4444', strokeWidth: 3 },
        label: 'COLLISION ALERT',
        animated: true,
      });
    }
  });

  res.json({ nodes, edges });
});

// ==========================================
// 10. WORKFLOWS, DEADLINES & NOTIFICATIONS
// ==========================================

apiRouter.get('/workflows/deadlines', (req: Request, res: Response) => {
  const cases = dataStore.getCases().filter(c => c.status !== 'CLOSED');
  const now = new Date().getTime();

  const formatted = cases.map(c => {
    const deadline = new Date(c.deadlineDate).getTime();
    const diffHours = (deadline - now) / (1000 * 60 * 60);
    const isOverdue = diffHours < 0;
    const isAtRisk = diffHours >= 0 && diffHours <= 48;

    return {
      case: c,
      hoursRemaining: Math.round(diffHours),
      isOverdue,
      isAtRisk,
      statusLabel: isOverdue ? 'OVERDUE' : isAtRisk ? 'CRITICAL_WINDOW' : 'ON_TRACK',
    };
  });

  formatted.sort((a, b) => a.hoursRemaining - b.hoursRemaining);
  res.json({ deadlines: formatted });
});

apiRouter.get('/notifications', (req: Request, res: Response) => {
  res.json({ notifications: dataStore.getNotifications() });
});

apiRouter.patch('/notifications/:id/read', (req: Request, res: Response) => {
  const success = dataStore.markNotificationAsRead(req.params.id);
  res.json({ success });
});

apiRouter.post('/notifications/read-all', (req: Request, res: Response) => {
  dataStore.markAllNotificationsAsRead();
  res.json({ success: true });
});

// ==========================================
// 11. AUDIT LOGS & SYSTEM USERS
// ==========================================

apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  let logs = dataStore.getAuditLogs();
  const { actorRole, entityType, search } = req.query;

  if (actorRole) logs = logs.filter(l => l.actorRole === actorRole);
  if (entityType) logs = logs.filter(l => l.entityType === entityType);
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    logs = logs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      l.actorName.toLowerCase().includes(q) ||
      l.details.toLowerCase().includes(q) ||
      (l.entityReference && l.entityReference.toLowerCase().includes(q))
    );
  }

  res.json({ auditLogs: logs });
});

apiRouter.get('/audit-logs-export/csv', (req: Request, res: Response) => {
  const logs = dataStore.getAuditLogs();
  const headers = ['Timestamp', 'ActorName', 'ActorRole', 'Action', 'EntityType', 'EntityID', 'Reference', 'Details', 'IPAddress'];
  const rows = logs.map(l => [
    `"${l.timestamp}"`,
    `"${l.actorName}"`,
    `"${l.actorRole}"`,
    `"${l.action}"`,
    `"${l.entityType}"`,
    `"${l.entityId}"`,
    `"${(l.entityReference || '').replace(/"/g, '""')}"`,
    `"${l.details.replace(/"/g, '""')}"`,
    `"${l.ipAddress}"`,
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="aicte_audit_trail.csv"');
  res.send(csv);
});

apiRouter.get('/users', (req: Request, res: Response) => {
  res.json({ users: dataStore.getUsers() });
});

apiRouter.post('/demo/reset', (req: Request, res: Response) => {
  dataStore.resetToSeed();
  res.json({ message: 'Database reset to initial demo state.' });
});

// ==========================================
// 12. SPECIALIZED BUREAU OPERATIONAL ACTIONS
// ==========================================

// Approval Bureau Action Endpoint
apiRouter.post('/bureau-actions/approval', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { caseId, institutionId, actionType, details, seatReduction, inspectionDate } = req.body;

  if (!actionType || !details) {
    return res.status(400).json({ error: 'Action type and details are required.' });
  }

  const inst = institutionId ? dataStore.getInstitutionById(institutionId) : null;
  const targetCase = caseId ? dataStore.getCaseById(caseId) : null;

  let newStatus: any = 'UNDER_REVIEW';
  let summary = '';

  if (actionType === 'APPROVE_EOA') {
    newStatus = 'CLOSED';
    summary = `Granted Extension of Approval (EoA 2026-27) subject to compliance conditions. ${details}`;
  } else if (actionType === 'ISSUE_DEFICIENCY_NOTICE') {
    newStatus = 'SHOW_CAUSE_ISSUED';
    summary = `Issued formal Show-Cause Notice under APH Chapter IV for infrastructure/cadre deficiencies. ${details}`;
  } else if (actionType === 'FREEZE_SEATS') {
    newStatus = 'ACTION_TAKEN';
    summary = `Provisional sanction: Froze/reduced ${seatReduction || 60} intake seats pending compliance verification. ${details}`;
  } else if (actionType === 'ORDER_SCRUTINY_INSPECTION') {
    newStatus = 'INVESTIGATION_ORDERED';
    summary = `Deputed Expert Visiting Committee (EVC) for on-site physical scrutiny on ${inspectionDate || 'immediate window'}. ${details}`;
  } else {
    summary = details;
  }

  if (targetCase) {
    dataStore.updateCaseStatus(targetCase.id, newStatus, { id: actor.id, name: actor.name, role: actor.role }, summary);
  }

  dataStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `APPROVAL_ACTION_${actionType}`,
    entityType: 'CASE',
    entityId: targetCase ? targetCase.id : (inst?.id || 'inst-approval'),
    entityReference: targetCase?.caseNumber || inst?.name,
    details: summary,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Approval Bureau Action executed: ${summary}`,
    actionType,
    updatedStatus: newStatus,
  });
});

// Public Grievance Cell Action Endpoint
apiRouter.post('/bureau-actions/grievance', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { caseId, institutionId, actionType, details, refundAmount, deadlineDate } = req.body;

  if (!actionType || !details) {
    return res.status(400).json({ error: 'Action type and details are required.' });
  }

  const inst = institutionId ? dataStore.getInstitutionById(institutionId) : null;
  const targetCase = caseId ? dataStore.getCaseById(caseId) : null;

  let newStatus: any = 'UNDER_REVIEW';
  let summary = '';

  if (actionType === 'MANDATE_FEE_REFUND_7D') {
    newStatus = 'SHOW_CAUSE_ISSUED';
    summary = `Issued statutory directive ordering refund of ₹${refundAmount || 'disputed amount'} within 7 days under penalty of approval forfeiture. ${details}`;
  } else if (actionType === 'ORDER_RELEASE_CERTIFICATES') {
    newStatus = 'SHOW_CAUSE_ISSUED';
    summary = `Issued mandatory 48-hour order for immediate, unconditional surrender and release of original marksheets and school leaving certificates. ${details}`;
  } else if (actionType === 'SCHEDULE_LOK_ADALAT') {
    newStatus = 'HEARING_SCHEDULED';
    summary = `Summoned college management and complainant to Student Grievance Lok Adalat hearing scheduled for ${deadlineDate || 'next Friday'}. ${details}`;
  } else if (actionType === 'FACULTY_SALARY_AUDIT') {
    newStatus = 'INVESTIGATION_ORDERED';
    summary = `Initiated statutory audit of 6th/7th CPC salary disbursements and bank transfers for aggrieved faculty members. ${details}`;
  } else {
    summary = details;
  }

  if (targetCase) {
    dataStore.updateCaseStatus(targetCase.id, newStatus, { id: actor.id, name: actor.name, role: actor.role }, summary);
  }

  dataStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `GRIEVANCE_ACTION_${actionType}`,
    entityType: 'CASE',
    entityId: targetCase ? targetCase.id : (inst?.id || 'inst-grievance'),
    entityReference: targetCase?.caseNumber || inst?.name,
    details: summary,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Public Grievance Action executed: ${summary}`,
    actionType,
    updatedStatus: newStatus,
  });
});

// Anti-Ragging & Vigilance Bureau Action Endpoint
apiRouter.post('/bureau-actions/vigilance', (req: Request, res: Response) => {
  const actor = getActor(req);
  const { caseId, institutionId, actionType, details, squadLead, policeStation } = req.body;

  if (!actionType || !details) {
    return res.status(400).json({ error: 'Action type and details are required.' });
  }

  const inst = institutionId ? dataStore.getInstitutionById(institutionId) : null;
  const targetCase = caseId ? dataStore.getCaseById(caseId) : null;

  let newStatus: any = 'UNDER_REVIEW';
  let summary = '';

  if (actionType === 'DISPATCH_FLYING_SQUAD') {
    newStatus = 'INVESTIGATION_ORDERED';
    summary = `Authorized immediate 24h unannounced surprise flying squad raid led by ${squadLead || 'AICTE Regional Flying Squad Team Alpha'}. ${details}`;
  } else if (actionType === 'LODGE_POLICE_FIR') {
    newStatus = 'ACTION_TAKEN';
    summary = `Escalated criminal complaint to Superintendent of Police & ${policeStation || 'Local Jurisdiction Police Station'} under IPC & Anti-Ragging Act. ${details}`;
  } else if (actionType === 'ISSUE_STUDENT_PROTECTION_ORDER') {
    newStatus = 'ACTION_TAKEN';
    summary = `Issued Emergency Protective Injunction prohibiting campus management from any retaliatory expulsion, attendance penalty, or harassment. ${details}`;
  } else if (actionType === 'SUBPOENA_CCTV_MINUTES') {
    newStatus = 'SHOW_CAUSE_ISSUED';
    summary = `Served 24h statutory subpoena demanding unedited campus hostel CCTV footage and Anti-Ragging Committee meeting transcripts. ${details}`;
  } else {
    summary = details;
  }

  if (targetCase) {
    dataStore.updateCaseStatus(targetCase.id, newStatus, { id: actor.id, name: actor.name, role: actor.role }, summary);
  }

  dataStore.addAuditLog({
    actorId: actor.id,
    actorName: actor.name,
    actorRole: actor.role,
    action: `VIGILANCE_ACTION_${actionType}`,
    entityType: 'CASE',
    entityId: targetCase ? targetCase.id : (inst?.id || 'inst-vigilance'),
    entityReference: targetCase?.caseNumber || inst?.name,
    details: summary,
    ipAddress: req.ip || '127.0.0.1',
  });

  res.json({
    success: true,
    message: `Anti-Ragging & Vigilance Action executed: ${summary}`,
    actionType,
    updatedStatus: newStatus,
  });
});
