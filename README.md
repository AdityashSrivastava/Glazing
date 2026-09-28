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

---

### 💻 Quickstart

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
