# Tracking & Gamification Algorithms
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Architecture:** Next.js (Client) <-> FastAPI (Backend Logic) <-> Supabase (Data/Auth)

---

## 1. Core Rule: Backend Authority
**CRITICAL FOR AI AGENT:** All point calculations, bonuses, and penalties MUST be computed on the FastAPI backend during the `PATCH /api/tasks/{task_id}/complete` request. The Next.js frontend must NEVER calculate points or send a `points_earned` payload. 

---

## 2. Point Calculation Engine
When a task transitions to `COMPLETED`, the FastAPI engine applies the following formula to calculate `points_earned`.

### Step 1: Base Time Points
*   **Formula:** `Actual Hours Logged * 10`
*   *Example:* 2.5 hours = 25 points.
*   *Constraint:* Max `Actual Hours` per task is capped at 12. Max total `Actual Hours` across all tasks per day per user is 24. 

### Step 2: The Completion Bonus
*   **Formula:** Flat `+5` points for successfully moving a task from `IN_PROGRESS` to `COMPLETED`. 
*   *Purpose:* Incentivizes breaking down large tasks into smaller chunks.

### Step 3: The "Sniper" Accuracy Bonus
*   **Logic:** Compares `estimated_hours` to `actual_hours` to reward realistic planning.
*   Let `Diff = absolute_value(estimated_hours - actual_hours)`
*   **Tiers:**
    *   If `Diff <= 0.25` (15 mins): Award `+5` points.
    *   If `Diff > 0.25 AND Diff <= 0.5` (30 mins): Award `+2` points.
    *   If `Diff > 0.5`: Award `0` points.
*   *Anti-Exploit:* This bonus ONLY applies if `estimated_hours` >= 0.5 (to prevent farming bonuses on 5-minute tasks).

### Step 4: The "First Blood" Bonus (Daily)
*   **Logic:** The first user to complete a task on any given day (after the 12:00 AM IST reset) gets a flat `+3` point bonus.
*   **Query Check:** FastAPI checks if `COUNT(tasks)` where `status = 'COMPLETED'` and `completed_at::date = TODAY` is `0`. If so, append the bonus.

**Total Points Formula:** 
`Final Points = Base Time Points + Completion Bonus + Sniper Bonus + First Blood Bonus + Bounty (if applicable)`

---

## 3. Leaderboard Aggregation Algorithms

### 3.1. Daily Leaderboard
*   **Timeframe:** Resets every day at 12:00:00 AM IST (Indian Standard Time).
*   **Query Logic:** Sum of all `points_earned` from the `tasks` table where `completed_at >= [Today 12:00 AM IST]` AND `user_id = X`.
*   **Tie-Breakers:** If User A and User B have the same points, the user with the highest `Actual Hours` logged wins. If still tied, the user who logged their first task earlier in the day wins.

### 3.2. Weekly Leaderboard
*   **Timeframe:** Monday 12:00 AM IST to Sunday 11:59 PM IST.
*   **Query Logic:** Instead of querying the `tasks` table directly, FastAPI should query the `daily_snapshots` table for the current week. Sum the `points_earned_that_day` for Monday through Current Day.
*   *Why?* Querying snapshots is significantly faster and prevents data drifting if older tasks are somehow modified.

---

## 4. The Bounty System (Phase 2 Feature)
Users can stake their own points to challenge others. 

*   **Issuing:** User A stakes `X` points (minimum 10) on User B's pending task. FastAPI deducts `X` from User A's `total_lifetime_points` immediately (put in escrow).
*   **Scenario 1 (Target Wins):** User B completes the task before 11:59 PM IST. 
    *   User B receives their normal task points PLUS the `X` bounty points.
    *   User A loses the points permanently.
*   **Scenario 2 (Issuer Wins):** User B fails to complete the task by 11:59 PM IST.
    *   User A gets their `X` points refunded from escrow.
    *   User A receives a `+5` point "Tax/Interest" reward.
    *   User B is penalized `-5` points from their daily total (can go negative).

---

## 5. Analytics: Skill Radar Categories
To map progress beyond just raw numbers, every Goal (and therefore its child Tasks) must be tagged with exactly one of these 5 categories. The profile page will render a Recharts Radar Chart based on lifetime points earned in each bucket.

1.  **Development** (Coding, PRs, Architecture)
2.  **Learning** (Reading, Courses, Tutorials)
3.  **Fitness** (Gym, Running, Health)
4.  **Career** (Networking, Resumes, Applications)
5.  **Life** (Admin, Chores, Finances)

*FastAPI endpoint `GET /api/users/{id}/radar` will group lifetime points by these 5 categories and return the JSON array formatted for Recharts.*