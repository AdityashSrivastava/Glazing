-- =====================================================================
-- GLAZING: COMPLETE SUPABASE SETUP SCRIPT
-- Paste this entire script into your Supabase Dashboard -> SQL Editor
-- and click "RUN" to initialize the database, tables, triggers, and RLS.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS TABLE
-- Extends auth.users for profile data, streaks, and lifetime points
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    total_lifetime_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GOALS TABLE (Objectives & Competency Domains)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'Coding', 'Fitness', 'Learning', 'Career', 'Life'
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TASKS TABLE (Daily Execution Engine)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    estimated_hours NUMERIC(5,2) NOT NULL CHECK (estimated_hours > 0),
    actual_hours NUMERIC(5,2) CHECK (actual_hours >= 0 AND actual_hours <= 24),
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'EXPIRED')),
    proof_url TEXT,
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BOUNTIES TABLE (Peer Staking & Challenges)
CREATE TABLE IF NOT EXISTS public.bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issuer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    points_at_stake INTEGER NOT NULL CHECK (points_at_stake > 0),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED_TARGET_WON', 'RESOLVED_ISSUER_WON')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 6. DAILY SNAPSHOTS TABLE (Midnight IST Leaderboard Snapshots)
CREATE TABLE IF NOT EXISTS public.daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    points_earned_that_day INTEGER NOT NULL DEFAULT 0,
    tasks_completed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- 7. FOCUS SESSIONS TABLE (Pomodoro & Stopwatch Focus Ledger)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    task_title VARCHAR(255) NOT NULL DEFAULT 'General Deep Work',
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    mode VARCHAR(50) NOT NULL DEFAULT 'pomo' CHECK (mode IN ('pomo', 'stopwatch')),
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.daily_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_bounties_target ON public.bounties(target_task_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON public.focus_sessions(task_id);

-- 9. AUTO-UPDATE TIMESTAMPS TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_modtime ON public.users;
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_goals_modtime ON public.goals;
CREATE TRIGGER update_goals_modtime BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_tasks_modtime ON public.tasks;
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 9. AUTH TRIGGER: AUTO-CREATE PUBLIC.USERS PROFILE ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, display_name, total_lifetime_points)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        0
    )
    ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
DROP POLICY IF EXISTS "Allow read access to all users" ON public.users;
CREATE POLICY "Allow read access to all users" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- GOALS POLICIES
DROP POLICY IF EXISTS "Allow read access to all goals" ON public.goals;
CREATE POLICY "Allow read access to all goals" ON public.goals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals FOR DELETE USING (auth.uid() = user_id);

-- TASKS POLICIES
DROP POLICY IF EXISTS "Allow read access to all tasks" ON public.tasks;
CREATE POLICY "Allow read access to all tasks" ON public.tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- BOUNTIES POLICIES
DROP POLICY IF EXISTS "Allow read access to all bounties" ON public.bounties;
CREATE POLICY "Allow read access to all bounties" ON public.bounties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert bounties" ON public.bounties;
CREATE POLICY "Users can insert bounties" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = issuer_id);

-- SNAPSHOTS POLICIES
DROP POLICY IF EXISTS "Allow read access to all snapshots" ON public.daily_snapshots;
CREATE POLICY "Allow read access to all snapshots" ON public.daily_snapshots FOR SELECT USING (true);

-- FOCUS SESSIONS POLICIES
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to all focus sessions" ON public.focus_sessions;
CREATE POLICY "Allow read access to all focus sessions" ON public.focus_sessions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- 12. STORAGE BUCKET FOR PROOFS (Optional image uploads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof_uploads', 'proof_uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'proof_uploads');

DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;
CREATE POLICY "Public can view proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'proof_uploads');
