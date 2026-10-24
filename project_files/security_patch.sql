-- =====================================================================
-- GLAZING: SECURITY HARDENING MIGRATION PATCH (VIBE-SECURITY AUDIT)
-- Run this script in Supabase Dashboard -> SQL Editor to immediately
-- apply all database access control fixes, column restrictions, and triggers.
-- =====================================================================

-- 1. HARDEN PUBLIC.USERS
-- Revoke direct update on sensitive columns (total_lifetime_points, current_streak)
REVOKE UPDATE ON public.users FROM authenticated, anon;
GRANT UPDATE (display_name, avatar_url) ON public.users TO authenticated;

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users 
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Trigger: Prohibit client-side modification of points or streak
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

-- 2. HARDEN PUBLIC.TASKS
-- Revoke direct update on points and status
REVOKE UPDATE ON public.tasks FROM authenticated, anon;
GRANT UPDATE (title, is_private, estimated_hours, goal_id) ON public.tasks TO authenticated;

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

-- 3. HARDEN PUBLIC.GOALS
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals 
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
CREATE POLICY "Users can insert own goals" ON public.goals 
    FOR INSERT 
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- 4. HARDEN PUBLIC.VERDICTS
-- Restrict target updates strictly to the 'acknowledged' boolean column
REVOKE UPDATE ON public.verdicts FROM authenticated, anon;
GRANT UPDATE (acknowledged) ON public.verdicts TO authenticated;

DROP POLICY IF EXISTS "Allow user acknowledge verdict" ON public.verdicts;
CREATE POLICY "Allow user acknowledge verdict" ON public.verdicts
    FOR UPDATE 
    TO authenticated
    USING ((SELECT auth.uid()) = target_user_id)
    WITH CHECK ((SELECT auth.uid()) = target_user_id);

-- 5. HARDEN STORAGE BUCKET (PROOF UPLOADS)
-- Enforce user folder scoping and file extension restriction
DROP POLICY IF EXISTS "Authenticated users can upload proofs" ON storage.objects;
CREATE POLICY "Authenticated users can upload proofs" ON storage.objects
    FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'proof_uploads' 
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
        AND LOWER(storage.extension(name)) IN ('png', 'jpg', 'jpeg', 'webp')
    );
