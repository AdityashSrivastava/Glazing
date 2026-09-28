# ⚡ Glazing — High-Stakes Gamified Accountability & Productivity Matrix

**Glazing** is a hyper-competitive, full-stack accountability platform designed to turn daily execution into a high-stakes competitive sport. Built for ambitious operators, Glazing weaponizes peer pressure, transparent execution telemetry, and verifiable proof-of-work to eliminate procrastination and cultivate peak operational discipline.

---

### 🚀 Key Features

* **5-Domain Competency Engine:** Daily tasks and macro objectives funnel points directly into 5 core domains — **DSA**, **Development**, **College Studies**, **Gym**, and **Life** — visualized via real-time interactive Skill Spectrum Radar charts.
* **Precision Execution & Sniper Scoring:** Tasks require upfront time estimation and verifiable proof uploads upon completion. Earn base points, completion bounties, and sniper bonuses for accurate time-estimation.
* **P2P Staking & Bounty Hunt:** Put points on the line. Operatives can stake their hard-earned points to challenge peers on critical deliverables. Finish before midnight to seize the bounty, or forfeit points on failure.
* **Live Focus Telemetry & Tactical Feed:** Broadcast active deep-focus sessions with real-time status pulses and network-wide achievement alerts.
* **Classified Directives (Privacy Masking):** Toggle sensitive tasks into private mode. Log hours and earn points transparently on the leaderboard while concealing task titles and proof from peers.
* **Dynamic Leaderboards & Midnight Snapshots:** Live daily and weekly leaderboards automatically capture immutable database snapshots and reset at midnight IST, establishing a clean slate every morning.

---

### 🛠️ Tech Stack

* **Frontend:** TypeScript, Vite, Modern CSS / Tailwind UI design tokens, Chart.js radar visualizations.
* **Backend:** Python, FastAPI, Pydantic schemas, Uvicorn asynchronous server.
* **Data & Auth:** Supabase (PostgreSQL with Row-Level Security, Database Triggers, and Storage).

---

### 🌐 Quick Deployment Overview

1. **Database:** Run [`supabase_setup.sql`](./supabase_setup.sql) in your Supabase SQL Editor.
2. **Backend (Render / Railway):** Deploy the `/backend` directory with `SUPABASE_URL`, `SUPABASE_KEY`, and `JWT_SECRET`.
3. **Frontend (Vercel):** Deploy the `/frontend` directory with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL`.

For complete step-by-step instructions, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.
