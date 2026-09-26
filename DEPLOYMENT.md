# Glazing: Supabase Setup & Vercel Deployment Guide

This guide covers:
1. **Supabase Database & Authentication Configuration**
2. **Deploying the Frontend to Vercel**
3. **Deploying the FastAPI Backend to Render / Railway**
4. **Local Development Workflow**

---

## 1. Supabase Setup (Database, Auth, Storage)

### Step 1.1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project (e.g. `glazing-prod`).
2. Choose a strong database password and select a region close to your users (e.g. `ap-south-1` Mumbai for IST).

### Step 1.2: Execute the Database Schema
1. In your Supabase Dashboard, navigate to the **SQL Editor** (icon on the left sidebar).
2. Open the file [`supabase_setup.sql`](./supabase_setup.sql) in this repository.
3. Copy the entire contents and paste it into the Supabase SQL Editor.
4. Click **Run**. This will create:
   - Extensions (`uuid-ossp`, `pgcrypto`)
   - All tables (`users`, `goals`, `tasks`, `bounties`, `daily_snapshots`, `focus_sessions`)
   - Foreign keys and cascade deletes
   - Auto-updating `updated_at` triggers
   - Auth trigger (`handle_new_user`) that auto-populates `public.users` when users are registered
   - Row Level Security (RLS) policies
   - Storage bucket `proof_uploads` for evidence images

### Step 1.3: Retrieve Supabase Credentials
Go to **Project Settings** -> **API**:
- **Project URL:** Copy the URL (e.g. `https://xyzcompany.supabase.co`).
- **Project API Keys:**
  - Copy `anon` / `public` key (used by frontend).
  - Copy `service_role` / `secret` key (used strictly by FastAPI backend).
- **JWT Secret:** Under **Project Settings** -> **API** -> scroll to **JWT Settings**, copy the `JWT Secret`.

### Step 1.4: Seed the 5 Operatives & Custom Password Management
In a closed-loop system, users do not register publicly. The 5 authorized operatives are:
- `adityash@glazing.com`
- `manas@glazing.com`
- `shivansh@glazing.com`
- `praveen@glazing.com`
- `harshit@glazing.com`

**Self-Serve Password Setup**:
Operatives do not have to share or use default passwords. On the login screen:
1. An operative selects their profile avatar or enters their `@glazing.com` email.
2. Selects the **"Set Password"** tab.
3. Chooses their secure password (with show/hide eye toggle button to view as they type).
4. Submitting authoritatively saves the encrypted password to Supabase Auth and logs them straight into the terminal.
5. Logged-in operatives can also change their password at any time via the profile dropdown menu -> **Change Password**.

---


## 2. Deploying Frontend to Vercel

The frontend is a Vite + TypeScript + Tailwind CSS application located in the `/frontend` directory.

### Method A: Deploy via GitHub (Recommended)
1. Push your repository to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your `Glazing` repository.
4. In the **Configure Project** screen:
   - **Framework Preset:** Vite (detected automatically).
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Expand **Environment Variables** and add:
   | Variable Name | Value | Purpose |
   |---|---|---|
   | `VITE_SUPABASE_URL` | `https://<your-project>.supabase.co` | Supabase endpoint |
   | `VITE_SUPABASE_ANON_KEY` | `<your-anon-public-key>` | Supabase client auth |
   | `VITE_API_URL` | `https://<your-backend>.onrender.com/api` | Live FastAPI backend URL |
6. Click **Deploy**.

> [!NOTE]
> Client-side routing is handled automatically by [`frontend/vercel.json`](./frontend/vercel.json) using SPA rewrites so that hard-refreshing `/leaderboard`, `/goals`, or `/timer` does not produce 404 errors.

---

## 3. Deploying FastAPI Backend (Render / Railway)

Because the FastAPI backend uses long-running uvicorn processes and background tasks, deploying to **Render** or **Railway** is recommended.

### Deploying on Render (Free / Starter Tier)
1. Go to [dashboard.render.com](https://dashboard.render.com) and click **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `glazing-api`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Under **Environment Variables**, add:
   | Variable Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://<your-project>.supabase.co` |
   | `SUPABASE_KEY` | `<your-service-role-key>` |
   | `SUPABASE_JWT_SECRET` | `<your-jwt-secret>` |
   | `ALLOWED_ORIGINS` | `https://<your-app>.vercel.app,http://localhost:5173` |
5. Click **Create Web Service**.
6. Once deployed, copy your Render URL (e.g., `https://glazing-api.onrender.com`) and update `VITE_API_URL` in Vercel to `https://glazing-api.onrender.com/api`.

---

## 4. Midnight IST Reset Configuration

To snapshot daily leaderboard points at 12:00:00 AM IST:
1. In the Supabase Dashboard, go to **Database** -> **Extensions** and ensure `pg_cron` is enabled.
2. In the **SQL Editor**, schedule the midnight reset function or trigger `POST /api/tasks/cron/resolve-abandoned` via an external cron service (like cron-job.org or GitHub Actions) scheduled for `18:30 UTC` (which corresponds exactly to `00:00 IST`).

---

## 5. Local Development Quickstart

1. **Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Or .\venv\Scripts\Activate.ps1 on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```
2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173`.
