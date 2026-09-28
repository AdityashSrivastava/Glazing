# Implementation Plan & Sprints
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Target:** AI Coding Agent

---

## 1. Execution Directives for AI Agent
**STOP AND READ:** Do not attempt to build the entire application in a single output. You must complete each Sprint sequentially. After completing a Sprint, output a summary of what was built and ask the user for confirmation to proceed to the next Sprint. 

Always test API endpoints (using mock data if necessary) before building the frontend components that consume them.

---

## Sprint 1: Infrastructure & Database Foundation
**Goal:** Establish the monorepo, set up the database schemas, and configure Supabase.

1.  **Initialize Monorepo:**
    *   Create a root folder `/glazing-monorepo`.
    *   Initialize Next.js: `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
    *   Initialize FastAPI: Create `/backend` folder, set up `venv`, and create `requirements.txt` containing `fastapi`, `uvicorn`, `pydantic`, `python-jose`, `supabase`, `pytz`.
2.  **Database Provisioning:**
    *   Using the `schema.md` and `security.md` documents, execute the SQL commands in the Supabase SQL Editor.
    *   Create the `users`, `goals`, `tasks`, `bounties`, and `daily_snapshots` tables.
    *   Apply all Row Level Security (RLS) policies.
    *   Create the `proof_uploads` storage bucket.
3.  **Seed Users:**
    *   Manually create the 5 user accounts (Adityash, Manas, Shivansh, Praveen, Harshit) via the Supabase Auth Dashboard. 
    *   Ensure their UUIDs correctly populate the public `users` table via a Supabase Auth trigger (or manual insertion).

## Sprint 2: The FastAPI Core & Gamification Engine
**Goal:** Build the secure API layer that handles data validation and point calculation.

1.  **Auth Middleware:**
    *   Create `backend/app/auth.py`. Implement a FastAPI dependency that extracts the JWT from the `Authorization: Bearer <token>` header and verifies it using `python-jose` and `SUPABASE_JWT_SECRET`.
2.  **Pydantic Models (`schemas.py`):**
    *   Define strict input schemas for Task Creation, Task Completion (must validate `actual_hours` <= 24).
    *   Define response schemas.
3.  **Core Endpoints (`main.py`):**
    *   `POST /api/tasks` (Create pending task).
    *   `PATCH /api/tasks/{id}/status` (Toggle IN_PROGRESS for Deep Focus).
    *   `GET /api/tasks/feed` (Fetch recent tasks. **CRITICAL:** Implement the privacy masking logic here as defined in `security.md`).
4.  **The Calculation Engine:**
    *   `PATCH /api/tasks/{id}/complete`: Implement the formula from `tracker.md` (Base Points + Completion + Sniper Bonus + First Blood).
    *   Update the task, calculate points, update user lifetime points, and return the transaction result.
5.  **Leaderboard Endpoints:**
    *   `GET /api/leaderboard/daily` (Sum points for today).
    *   `GET /api/leaderboard/weekly` (Aggregate daily snapshots).

## Sprint 3: Next.js UI Foundation & Authentication
**Goal:** Set up the frontend architecture, styling, and user login flow.

1.  **shadcn/ui Setup:**
    *   Initialize shadcn: `npx shadcn-ui@latest init` (Select Default style, Zinc color, css variables: true).
    *   Install required components: `button`, `input`, `dialog`, `toast`, `avatar`, `card`, `tabs`, `badge`.
2.  **Global Theming:**
    *   Modify `globals.css` and `tailwind.config.ts` to enforce the strict dark mode aesthetic defined in `design.md` (removing all light mode variables).
3.  **Authentication Flow:**
    *   Build `/login` page with email/password inputs.
    *   Use Supabase JS client to authenticate.
    *   Store the resulting JWT securely so it can be attached to Axios requests targeting the FastAPI backend.
4.  **App Shell:**
    *   Create the primary layout for `/dashboard`. 
    *   Build the persistent left `<Sidebar />` (Navigation, Profile summary, "Add Task" CTA).

## Sprint 4: Dashboard Integration & Data Fetching
**Goal:** Connect the UI to the API and make the dashboard functional.

1.  **React Query Setup:**
    *   Wrap the application in `QueryClientProvider`.
2.  **The Activity Feed:**
    *   Build `<TaskFeed />` component. Fetch data from `GET /api/tasks/feed`.
    *   Render `<TaskCard />` components. Ensure the frontend gracefully renders the masked `CLASSIFIED TASK` UI for private tasks.
3.  **The Leaderboards:**
    *   Build `<LeaderboardPanel />` in the right column. Include Daily/Weekly tabs.
    *   Ensure scores are formatted in `font-mono`.
4.  **Forms & Mutations:**
    *   Build the `<CreateTaskModal />` using `react-hook-form` and `zod`. Link it to `POST /api/tasks`.
    *   Build the `<CompleteTaskModal />`. Implement file upload to Supabase Storage, retrieve the public URL, and submit it alongside `actual_hours` to the FastAPI backend.

## Sprint 5: Automation, Polish, & Real-Time Feel
**Goal:** Implement the midnight reset and add visual flair.

1.  **The Midnight Reset (Cron Job):**
    *   Configure a scheduled function (via Supabase `pg_cron` or a secure external trigger) to run exactly at 12:00 AM IST.
    *   The SQL function must snapshot the day's points into `daily_snapshots` and reset active daily counters.
2.  **"Deep Focus" UI:**
    *   Add the pulsing emerald dot animation on the frontend when a user's task status is `IN_PROGRESS`.
3.  **Final Polish:**
    *   Add React Hot Toast / shadcn Toasts for all success/error states (e.g., "Points Awarded!", "Task Completed").
    *   Ensure responsive behavior (though desktop is priority, ensure it doesn't break entirely on smaller screens).
    *   Verify all mathematical edge cases (e.g., logging 0 hours, logging >24 hours).

## Sign-off & Deployment
Once Sprint 5 is complete, deploy the Next.js frontend to Vercel and the FastAPI backend to Render/Railway. Ensure environment variables are correctly mapped.