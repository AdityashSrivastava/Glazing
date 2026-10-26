# ⚡ Glazing

**Glazing** is a competitive, gamified accountability and productivity matrix engineered for high-performing squads. It turns daily execution into a transparent competitive sport using verifiable proof of work, peer-to-peer staking, live operative telemetry, and authoritative squad discipline.

---

## 🚀 Core Systems & Features

### 1. 5-Domain Competency Matrix
Operatives balance execution across five core domains, visualized through interactive Skill Matrix Radar charts:
- **DSA (Data Structures & Algorithms):** Highest intensity domain ($15\text{ pts/hr}$).
- **Development:** Software engineering, full-stack, and infrastructure ($12.5\text{ pts/hr}$).
- **College Studies / Academics:** Coursework and academic requirements ($10\text{ pts/hr}$).
- **Gym & Physical Conditioning:** Daily health habit with streak multipliers ($5\text{ pts}$ check-in bonus).
- **Life & Personal Execution:** General operational commitments ($5\text{ pts/hr}$).

### 2. Precision Scoring & Verification Engine
- **Base Points:** Weighted domain rates multiplied by actual hours logged.
- **Proof-of-Work Verification:** Automated heuristic proof inspector verifying GitHub pull requests, LeetCode submissions, and photo uploads.
- **Accuracy Incentives:** Additional points awarded for accurate estimation vs. actual completion time.
- **Midnight IST Reset:** Daily leaderboards capture historical snapshots at 23:59:59 IST.

### 3. P2P Bounties & Peer Staking
- Operatives can stake earned points from their personal vault to challenge squad peers on specific high-stakes directives.
- If the target operative completes the directive with valid proof before midnight IST, they win the staked bounty; otherwise, the bounty is returned or redistributed.

### 4. Daily Gym Checkpoint & Physical Streak Engine
- Dedicated daily gym check-in modal requiring authentic visual proof.
- Rewards an immediate $+5\text{ PTS}$ vault credit with an escalating daily streak tracker.

### 5. Weekly Paneer Patties Party Mandate
- At the conclusion of every weekly sprint (Sunday midnight IST), Glazing identifies the **Weekly Champion** (Rank 1).
- By sovereign squad law, the bottom two performers (**Rank 4 and Rank 5**) are mandated to sponsor a *Paneer Patties Party* for the champion.

### 6. Live Focus Telemetry & Presence Tracking
- Real-time squad activity feed with deep-focus badges.
- Bi-directional heartbeat monitoring displaying live route presence and active status.

### 7. Classified Directives
- Privacy toggle allowing operatives to encrypt sensitive task titles in public feeds while preserving underlying leaderboard score verification.

---

## ⚖️ Misterbombastic: Covert Overseer & Discipline Protocol

> *Mr. Boombastic is the supreme, covert overseer of Glazing who surveils operative activity from the shadows to ensure uncompromising squad integrity.*  
> *He wields irrevocable judicial authority to audit unmasked directives, dock fraudulent hours, and issue public disciplinary sanctions when standards are breached.*

```
                ┌───────────────────────────────────────┐
                │        MISTERBOMBASTIC COCKPIT        │
                │        [ Covert Route: #/bombastic ]   │
                └──────────────────┬────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     [Unmasked Telemetry]  [Heartbeat Presence]  [Judicial Sanctions]
              │                    │                    │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
             ┌──────────────────────────────────────────────┐
             │         Dual-Engine Execution & Fallback      │
             │   (FastAPI Backend ──► Direct Supabase RLS)   │
             └─────────────────────┬────────────────────────┘
                                   │
                                   ▼
             ┌──────────────────────────────────────────────┐
             │    Realtime Broadcast (squad-verdicts)       │
             │  • Squad-Wide Ambient Disciplinary Popup     │
             │  • 30s Countdown Auto-Clearing Feed Banner   │
             └──────────────────────────────────────────────┘
```

### Overseer Capabilities:
1. **Unmasked Surveillance:** Unrestricted covert audit access. Classified tasks and hidden proof links are fully unmasked for the Overseer.
2. **Authoritative Judicial Sanctions:**
   - **Void Task & Strip Points (`REJECT_TASK`):** Disqualifies fraudulent tasks and deducts all points earned.
   - **Audit Title & Dock Hours (`REWRITE_TASK`):** Recalibrates exaggerated hours and immediately docks point deltas.
   - **Forced Revert to Pending (`REVERT_PENDING`):** Strips completion credit for substandard work and forces genuine re-dos.
   - **Revoke Gym Check-in (`REVOKE_GYM`):** Docks daily gym points ($-5\text{ PTS}$) for recycled or false workout selfies.
3. **Impeccable Disciplinary Modal:**
   - Broadcasts live to connected operatives via Supabase Realtime channel `squad-verdicts`.
   - Displays the **Penalized Operative**, sanction badge, exact deducted points, and the Overseer's written rationale.
   - Equipped with an ambient rose aura spotlight, floating particle physics, and a **30-second auto-acknowledgment countdown**.
4. **Target-Exclusive Activity Feed Self-Clear:**
   - Disciplinary cards in the squad activity feed appear exclusively for the penalized operative and automatically clear from the feed after 30 seconds.

---

## ⚙️ Architectural Highlights & Resilience

### 1. Dual-Engine Failover Architecture
- All critical mutations (verdicts, gym check-ins, task completions) utilize a primary FastAPI backend route with an automatic direct Supabase PostgreSQL client fallback.
- If the backend is cold-starting or updating, operations execute directly against Supabase RLS without user-facing errors.

