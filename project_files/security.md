# Security, Authentication & Privacy Architecture
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Architecture:** Next.js (Client) <-> FastAPI (Backend Logic) <-> Supabase (Data/Auth)

---

## 1. Authentication Architecture (Closed Loop)
Since Glazing is strictly for 5 users (Adityash, Manas, Shivansh, Praveen, Harshit), there is **no public registration**. 

*   **Account Creation:** Accounts are manually created in the Supabase Dashboard by the admin. 
*   **The Auth Flow:**
    1.  User navigates to `/login` on the Next.js frontend.
    2.  Next.js uses `@supabase/ssr` or `@supabase/supabase-js` to authenticate with email/password.
    3.  Supabase returns a Session containing an `access_token` (JWT).
    4.  Next.js stores this JWT securely in an HttpOnly cookie (or secure local storage for client components).
    5.  For **every** request to the FastAPI backend, Next.js attaches this JWT in the header: `Authorization: Bearer <JWT>`.
*   **Backend Verification:** FastAPI MUST use a dependency injection function (e.g., `async def get_current_user(token: str = Depends(oauth2_scheme))`) to decode and verify the JWT signature using the Supabase JWT Secret. If invalid or expired, return `401 Unauthorized`.

---

## 2. Row Level Security (RLS) Policies (Database Level)
Supabase RLS acts as the first line of defense. Because Glazing is highly collaborative (leaderboards, activity feeds), users need read access to most tables, but strict mutation (write/update) constraints.

Execute these SQL commands in Supabase to secure the tables:

```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USERS TABLE POLICIES
-- ==========================================
CREATE POLICY "Allow read access to all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- GOALS TABLE POLICIES (Defense-in-depth)
-- ==========================================
CREATE POLICY "Allow read access to non-private goals or own goals" ON public.goals 
    FOR SELECT USING (is_private = false OR auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TASKS TABLE POLICIES (Defense-in-depth)
-- ==========================================
CREATE POLICY "Allow read access to non-private tasks or own tasks" ON public.tasks 
    FOR SELECT USING (is_private = false OR auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- BOUNTIES POLICIES
-- ==========================================
CREATE POLICY "Allow read access to all bounties" ON public.bounties FOR SELECT USING (true);
CREATE POLICY "Users can insert bounties" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = issuer_id);
CREATE POLICY "Users can delete own bounties" ON public.bounties FOR DELETE USING (auth.uid() = issuer_id);

-- ==========================================
-- DAILY SNAPSHOTS POLICIES
-- ==========================================
CREATE POLICY "Allow read access to all snapshots" ON public.daily_snapshots FOR SELECT USING (true);

-- ==========================================
-- FOCUS SESSIONS POLICIES
-- ==========================================
CREATE POLICY "Users can read own focus sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);
```

---

## 3. The "Private Task" Data Masking Logic (API Level - CRITICAL)
In addition to database-level Row Level Security preventing direct client leaks via the anon key, the **FastAPI backend connects using the authoritative Service Role Key and enforces strict in-memory masking of sensitive fields** before returning JSON responses to clients.


**Implementation Rule for the AI Agent:**
Whenever a route returns a Task or a List of Tasks (e.g., `GET /api/tasks/feed`), it must pass through a sanitization function or a dynamic Pydantic serializer.

**Logic Flow:**
1. Request comes in from `User A`.
2. FastAPI queries the database for recent tasks. It pulls a task belonging to `User B`.
3. Condition check: `if task.is_private == True AND task.user_id != requesting_user_id`:
4. **Action:** Overwrite fields in memory *before* returning the response:
    *   `task.title` = `"CLASSIFIED TASK"`
    *   `task.description` = `null`
    *   `task.goal_id` = `null` (Do not reveal what goal they are working on)
    *   `task.proof_url` = `null` (Do not reveal their proof)
    *   *Do NOT mask:* `points_earned`, `actual_hours`, `created_at`, `status`. (Peers must see that work was done and points were awarded).

---

## 4. Storage Bucket Security (Proof of Work)
When a user uploads a screenshot to the `proof_uploads` Supabase Storage bucket, it must be protected so users cannot guess URLs to view private task proofs.

```sql
-- Create the bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('proof_uploads', 'proof_uploads', false);

-- Enable RLS on the storage schema
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Anyone authenticated can upload
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proof_uploads');

-- 2. Viewing proofs logic:
-- A user can view the file IF: it's their own file, OR the associated task is public.
-- (This requires joining the storage.objects metadata with the public.tasks table in the policy, 
-- or strictly enforcing signed URLs via the FastAPI backend).
```
**Recommended Storage Architecture:** Instead of complex SQL joins on storage policies, FastAPI should generate **short-lived Signed URLs** for proof images only when authorized via the masking logic above. 

---

## 5. Security Edge Cases & Protections
*   **Time Tampering:** Users cannot pass `created_at` or `completed_at` times from the frontend. The FastAPI backend MUST generate these timestamps using `datetime.now(timezone.utc)` to prevent users from logging tasks in the past to alter yesterday's leaderboard.
*   **Over-Logging:** The backend endpoint `PATCH /api/tasks/{id}/complete` must sum up all `actual_hours` logged by the user for the current day. If `new_task_hours + daily_total_hours > 24`, return a `400 Bad Request` and reject the transaction.