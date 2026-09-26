# Exact Technology Stack & Architecture
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Architecture Paradigm:** Decoupled Monorepo (Next.js Frontend + FastAPI Backend)

---

## 1. Architectural Boundaries
**CRITICAL RULE FOR AI AGENT:** 
The Next.js frontend is purely a presentation layer. It must NOT contain business logic for point calculations, timezone enforcement, or privacy masking. Next.js simply consumes JSON from FastAPI. FastAPI is the absolute authority on data state, validation, and gamification math.

---

## 2. Frontend (Client & UI Layer)
The frontend must be highly responsive, modern, and type-safe.

*   **Framework:** Next.js 14+ (Strictly App Router `app/` directory. Do not use the legacy Pages router).
*   **Language:** TypeScript (Strict mode enabled. All props and API responses must have interfaces).
*   **Styling:** Tailwind CSS v3+.
*   **UI Component Library:** shadcn/ui (Built on Radix UI primitives). Use this for Modals, Buttons, Inputs, Toasts, and Dropdowns.
*   **Icons:** `lucide-react` (Standardized with shadcn/ui).
*   **State Management & Data Fetching:** 
    *   `@tanstack/react-query` (React Query v5): Use for fetching the dashboard feed, leaderboards, and caching. Implement optimistic updates for task completion to make the UI feel instant.
    *   `axios`: For making API calls to FastAPI (attaching the Supabase JWT in the headers).
*   **Form Handling:** `react-hook-form` paired with `@hookform/resolvers/zod` and `zod`. (Zod schemas must exactly match backend Pydantic schemas).
*   **Data Visualization:** `recharts` (Used for the user profile Skill Radar Charts).
*   **Date/Time Formatting:** `date-fns` (Used for rendering "2 hours ago" or "Today at 5:00 PM" in the feed).

---

## 3. Backend (API & Logic Layer)
The backend acts as the secure intermediary between the frontend and Supabase.

*   **Framework:** FastAPI (Python 3.10+). Must use `async def` for all route handlers.
*   **Server:** Uvicorn (ASGI web server).
*   **Data Validation:** Pydantic v2 (Strict typing for request payloads and response models).
*   **Authentication Validation:** `python-jose` (To decode and verify the Supabase JWT signature before processing any request).
*   **Database Client:** `supabase` (Official `supabase-py` package) or `httpx` for direct Supabase REST API calls if preferred for async performance.
*   **Timezone Enforcement:** `pytz` or Python 3.9+ `zoneinfo`. **Mandatory:** The backend must explicitly convert and evaluate all timestamps against `Asia/Kolkata` (IST) to ensure the 12:00 AM daily resets happen at the correct local time for the 5 users.
*   **CORS:** FastAPI `CORSMiddleware` must be configured to allow requests from the Next.js frontend origin (e.g., `http://localhost:3000` during dev).

---

## 4. Database & Infrastructure
*   **Database:** Supabase Managed PostgreSQL (Version 15+).
*   **Authentication:** Supabase Auth (Email/Password provider).
*   **Storage:** Supabase Storage (S3-compatible bucket named `proof_uploads` for task completion screenshots).
*   **Automation (Cron):** `pg_cron` extension inside Supabase PostgreSQL to trigger the midnight leaderboard reset function (taking the daily snapshot).

---

## 5. Deployment Architecture
*   **Frontend Hosting:** Vercel (Seamless Next.js integration).
*   **Backend Hosting:** Render or Railway. (Provide a standard `Dockerfile` or rely on Nixpacks to deploy the FastAPI Python environment).
*   **Required Environment Variables:**
    *   **Next.js (`.env.local`):**
        *   `NEXT_PUBLIC_SUPABASE_URL`
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        *   `NEXT_PUBLIC_API_BASE_URL` (Points to FastAPI)
    *   **FastAPI (`.env`):**
        *   `SUPABASE_URL`
        *   `SUPABASE_SERVICE_ROLE_KEY` (Bypasses RLS to perform administrative tasks like the midnight reset if not using pg_cron).
        *   `SUPABASE_JWT_SECRET` (Used by `python-jose` to verify client requests).

---

## 6. Monorepo Directory Structure
To keep the AI agent organized, the project should be initialized with the following structure:

```text
/glazing-monorepo
│
├── /frontend               # Next.js app
│   ├── /src/app            # App router pages
│   ├── /src/components     # shadcn and custom UI components
│   ├── /src/lib            # API client (axios), utils, hooks
│   └── package.json
│
├── /backend                # FastAPI app
│   ├── /app
│   │   ├── main.py         # FastAPI instance & routes
│   │   ├── auth.py         # JWT verification dependencies
│   │   ├── schemas.py      # Pydantic models
│   │   └── gamification.py # Point calculation logic
│   ├── requirements.txt
│   └── Dockerfile
│
└── /docs                   # (Optional) Storing these .md files
```