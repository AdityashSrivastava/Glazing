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

## 🛡️ Security, Safety & Platform Integrity Architecture

Glazing is engineered with a strict **Zero-Trust Client Philosophy** and multi-layered defense-in-depth posture across the database, server infrastructure, and client interface. Competitive gamification integrity is protected against client tampering, arbitrary point escalation, and credential abuse.

```
                  ┌──────────────────────────────────────────────┐
                  │          ZERO-TRUST DEFENSE STACK            │
                  └──────────────────────┬───────────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
┌───────────────────────┐    ┌───────────────────────┐    ┌───────────────────────┐
│   DATABASE SHIELD     │    │    API & TRANSPORT    │    │    CLIENT FRONTIER    │
│ • Column Grants Lock  │    │ • Sanitized Envelopes │    │ • Safe URL Protocols  │
│ • RLS + WITH CHECK    │    │ • Whitelisted CORS    │    │ • Global HTML Escaping│
│ • Tamper Triggers     │    │ • Socket-Based Limits │    │ • Route Clearance     │
│ • Sandboxed Buckets   │    │ • Bounded LRU Cache   │    │ • Ephemeral Storage   │
└───────────────────────┘    └───────────────────────┘    └───────────────────────┘
```

### 1. Database Access Control & Column Privilege Locking
- **`public.users` Column Lock:** Direct `UPDATE` on sensitive attributes (`total_lifetime_points`, `current_streak`) is revoked from `authenticated` and `anon` roles. Operatives can only update their `display_name` and `avatar_url`.
- **`public.tasks` State & Point Shield:** Direct client mutation of `points_earned`, `actual_hours`, and `status` is revoked. Clients can only edit draft metadata (`title`, `is_private`, `estimated_hours`, `goal_id`).
- **`public.verdicts` Immutability:** Target operatives possess update privileges exclusively for the `acknowledged` boolean column. Disciplinary verdicts, docked points, and sanctions cannot be overwritten, downgraded, or deleted by offenders.
- **Strict Ownership Invariants (`WITH CHECK`):** All `INSERT` and `UPDATE` policies across `tasks`, `goals`, `verdicts`, and `operative_presence` enforce `WITH CHECK ((SELECT auth.uid()) = owner_id)` to prevent identity spoofing or resource reassignments.

### 2. PostgreSQL Tamper-Proof Triggers
- **`protect_user_fields()` Trigger:** Intercepts updates to `public.users`. If any non-service-role user attempts to alter `total_lifetime_points` or `current_streak`, the transaction is aborted with a PostgreSQL exception.
- **`protect_task_points()` Trigger:** Intercepts mutations on `public.tasks`. Rejects any non-service-role attempt to modify `points_earned`, mark tasks as `COMPLETED` without backend heuristic verification, or revert completed tasks.

### 3. Client-Side Sanitization & Stored XSS Neutralization
- **Strict URL Scheme Validation (`safeUrl`):** All user-provided proof URLs and screenshot links rendered in activity feeds or the Overseer Cockpit (`#/bombastic`) are filtered through `safeUrl()`, discarding `javascript:`, `data:text/html`, or pseudo-protocols.
- **Global Context Escaping (`escapeHtml`):** Dynamic user strings (titles, reasons, operative names) are systematically escaped before DOM injection across tooltips, toasts, cards, and modal dialogs.

### 4. Storage Bucket Sandboxing (`proof_uploads`)
- **Folder-Level User Scoping:** Upload policies restrict file paths to the operative's UID directory: `(storage.foldername(name))[1] = (SELECT auth.uid())::TEXT`.
- **Binary Signature & Extension Whitelisting:** Client uploads require image extensions (`.png`, `.jpg`, `.jpeg`, `.webp`), while the FastAPI `/api/tasks/upload-proof` endpoint validates magic byte signatures (`\x89PNG`, `\xff\xd8\xff`, `RIFF...WEBP`) to block polyglot and executable uploads.

### 5. Backend Infrastructure & API Hygiene
- **Sanitized Error Envelopes:** Global 500 exception handlers suppress raw stack traces, SQL errors, and filesystem paths, serving clean `{"detail": "An internal server error occurred. Telemetry logged."}` responses.
- **Origin-Enforced CORS:** Eliminates wildcard reflection with credentials (`Access-Control-Allow-Credentials: true`). Only verified frontends (`localhost`, `127.0.0.1`, `glazing-lac.vercel.app`) receive valid CORS headers.
- **Socket-Based Rate Limiting:** Disables raw trust in spoofable `X-Forwarded-For` headers, deriving client identities directly from verified socket hosts (`request.client.host`) to prevent brute-force rotation.
- **Bounded LRU Token Cache:** Replaced unbounded authentication dictionaries with an LRU `OrderedDict` (`MAX_TOKEN_CACHE_ENTRIES = 2000`) to guarantee resilience against memory exhaustion DoS attacks.

### 6. Security Patch & Migration Script
A standalone, idempotent migration script is maintained in [`project_files/security_patch.sql`](project_files/security_patch.sql) to apply all SQL privileges, RLS policies, and triggers with zero downtime.

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
