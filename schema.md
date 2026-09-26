# Database Schema & SQL Architecture
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Database:** PostgreSQL (via Supabase)

---

## 1. Architectural Overview
The database uses Supabase's managed PostgreSQL. All user authentication is handled by Supabase Auth (`auth.users`), and our public schema references these authenticated UUIDs. We utilize `uuid-ossp` extensions for ID generation and strict `TIMESTAMPTZ` for all date/time fields to reliably enforce the Indian Standard Time (IST) midnight resets.

### Required Extensions
```sql
-- Ensure UUID generation is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## 2. Table Definitions

### 2.1. `users` Table
Stores the profile data for the 5 core members. This table extends the internal `auth.users` table.

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    total_lifetime_points INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
*Note: `total_lifetime_points` is updated incrementally when tasks are completed. It is separate from daily/weekly scores.*

### 2.2. `goals` Table
Represents long-term objectives. Tasks belong to Goals.

```sql
CREATE TABLE public.goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- Allowed values: 'Coding', 'Fitness', 'Learning', 'Career', 'Life'
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3. `tasks` Table (The Core Engine)
The primary transactional table where daily work is recorded.

```sql
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL, -- Can be null if it's a standalone task
    title VARCHAR(255) NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    estimated_hours NUMERIC(5,2) NOT NULL CHECK (estimated_hours > 0),
    actual_hours NUMERIC(5,2) CHECK (actual_hours >= 0 AND actual_hours <= 24), -- Hard cap to prevent exploitation
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED')),
    proof_url TEXT, -- URL to Supabase Storage or external link
    points_earned INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
*Constraint Logic:* `actual_hours` cannot exceed 24 in a single entry. 

### 2.4. `bounties` Table (Phase 2)
Tracks peer-to-peer challenges placed on specific tasks.

```sql
CREATE TABLE public.bounties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issuer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    target_task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    points_at_stake INTEGER NOT NULL CHECK (points_at_stake > 0),
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED_TARGET_WON', 'RESOLVED_ISSUER_WON')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);
```

### 2.5. `daily_snapshots` Table (For Leaderboards & History)
This table acts as the ledger for the midnight reset. A cron job populates this table every night at 12:00 AM IST.

```sql
CREATE TABLE public.daily_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL, -- E.g., '2026-09-21'
    points_earned_that_day INTEGER NOT NULL DEFAULT 0,
    tasks_completed_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date) -- Prevents duplicate snapshots for the same user on the same day
);
```

---

## 3. Performance Indexes
Because the application relies heavily on real-time feeds and filtering by dates/status, indexes are critical to ensure the dashboard loads instantly.

```sql
-- Feed Queries (fetching recent tasks quickly)
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_status ON public.tasks(status);

-- Leaderboard Queries (fetching a specific user's tasks for a specific date range)
CREATE INDEX idx_tasks_user_date ON public.tasks(user_id, completed_at);

-- Snapshot Queries (fetching weekly leaderboards)
CREATE INDEX idx_snapshots_date ON public.daily_snapshots(snapshot_date DESC);
```

---

## 4. Automation: Updated_At Triggers
To ensure `updated_at` columns are automatically maintained without requiring the FastAPI backend to pass the current timestamp on every `PATCH` request, use this standard PostgreSQL trigger:

```sql
-- Create the trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_goals_modtime BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
```