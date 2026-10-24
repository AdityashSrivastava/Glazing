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
    category VARCHAR(50) NOT NULL, -- 'DSA', 'Development', 'College Studies', 'Gym', 'Life'
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

-- 8. SCHEMA RECONCILIATION & MIGRATIONS
-- Ensures columns exist even if tables were already initialized earlier
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS proof_url TEXT;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL;

-- 9. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON public.tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON public.daily_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_bounties_target ON public.bounties(target_task_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user ON public.focus_sessions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON public.focus_sessions(task_id);

-- 10. AUTO-UPDATE TIMESTAMPS TRIGGER FUNCTION
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

-- 11. AUTH TRIGGER: AUTO-CREATE PUBLIC.USERS PROFILE ON AUTH SIGNUP
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

-- 12. ROW LEVEL SECURITY (RLS) POLICIES & PRIVILEGE HARDENING
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

-- 12.1. USERS POLICIES & PRIVILEGES
-- Defense-in-depth: Revoke broad UPDATE permissions from authenticated and anon roles
REVOKE UPDATE ON public.users FROM authenticated, anon;
-- Grant column-level UPDATE strictly for display_name and avatar_url
GRANT UPDATE (display_name, avatar_url) ON public.users TO authenticated;

DROP POLICY IF EXISTS "Allow read access to all users" ON public.users;
CREATE POLICY "Allow read access to all users" ON public.users FOR SELECT USING (true);

-- Allow authenticated users to update ONLY display_name and avatar_url on their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Trigger: Prohibit direct manipulation of total_lifetime_points and current_streak by non-service-role
CREATE OR REPLACE FUNCTION public.protect_user_fields()
RETURNS TRIGGER AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF (NEW.total_lifetime_points IS DISTINCT FROM OLD.total_lifetime_points) THEN
            RAISE EXCEPTION 'Modifying total_lifetime_points requires authoritative server clearance.';
        END IF;
        IF (NEW.current_streak IS DISTINCT FROM OLD.current_streak) THEN
            RAISE EXCEPTION 'Modifying current_streak requires authoritative server clearance.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_fields ON public.users;
CREATE TRIGGER trg_protect_user_fields
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE PROCEDURE public.protect_user_fields();

-- 12.2. GOALS POLICIES (Defense-in-depth: classified goals readable only by owner)
DROP POLICY IF EXISTS "Allow read access to all goals" ON public.goals;
DROP POLICY IF EXISTS "Allow read access to non-private goals or own goals" ON public.goals;
CREATE POLICY "Allow read access to non-private goals or own goals" ON public.goals 
    FOR SELECT USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals 
    FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals 
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals 
    FOR DELETE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- 12.3. TASKS POLICIES & PRIVILEGES
-- Defense-in-depth: Revoke broad UPDATE permissions from authenticated and anon roles
REVOKE UPDATE ON public.tasks FROM authenticated, anon;
-- Grant column-level UPDATE strictly for user-editable draft properties
GRANT UPDATE (title, is_private, estimated_hours, goal_id) ON public.tasks TO authenticated;

DROP POLICY IF EXISTS "Allow read access to all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow read access to non-private tasks or own tasks" ON public.tasks;
CREATE POLICY "Allow read access to non-private tasks or own tasks" ON public.tasks 
    FOR SELECT USING (is_private = false OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks 
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id 
        AND points_earned = 0 
        AND (status = 'PENDING' OR status IS NULL)
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks 
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks 
    FOR DELETE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- Trigger: Prohibit client-side manipulation of points_earned, actual_hours, or direct status completion
CREATE OR REPLACE FUNCTION public.protect_task_points()
RETURNS TRIGGER AS $$
BEGIN
    IF (auth.role() = 'authenticated') THEN
        IF (NEW.points_earned IS DISTINCT FROM OLD.points_earned) THEN
            RAISE EXCEPTION 'Modifying task points_earned requires authoritative server clearance.';
        END IF;
        IF (OLD.status = 'COMPLETED' AND NEW.status != 'COMPLETED') THEN
            RAISE EXCEPTION 'Reverting completed tasks requires overseer clearance.';
        END IF;
        IF (NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED') THEN
            RAISE EXCEPTION 'Completing tasks requires server gamification engine validation.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_task_points ON public.tasks;
CREATE TRIGGER trg_protect_task_points
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE PROCEDURE public.protect_task_points();

-- BOUNTIES POLICIES
DROP POLICY IF EXISTS "Allow read access to all bounties" ON public.bounties;
CREATE POLICY "Allow read access to all bounties" ON public.bounties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert bounties" ON public.bounties;
CREATE POLICY "Users can insert bounties" ON public.bounties FOR INSERT WITH CHECK (auth.uid() = issuer_id);

DROP POLICY IF EXISTS "Users can delete own bounties" ON public.bounties;
CREATE POLICY "Users can delete own bounties" ON public.bounties FOR DELETE USING (auth.uid() = issuer_id);

-- SNAPSHOTS POLICIES (Read-only for clients; inserted exclusively by backend Service Role)
DROP POLICY IF EXISTS "Allow read access to all snapshots" ON public.daily_snapshots;
CREATE POLICY "Allow read access to all snapshots" ON public.daily_snapshots FOR SELECT USING (true);

-- FOCUS SESSIONS POLICIES (Strictly private to the user)
DROP POLICY IF EXISTS "Allow read access to all focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can read own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can read own focus sessions" ON public.focus_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can insert own focus sessions" ON public.focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can delete own focus sessions" ON public.focus_sessions FOR DELETE USING (auth.uid() = user_id);

-- 13. STORAGE BUCKET FOR PROOFS
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof_uploads', 'proof_uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'proof_uploads' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
        AND LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp')
    );

DROP POLICY IF EXISTS "Public can view proofs" ON storage.objects;
CREATE POLICY "Public can view proofs" ON storage.objects
    FOR SELECT USING (bucket_id = 'proof_uploads');

-- 14. ATOMIC POINT MUTATION PROCEDURES (TOCTOU RACE CONDITION DEFENSE)
CREATE OR REPLACE FUNCTION public.deduct_user_points(p_user_id UUID, p_amount INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_rows INT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN FALSE;
    END IF;

    UPDATE public.users
    SET total_lifetime_points = total_lifetime_points - p_amount,
        updated_at = NOW()
    WHERE id = p_user_id AND total_lifetime_points >= p_amount;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.add_user_points(p_user_id UUID, p_amount INT)
RETURNS BOOLEAN AS $$
DECLARE
    v_rows INT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN FALSE;
    END IF;

    UPDATE public.users
    SET total_lifetime_points = total_lifetime_points + p_amount,
        updated_at = NOW()
    WHERE id = p_user_id;

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    RETURN v_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. COVERT OVERSEER (MISTERBOMBASTIC) INFRASTRUCTURE
-- 15.1. OPERATIVE PRESENCE TABLE (Real-Time Telemetry & Heartbeat)
CREATE TABLE IF NOT EXISTS public.operative_presence (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    is_online BOOLEAN DEFAULT FALSE,
    current_route VARCHAR(100) DEFAULT 'dashboard',
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15.2. VERDICTS TABLE (Audit Interventions & Judgments)
CREATE TABLE IF NOT EXISTS public.verdicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('REVOKE_GYM', 'REJECT_TASK', 'REWRITE_TASK', 'REVERT_PENDING')),
    reason TEXT NOT NULL,
    points_deducted INTEGER NOT NULL DEFAULT 0,
    old_values JSONB,
    new_values JSONB,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for Overseer & Verdicts
CREATE INDEX IF NOT EXISTS idx_verdicts_target ON public.verdicts(target_user_id, acknowledged);
CREATE INDEX IF NOT EXISTS idx_verdicts_created ON public.verdicts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presence_heartbeat ON public.operative_presence(last_heartbeat DESC);

-- Enable RLS
ALTER TABLE public.operative_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verdicts ENABLE ROW LEVEL SECURITY;

-- Presence RLS: Users can upsert their own heartbeat, read own presence
DROP POLICY IF EXISTS "Allow user update own presence" ON public.operative_presence;
CREATE POLICY "Allow user update own presence" ON public.operative_presence
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow read presence" ON public.operative_presence;
CREATE POLICY "Allow read presence" ON public.operative_presence
    FOR SELECT USING (true);

-- Verdicts RLS: All users can read verdicts (for public squad shaming), targets can ONLY update acknowledged
REVOKE UPDATE ON public.verdicts FROM authenticated, anon;
GRANT UPDATE (acknowledged) ON public.verdicts TO authenticated;

DROP POLICY IF EXISTS "Allow read verdicts" ON public.verdicts;
CREATE POLICY "Allow read verdicts" ON public.verdicts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow user acknowledge verdict" ON public.verdicts;
CREATE POLICY "Allow user acknowledge verdict" ON public.verdicts
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = target_user_id)
    WITH CHECK ((SELECT auth.uid()) = target_user_id);



