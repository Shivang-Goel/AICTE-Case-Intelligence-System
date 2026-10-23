# AICTE Institution-Centric Case Intelligence & Cross-Bureau Conflict Prevention System
**Problem Statement:** SIH26264 | Smart India Hackathon (SIH) 2026  
**Core Tagline:** Connect Cases. Detect Risks. Prioritize Action.

---

## 1. Executive Summary & Purpose

The **AICTE Case Intelligence Platform** addresses a critical operational challenge across technical education regulation: multiple independent statutory bureaus (Approval Bureau, Public Grievance Cell, Anti-Ragging Monitoring Cell, Vigilance Bureau, Legal Cell) often process uncoordinated complaints regarding the same technical institution. 

Without institutional intelligence, this fragmentation results in:
1. **Uncoordinated Contradictory Actions:** E.g., Approval Bureau granting Extension of Approval (EoA) while Vigilance is probing forged fire safety certificates.
2. **Duplicate Administrative Burden:** Simultaneous redundant inspections without unified context.
3. **Delayed Life/Safety Interventions:** High-urgency student safety/ragging allegations lost in generic inquiry queues.

This solution provides a **Permanent ID-centric intelligence hub** that semantically clusters complaints, detects cross-bureau conflicts, executes explainable rule-based severity triage, and visualizes the institutional relationship graph.

---

## 2. Key Capabilities & Implemented Modules

1. **Executive Intelligence Dashboard:** Live KPIs, bureau workload radar, intake vs disposal velocity, regional concentration, and real-time cross-bureau conflict warnings.
2. **Centralized Complaint Registry:** End-to-end CRUD, multi-criteria filtering, sorting, pagination, and real CSV data export.
3. **Complaint Intake with Real-Time AI Pre-Check:** Live severity estimation, safety keyword flagging, and duplicate detection prior to formal submission.
4. **Complaint Dossier & Chronological Action Timeline:** Status transitions, bureau transfers with recorded reasons, officer reassignments, action comments, and audit logging.
5. **Institution 360° Profile:** Holistic view of every technical campus by AICTE Permanent ID, combining historical complaints, open conflicts, risk index, and accreditation details.
6. **AI Semantic Case Linking Engine:** Hybrid TF-IDF vector similarity + exact Permanent ID matching + category weighting + temporal proximity with natural language rationales. Reviewers can confirm or reject links with audit trails.
7. **Cross-Bureau Conflict Prevention Centre:** Automated collision detection across active bureaus handling the same institution, providing actionable inter-bureau coordination directives.
8. **Severity & Urgency Triage Queue:** Life/Student safety allegations (ragging, violence, fire safety) are deterministically escalated to CRITICAL priority with 24–48h statutory inquiry targets, distinct from sentiment. Includes authorized officer override capabilities.
9. **Interactive Relationship Graph (React Flow):** Graphical topological network visualizing Institutions, Cases, Bureaus, confirmed links, suggested relationships, and conflict collision vectors with zoom/pan and node inspection.
10. **SLA Deadlines & Workflow Accountability:** Tracks hours remaining, identifies at-risk inquiries (< 48h), flags overdue compliance, and logs bureau transfer histories.
11. **Immutable Audit Trail:** Append-only log recording actor, timestamp, action type, before/after states, entity references, and IP addresses.
12. **Guided SIH 2026 Walkthrough Stepper:** Interactive modal walking judges/evaluators through the complete 12-step official demonstration scenario.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, React Router, Recharts, @xyflow/react (React Flow), Lucide React.
- **Backend & API:** Node.js / Express with TypeScript (integrated full-stack on port 3000) + Python FastAPI microservice architecture under `/backend`.
- **Database & Storage:** PostgreSQL 16 schema + persistent transactional store with transactional atomicity and full audit logging.
- **AI / NLP Intelligence:** Hybrid TF-IDF and token-space cosine similarity with deterministic heuristic fallback and rule-based urgency triage.
- **Orchestration:** Docker, Docker Compose, multi-stage Dockerfiles.

---

## 4. Quick Startup Instructions

### Option A: Direct Local Full-Stack Launch (Port 3000)
Runs the unified full-stack application (Express REST backend + Vite frontend):

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Visit: **http://localhost:3000** (or preview URL in AI Studio)

### Option B: Docker Compose (Full Container Stack)
Launches PostgreSQL 16 with pgvector + FastAPI Backend + Frontend:

```bash
docker compose up --build
```

- **Frontend Application:** http://localhost:3000 (or http://localhost:5173)
- **FastAPI Backend:** http://localhost:8000
- **FastAPI Swagger Docs:** http://localhost:8000/docs
- **PostgreSQL Database:** localhost:5432 (db: `aicte_case_db`, user: `aicte_user`)

---

## 5. Demo Login Credentials & Roles

| Role | Demo Email | Password | Persona & Authority |
|---|---|---|---|
| **Administrator** | `admin@aicte-india.org` | `admin123` | Dr. Arvind Sharma — Chief Regulatory Officer (Full clearance) |
| **Bureau Officer** | `officer.ab@aicte-india.org` | `officer123` | Priya Ramanathan — Senior Approval Officer (Workflow & Transfers) |
| **Reviewer** | `reviewer@aicte-india.org` | `reviewer123` | Rajesh Deshmukh — Lead Reviewer (AI Link Confirm/Reject & Severity) |
| **Read-Only Management** | `management@aicte-india.org` | `mgmt123` | Sunita Verma — Executive Board Member (Read-only analytics) |

*Note: You can switch between roles instantly using the top navigation Role Switcher dropdown to test RBAC restrictions.*

---

## 6. Official SIH Demonstration Scenario (12 Steps)

1. **Role-Based Login:** Open application as Administrator or Bureau Officer.
2. **Dashboard Overview:** Review live KPIs, bureau distribution, and active conflict alerts.
3. **Institution 360° Profile:** Navigate to **Apex Institute of Advanced Technology & Research** (`AICTE-1-49281729`) to see multi-bureau cases.
4. **Complaint Intake:** Open `/intake`, type a complaint (e.g., student ragging or unapproved seats), and observe the real-time AI Pre-Triage card.
5. **AI Semantic Matching:** Open `/linking` to inspect explainable TF-IDF match scores, keyword evidence, and rationales.
6. **Cross-Bureau Conflict Prevention:** Open `/conflicts` to observe the three-way collision between Approval, Vigilance, and Anti-Ragging bureaus on Apex Institute.
7. **Severity Queue:** Open `/severity` to verify student life/safety complaints deterministically marked CRITICAL.
8. **Review AI Match:** Confirm or reject a candidate case link; verify link reflects in the dossier.
9. **Case Action Timeline:** Open Case `AICTE-2026-ARMC-0012`, transition status to `INVESTIGATION_ORDERED`, and add an action note.
10. **Interactive Graph:** Open `/graph` to explore the visual knowledge network with pan, zoom, and node details.
11. **Analytics & Export:** Open `/analytics`, inspect disposal trends, and download the full CSV export.
12. **Audit Trail Verification:** Open `/audit-logs` to confirm every action taken was permanently recorded with timestamp and actor identity.

---

## 7. Disclaimer
This application is a functional prototype built for Smart India Hackathon (SIH 2026) Problem Statement SIH26264. All institution names, complaint texts, and officer identities in the demonstration dataset are synthetic and created solely for regulatory evaluation purposes.
