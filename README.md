# ⚡ Glazing

**Glazing** is a competitive, gamified accountability and productivity matrix designed for high-performing squads. It turns daily execution into a competitive sport using transparent telemetry, verifiable proof of work, peer pressure, and authoritative squad discipline.

---

### 🚀 Key Features

- **5-Domain Competency Matrix:** Tracks progress across **DSA**, **Development**, **College Studies**, **Gym**, and **Life** with interactive Skill Matrix Radar charts.
- **Precision Scoring Engine:** Domain-weighted points for hours logged (DSA 15 pts/hr, Dev 12.5 pts/hr, College 10 pts/hr, Life 5 pts/hr), completion bonuses, and accuracy rewards for matching estimated time.
- **P2P Staking & Bounties:** Stake earned points to challenge peers on critical deliverables before midnight IST.
- **Live Focus Telemetry:** Real-time squad activity feed with deep-focus status indicators and heartbeat presence tracking.
- **Classified Directives:** Privacy toggle to mask sensitive task titles in public feeds while keeping leaderboard verification intact.
- **Midnight IST Leaderboards:** Automated daily and weekly rankings with historical snapshot preservation and penalty tracking for the bottom ranks.

---

### ⚖️ Misterbombastic: The Covert Overseer

> *Mr. Boombastic is the supreme, covert overseer of Glazing who surveils operative activity from the shadows to ensure uncompromising squad integrity.*  
> *He wields irrevocable judicial authority to audit unmasked directives, dock fraudulent hours, and issue public disciplinary sanctions when standards are breached.*

#### Overseer Capabilities & Sanctions:
1. **Unmasked Surveillance:** Access to all squad directives (unmasking even classified data) and real-time operative heartbeat indicators.
2. **Authoritative Judicial Sanctions:**
   - **Void Task & Void Points (`REJECT_TASK`):** Disqualifies fabricated tasks and docks all points earned.
   - **Audit Title & Dock Hours (`REWRITE_TASK`):** Re-calibrates exaggerated work logs and docks point deltas.
   - **Forced Revert to Pending (`REVERT_PENDING`):** Strips completion credit for substandard work and forces redos.
   - **Revoke Gym Check-in (`REVOKE_GYM`):** Docks daily gym points (-5 pts) for false or recycled workout proofs.
3. **Squad-Wide Realtime Broadcast:** Broadcasts judgments via the `squad-verdicts` channel to all active operatives with transparent badge icons and 30-second self-clearing accountability feeds.

---

### 🛠️ Tech Stack

- **Frontend:** TypeScript, Vite, Modern CSS / Tailwind tokens, Chart.js
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security, Realtime Channels)
- **Deployment & Hosting:** Vercel (Frontend), Render (Backend)

---

### ⚡ Live Telemetry & Low-Latency Architecture (Render Keepalive)

To prevent cold-start delays on Render's free tier (which spins down web services after 15 minutes of inactivity, causing 50–90 second latency spikes on live squad telemetry), a multi-layer keepalive strategy was implemented:

1. **Dedicated Zero-Overhead Health Route (`/health` & `/api/health`):**
   - FastAPI exposes lightweight health endpoints in [`backend/app/main.py`](backend/app/main.py) that return an immediate `200 OK` (`{"status": "online"}`) without touching database connections or executing ORM queries.

2. **Automated External Cron Monitor:**
   - Configured an external keepalive cronjob via [cron-job.org](https://cron-job.org) pinging `https://glazing.onrender.com/health` every **10 minutes** (`*/10 * * * *`).
   - This ensures the 15-minute inactivity idle window is never reached, keeping Uvicorn and FastAPI warm 24/7 with instant (~50–100ms) telemetry responses.
   - Operates fully within Render's free quota (750 free instance hours per month vs. 744 hours in a 31-day month).

3. **Client-Side Non-Blocking Warmup & Dual-Engine Failover:**
   - On initial bundle load, the client executes a background `warmupBackend()` call with `keepalive: true` to verify connectivity without blocking UI hydration or cached feed rendering.
   - If the backend is updating or deploying, all critical mutations (task completion, gym check-ins, and overseer sanctions) seamlessly execute direct Supabase PostgreSQL fallbacks with zero user downtime.
