# ⚡ Glazing

**Glazing** is a competitive, gamified accountability and productivity matrix designed for high-performing squads. It turns daily execution into a competitive sport using transparent telemetry, verifiable proof of work, and peer pressure.

---

### 🚀 Key Features

- **5-Domain Competency Matrix:** Tracks progress across **DSA**, **Development**, **College Studies**, **Gym**, and **Life** with interactive Skill Matrix Radar charts.
- **Precision Scoring Engine:** Base points for hours logged, completion bonuses, and accuracy rewards for matching estimated time.
- **P2P Staking & Bounties:** Stake earned points to challenge peers on critical deliverables before midnight.
- **Live Focus Telemetry:** Real-time squad activity feed with deep-focus status indicators.
- **Classified Directives:** Privacy toggle to mask sensitive task titles while keeping leaderboard verification intact.
- **Midnight IST Leaderboards:** Automated daily and weekly rankings with historical snapshot preservation.

---

### 🛠️ Tech Stack

- **Frontend:** TypeScript, Vite, Modern CSS / Tailwind tokens, Chart.js
- **Backend:** Python, FastAPI, Uvicorn, Pydantic
- **Database & Auth:** Supabase (PostgreSQL with Row-Level Security)
- **Deployment & Hosting:** Vercel (Frontend), Render (Backend)

---

### ⚡ Live Telemetry & Low-Latency Architecture (Render Keepalive)

To prevent cold-start delays on Render's free tier (which spins down web services after 15 minutes of inactivity, causing 50–90 second latency spikes on live squad telemetry), a multi-layer keepalive strategy was implemented:

1. **Dedicated Zero-Overhead Health Route (`/health` & `/api/health`):**
   - FastAPI exposes lightweight health endpoints in [`backend/app/main.py`](file:///e:/Glazing/backend/app/main.py) that return an immediate `200 OK` (`{"status": "online"}`) without touching database connections or executing ORM queries.

2. **Automated External Cron Monitor:**
   - Configured an external keepalive cronjob via [cron-job.org](https://cron-job.org) pinging `https://glazing.onrender.com/health` every **10 minutes** (`*/10 * * * *`).
   - This ensures the 15-minute inactivity idle window is never reached, keeping Uvicorn and FastAPI warm 24/7 with instant (~50–100ms) telemetry responses.
   - Operates fully within Render's free quota (750 free instance hours per month vs. 744 hours in a 31-day month).

3. **Client-Side Non-Blocking Warmup:**
   - On initial bundle load, the client executes a background [`warmupBackend()`](file:///e:/Glazing/frontend/src/api.ts#L7) call with `keepalive: true` to verify connectivity without blocking UI hydration or cached feed rendering.