### 2. Render Keepalive Protocol
To eliminate cold-start delays on free-tier infrastructure:
1. **Dedicated Zero-Overhead Health Endpoint (`/health` & `/api/health`):** Returns an immediate `200 OK` (`{"status": "online"}`) without touching database connections.
2. **Automated External Cron Monitor:** Configured via [cron-job.org](https://cron-job.org) to ping `/health` every 10 minutes (`*/10 * * * *`), keeping Uvicorn and FastAPI warm 24/7.
3. **Client-Side Non-Blocking Warmup:** On initial bundle load, the client executes a background `warmupBackend()` with `keepalive: true`.

---

## 🛡️ Security, Privacy & Integrity Standards

Glazing implements an enterprise-grade, multi-layered security model engineered to preserve competitive integrity, prevent score tampering, and safeguard squad telemetry.

```
                  ┌──────────────────────────────────────────────┐
                  │       ENTERPRISE ZERO-TRUST ARCHITECTURE     │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│    DATABASE SHIELD    │    │  API & GATEWAY GUARD  │    │  INTERFACE INTEGRITY  │
│ • Row-Level Security  │    │ • Origin-Locked CORS  │    │ • Safe Protocol Guard │
│ • Column Write-Locks  │    │ • Brute-Force Defense │    │ • Universal Escaping  │
│ • Tamper Triggers     │    │ • Sanitized Envelopes │    │ • Sandboxed Storage   │
│ • ACID Vault Locks    │    │ • Bounded Auth Cache  │    │ • Isolated Namespaces │
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

### 1. Authoritative Server-Side Gamification (Zero-Trust)
- **Authoritative Scoring:** Point computations, hourly domain calculations, bonus distributions, and streak increments execute exclusively on the authoritative backend. Direct client requests can never declare points or self-award achievements.
- **ACID Vault Transactions:** Staking, bounties, and disciplinary point docks utilize atomic PostgreSQL routines to eliminate TOCTOU (Time-of-Check to Time-of-Use) race conditions and prevent double-spending.

### 2. Deep Database Defense & Tamper-Proof Triggers
- **Strict Row-Level Security (RLS):** Every database entity is isolated behind strict identity verification policies. Operatives can only access data belonging to their clearance level or squad domain.
- **Column-Level Privilege Hardening:** Write privileges on competitive metrics (vault balances, historical standings, task statuses) are revoked from client roles, preventing direct REST API tampering.
- **Active Integrity Triggers:** Deep PostgreSQL triggers proactively inspect state transitions and instantaneously reject unauthorized mutations, ensuring audit logs and leaderboards remain completely immutable.

### 3. Client Sandboxing & Content Sanitization
- **Strict Protocol Filtering:** All external links, pull request URLs, and proof attachments pass through strict URI protocol validators before rendering, neutralizing malicious script execution or pseudo-protocol exploits.
- **Universal DOM Escaping:** Dynamic text across feeds, leaderboards, toasts, and popups undergoes context-aware HTML sanitization to prevent injection vulnerabilities.
- **Classified Directive Privacy:** Sensitive task titles marked as classified are cryptographically masked in public telemetry streams, exposing details only to the operative and authorized overseer.

### 4. Hardened Storage & Asset Verification
- **Isolated User Namespaces:** Proof screenshots and workout uploads are sandboxed into user-isolated storage partitions with strict identity ownership boundaries.
- **Binary Signature Inspection:** Incoming proof assets undergo server-side magic-byte validation and strict MIME-type verification to reject non-image or executable payloads.

### 5. API Gateway & Transport Hardening
- **Strict Origin-Locked CORS:** Cross-Origin Resource Sharing is locked strictly to declared production and development domains, preventing cross-site request forgery and unauthorized external access.
- **Adaptive Rate Limiting & Abuse Prevention:** Authentication and password endpoints feature dual-layer socket-level rate limiting to defend against brute-force attacks and automated credential stuffing.
- **Zero-Leak Error Envelopes:** System error boundaries catch unhandled exceptions and return structured, sanitized status codes without revealing internal directory paths, database queries, or server internals.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | TypeScript, Vite, Tailwind CSS v4 / PostCSS, Chart.js |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| **Database & Auth** | Supabase PostgreSQL, GoTrue Auth, Row-Level Security (RLS) |
| **Realtime** | Supabase Realtime Broadcast & Presence Channels |
| **Hosting & CI/CD** | Vercel (Frontend), Render (Backend), GitHub Actions |

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js:** v18.0.0 or higher
- **Python:** v3.11 or higher
- **Supabase Account:** Project URL and public anon key

### 1. Clone the Repository
```bash
git clone https://github.com/AdityashSrivastava/Glazing.git
cd Glazing
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-service-or-anon-key
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Run the backend server:
```bash
uvicorn app.main:app --port 8000 --reload
```
API runs at **http://localhost:8000** (Health check: **http://localhost:8000/health**).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:8000/api
```

Start the Vite development server:
```bash
npm run dev
```
Client runs at **http://localhost:5173**.

---

## 🗄️ Database Schema Overview

The database is built on Supabase PostgreSQL with strict Row-Level Security:

- `public.users`: Operative profiles, lifetime points, current streaks.
- `public.goals`: High-level domain objectives.
- `public.tasks`: Daily execution directives, proof URLs, points earned, status.
- `public.bounties`: Peer-to-peer staked point challenges.
- `public.operative_presence`: Realtime heartbeat and route telemetry.
- `public.verdicts`: Overseer audit judgments, points docked, and acknowledgment states.

*Full database migration script is maintained in [`project_files/supabase_setup.sql`](project_files/supabase_setup.sql).*
