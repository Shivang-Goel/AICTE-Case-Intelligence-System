# CaseSetu (केस सेतु) — AICTE Institution-Centric Case Intelligence
**Problem Statement:** SIH26264 | Smart India Hackathon (SIH) 2026  
**Core Tagline:** Connect Cases. Detect Risks. Prioritize Action.

---

## 1. Executive Summary & Purpose

**CaseSetu** ("Bridge for Cases") addresses a critical statutory challenge across technical education regulation: multiple independent bureaus within the All India Council for Technical Education (Approval Bureau, Public Grievance Cell, Anti-Ragging Monitoring Cell, and Vigilance Bureau) frequently process uncoordinated, isolated complaints regarding the same technical campus.

Without unified cross-bureau intelligence, this fragmentation results in:
1. **Contradictory Rulings:** E.g., Approval Bureau granting Extension of Approval (EoA) or additional intake while Vigilance is probing forged faculty records or Anti-Ragging has lodged a police FIR.
2. **Duplicate Administrative Burden:** Simultaneous redundant inspections without unified context.
3. **Delayed Life/Safety Interventions:** High-urgency student safety/ragging allegations lost in generic inquiry queues.

**CaseSetu** provides an **AICTE Permanent ID-centric intelligence bridge** that semantically clusters complaints, detects cross-bureau contradictions in real time, executes explainable rule-based severity triage, and visualizes the institutional syndicate relationship network.

---

## 2. Key Capabilities & Implemented Modules

1. **Role-Tailored Operational Desks:**
   - **Student & Citizen Portal (`student` / `demo123`):** Confidential complaint lodging, anti-ragging emergency SOS, tracking tokens (`AICTE-GRV-2026-XXXX`), and statutory fee refund / document retention protections.
   - **Approval Bureau Desk (`approval` / `demo123`):** Extension of Approval (EoA) scrutiny, faculty-student cadre ratios (1:15 / 1:20), built-up area compliance, and seat reduction sanctions.
   - **Public Grievance Desk (`grievance` / `demo123`):** 7-day fee refund orders, 48-hour return of withheld marksheet certificates, and Lok Adalat digital dispute hearings.
   - **Anti-Ragging & Vigilance War Room (`vigilance` / `demo123`):** 24-hour zero-tolerance protocol, surprise flying squad deployments, and police FIR referrals.
   - **AI Reviewer & Ombudsman Docket (`reviewer` / `demo123`):** High-confidence semantic linking adjudication, contradiction mediation, and cluster binding.
   - **Apex Executive Board Desk (`executive` / `demo123`):** Macro national risk telemetry, multi-bureau repeat offender heatmap, and statutory SLA compliance tracking.
   - **Council Central Intelligence (`admin` / `demo123`):** Unrestricted council-wide oversight across all 7 desks, audit trail, and user management.

2. **AI Semantic Case Linking Engine:**
   - Sentence Transformers / TF-IDF Vector cosine similarity + exact Permanent ID matching + category weighting + temporal proximity.
   - Reviewers can confirm or reject links with 1-click and audit logging.

3. **Cross-Bureau Conflict Prevention Centre:**
   - Automated collision detection across active bureaus handling the same institution, providing actionable inter-bureau coordination directives.

4. **Severity & Urgency Triage Queue:**
   - Life and student safety allegations (ragging, violence) are deterministically escalated to CRITICAL priority with 24–48h statutory inquiry targets, distinct from sentiment analysis.

5. **Interactive Relationship Graph (@xyflow/react):**
   - Topological network visualizing Institutions, Cases, Bureaus, confirmed links, suggested relationships, and conflict collision vectors with zoom/pan and node inspection.

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, React Router v7, Recharts, @xyflow/react (React Flow), Lucide React.
- **Backend & API:** Node.js / Express with TypeScript (integrated full-stack on port 3000 + Vercel serverless function under `/api/index.ts`) + Python 3.12 FastAPI microservice under `/backend`.
- **Database & Storage:** PostgreSQL 16 schema (`backend/models.py`) with persistent transactional store and append-only audit logging.
- **Deployment Ready:** Vercel (zero-config with `vercel.json` and `/api/index.ts`), Docker, Docker Compose.

---

## 4. Deployment Instructions

### Option A: Deploy on Vercel (Recommended for Cloud Hosting)

CaseSetu is 100% pre-configured for Vercel deployment with serverless backend APIs:

1. **Push repository to GitHub / GitLab:**
   ```bash
   git init
   git add .
   git commit -m "Initial CaseSetu commit"
   git push origin main
   ```
2. **Import into Vercel:**
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your CaseSetu Git repository.
   - Framework Preset: **Vite** (auto-detected via `vercel.json`).
   - Build Command: `npm run build` (auto-detected).
   - Output Directory: `dist` (auto-detected).
   - Click **Deploy**.
3. **Done!**
   - Both the React frontend and all 25+ `/api/v1/*` REST API endpoints run serverless on Vercel automatically via `/api/index.ts`.

---

### Option B: Direct Local Full-Stack Launch (Port 3000)

Runs the unified full-stack application (Express REST backend + Vite frontend):

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Visit: **http://localhost:3000** (or your preview URL)

---

### Option C: Docker Compose (Full Container Stack)

Launches PostgreSQL 16 with pgvector + FastAPI Backend + Frontend:

```bash
docker compose up --build
```

- **Frontend Application:** http://localhost:3000
- **FastAPI Backend:** http://localhost:8000
- **FastAPI Interactive Docs:** http://localhost:8000/docs
- **PostgreSQL Database:** localhost:5432 (db: `aicte_case_db`, user: `aicte_user`)

---

## 5. Quick Demo Credentials & Logins

Password for all accounts: **`demo123`**

| Role / Authority | Username | Default Desk | Core Jurisdiction |
|---|---|---|---|
| **Student / Citizen** | `student` | Student Portal | File grievances, track status via token |
| **Approval Bureau Officer** | `approval` | Approval Bureau | EoA, seat capacity, faculty-cadre norms |
| **Public Grievance Officer** | `grievance` | Grievance Cell | 7-day fee refunds, marksheet releases |
| **Anti-Ragging / Vigilance** | `vigilance` | Vigilance War Room | 24h zero-tolerance, flying squads, FIRs |
| **AI Reviewer / Ombudsman** | `reviewer` | AI Reviewer Docket | Neural case linking, conflict mediation |
| **Apex Executive Board** | `executive` | Board Telemetry | Macro national KPIs, repeat offender watchlist |
| **Council Administrator** | `admin` | Council Central Intel | Master switch to all 7 desks & audit trail |

---

## 6. Real Institutions in Seed Dataset

The platform includes detailed AICTE-approved institutions including:
1. **G.L. Bajaj Institute of Technology and Management** (`AICTE-1-4648711`, Greater Noida)
2. **G.L. Bajaj Institute of Management and Research (GLBIMR)** (`AICTE-1-1378121`, Greater Noida)
3. **G.L. Bajaj Institute of Medical Sciences & Research** (`AICTE-1-3982104`, Mathura)
4. **G.L. Bajaj Institute of Law** (`AICTE-1-4920198`, Greater Noida)

---

## 7. Disclaimer
This application is a functional prototype built for Smart India Hackathon (SIH 2026) Problem Statement SIH26264. All institution records, complaint narratives, and officer credentials in the demo dataset are configured for statutory evaluation purposes.
