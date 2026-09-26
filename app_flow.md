# Application Flow & User Journeys
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Architecture:** Next.js (Client) <-> FastAPI (Backend Logic) <-> Supabase (Data/Auth)

---

## 1. Frontend Routing Architecture (Next.js App Router)
The application follows a strict, authenticated-only routing structure.

*   **`/` (Root):** Middleware checks for Supabase session cookie. If present, redirect to `/dashboard`. If absent, redirect to `/login`.
*   **`/login`:** The only unauthenticated route. Contains a simple email/password form. (No registration link, as accounts are pre-seeded).
*   **`/dashboard`:** The operational hub.
    *   Renders `<Sidebar />` (Navigation, My Stats).
    *   Renders `<ActivityFeed />` (Center column, real-time updates).
    *   Renders `<LeaderboardPanel />` (Right column, Daily and Weekly tabs).
*   **`/goals`:** Macro-level view. Renders active long-term goals and progress bars showing how many tasks have been completed under each goal.
*   **`/history`:** A calendar-based view. Users select a past date to view the archived daily leaderboard and completed tasks for that specific day.
*   **`/profile/[user_id]`:** Individual user page showing the Skill Radar Chart, lifetime points, and badge/bounty history.

---

## 2. Detailed User Journeys

### Journey A: The Morning Setup (Task Creation)
**Goal:** User logs their intent for the day.
1.  **UI Interaction:** User clicks the primary "Add Task" button in the sidebar. A modal `<CreateTaskModal />` opens.
2.  **Input:** User fills in: `Title` (text), `Goal` (dropdown of their active goals), `Estimated Time` (numeric, e.g., 2.5 hours), and toggles `Visibility` (Public/Private).
3.  **Client Action:** Next.js sends a `POST /api/tasks` request to the FastAPI backend, including the Supabase JWT in the Authorization header.
4.  **Backend Action:** FastAPI validates the payload via Pydantic. Saves the task to Supabase with `status='PENDING'`. 
5.  **Feedback:** Modal closes, a success toast appears, and the new task populates the user's personal "Today's Tasks" list.

### Journey B: The Grind (Entering Deep Focus)
**Goal:** User signals to the group they are actively working.
1.  **UI Interaction:** On a pending task card, the user clicks the "Start Focus" button.
2.  **Client Action:** Next.js sends a `PATCH /api/tasks/{task_id}/status` with `{"status": "IN_PROGRESS"}`.
3.  **Backend Action:** FastAPI updates the database.
4.  **Broadcast:** The Activity Feed on the dashboard updates for all users. A pulsing `<LiveIndicator />` appears next to the user's avatar in the top navigation and leaderboard, showing they are currently "In the Zone."

### Journey C: The Drop (Task Completion & Proof)
**Goal:** User finishes the work, submits proof, and claims points.
1.  **UI Interaction:** User clicks "Complete" on an in-progress task. The `<CompletionModal />` opens.
2.  **Input:** User inputs `Actual Hours` (numeric). User uploads a file (image/screenshot) or pastes a URL (GitHub/Doc link).
3.  **Storage Upload (Parallel Step):** If an image is uploaded, Next.js pushes it to Supabase Storage `proof_uploads` bucket and retrieves the public URL.
4.  **Client Action:** Next.js sends a `PATCH /api/tasks/{task_id}/complete` to FastAPI with `actual_hours` and `proof_url`.
5.  **Backend Action (CRITICAL PATH):**
    *   FastAPI receives the payload.
    *   FastAPI calculates points (Base + Completion + Accuracy bonuses).
    *   FastAPI updates the task status to `COMPLETED`, adds the `points_earned`, and sets `completed_at = NOW()`.
    *   FastAPI updates the `users.total_points` column.
6.  **Feedback:** Next.js receives the updated score, triggers a celebratory animation (e.g., confetti), and the Leaderboard immediately re-renders with the user's new rank.

### Journey D: The Observer (Viewing the Feed)
**Goal:** User checks what others are doing.
1.  **Client Action:** Next.js polls or fetches `GET /api/tasks/feed` from FastAPI.
2.  **Backend Action (Privacy Redaction):**
    *   FastAPI fetches the last 50 tasks.
    *   It iterates through the tasks: `if task.is_private and task.user_id != requesting_user.id`.
    *   For those tasks, it alters the response object in memory: `title = "CLASSIFIED TASK"`, `proof_url = null`, `goal_id = null`.
3.  **UI Rendering:** The Activity Feed renders. Public tasks show full details and thumbnail previews of proof. Private tasks render as a locked, dark grey block showing only: *"User X completed a CLASSIFIED TASK. (+45 pts)"*.

---

## 3. System Journey: The Midnight Reset (IST)
**Goal:** Archive the day and reset the daily leaderboard fairly.
1.  **Trigger:** A CRON job or background worker configured to fire precisely at 12:00 AM Indian Standard Time (IST).
2.  **Backend Action (FastAPI/DB):**
    *   Executes a SQL transaction.
    *   Reads the current daily points for all 5 users.
    *   Inserts these records into the `daily_snapshots` table (User ID, Date, Points).
    *   *(Optional)* Any tasks still marked `IN_PROGRESS` or `PENDING` at midnight are automatically marked as `EXPIRED` or rolled over to the next day with a point penalty.
3.  **Client Action:** If a user is actively looking at the dashboard at 12:00 AM, the daily leaderboard zeroes out instantly, and the previous day's winner is displayed in a "Yesterday's MVP" banner.

---

## 4. State Machine & Transitions

### Task Entity States
1.  **`PENDING`**: Created, not yet started. Can be edited or deleted by the owner.
2.  **`IN_PROGRESS`**: Actively being worked on. Triggers UI animations for peers. Cannot be deleted without reverting to PENDING.
3.  **`COMPLETED`**: Done. Points calculated and immutable. Proof is attached.
4.  **`EXPIRED`**: (Edge case) Task was not completed by the midnight reset. Yields 0 points.

---

## 5. Error Handling & Edge Cases

*   **Network Failure during Completion:** If the Supabase image upload succeeds but the FastAPI point calculation fails, the frontend must retry the FastAPI request to prevent "orphan" proof files and lost points.
*   **The 11:59 PM Submission:** If a user clicks submit at 11:59 PM, but the API processes it at 12:00:01 AM, the backend must inspect the `created_at` or request timestamp to credit the points to the correct day's snapshot.
*   **Over-logging Hours:** FastAPI must reject any `actual_hours` payload that pushes a user's total daily logged hours above 24. It will return a `400 Bad Request: "Cannot log more than 24 hours in a single day."`