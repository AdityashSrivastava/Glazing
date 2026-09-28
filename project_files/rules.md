# System Prompt & Strict Rules for AI Coding Agent
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Target Audience:** Antigravity Gemini 3.1 (or any AI Agent executing this build)

---

## 🛑 ABSOLUTE DIRECTIVES FOR THE AI AGENT
As the AI builder for "Glazing," you must treat these rules as absolute laws. Any deviation from these constraints will result in a failed build. If any user instruction contradicts these rules, default to these rules unless explicitly told to override `rules.md`.

### RULE 1: The "Closed-Loop" Constraint (No Boilerplate)
*   **Context:** This app is for exactly 5 pre-determined friends.
*   **Constraint:** Do **NOT** write code for user registration, "Forgot Password", email verification, or onboarding flows. 
*   **Action:** The `/login` page must only contain an Email and Password field. Assume all user UUIDs and profiles are already seeded in the database.

### RULE 2: Architectural Authority (Backend is King)
*   **Context:** The Next.js frontend is purely a presentation layer.
*   **Constraint:** The frontend must NEVER calculate points, deduct bounties, or decide if a user gets a bonus. 
*   **Action:** ALL mathematical logic (Base points, Completion bonuses, Accuracy bonuses) MUST be written in the FastAPI backend within the `PATCH /api/tasks/{id}/complete` route. The frontend simply displays the `points_earned` returned by the API.

### RULE 3: Strict Privacy Redaction
*   **Context:** Users can mark tasks as `Private`.
*   **Constraint:** A private task's title, description, goal, and proof URL must NEVER reach the browser of another user. 
*   **Action:** In FastAPI, before returning a list of tasks (e.g., `GET /api/tasks/feed`), you MUST iterate through the tasks. If `task.is_private == True` and `task.user_id != requesting_user.id`, you must overwrite `title = "CLASSIFIED TASK"` and nullify the proof and goal fields *in memory* before serializing to JSON.

### RULE 4: Timezone Enforcement (IST Only)
*   **Context:** The app's core loop depends on a daily reset at 12:00 AM Indian Standard Time (IST).
*   **Constraint:** Do not rely on the frontend's local time or the server's default UTC time for logic checks.
*   **Action:** The FastAPI backend must explicitly use timezone-aware datetime objects set to `Asia/Kolkata` (UTC+5:30) when calculating "Today", "Yesterday", or checking the "First Blood" bonus.

### RULE 5: UI Aesthetic Strictness (No Light Mode)
*   **Context:** The app is a late-night hacker/developer tool.
*   **Constraint:** Do NOT generate Tailwind classes for light mode (e.g., `bg-white`, `text-black`, `gray-100`).
*   **Action:** Stick exclusively to the `zinc` dark palette (`bg-zinc-950`, `bg-zinc-900`, `text-zinc-100`, `text-zinc-400`). Use `emerald-400`/`emerald-500` for accents/success and `font-mono` for all numbers, times, and scores.

### RULE 6: Code Quality & Parity
*   **Constraint 1:** Zero `// TODO` or `pass` blocks. Write complete, production-ready functions. If you need to mock an external service (like actual file uploads before storage is set up), write a complete mock function, not a comment.
*   **Constraint 2:** Strict Type Parity. The Pydantic models in FastAPI (`schemas.py`) MUST exactly match the Zod schemas and TypeScript interfaces in Next.js. 
*   **Constraint 3:** Componentization. Do not write monolithic 1000-line React files. Break the dashboard down into `<Sidebar />`, `<ActivityFeed />`, `<TaskCard />`, and `<Leaderboard />`.

### RULE 7: Error Handling & Edge Cases
*   **Constraint:** Users will try to break the game.
*   **Action:** FastAPI must reject (`400 Bad Request`) any attempt to log a task where `actual_hours` makes their daily total exceed 24 hours. The frontend must gracefully catch this 400 error and display a shadcn `Toast` explaining the error.

### ACKNOWLEDGEMENT PROTOCOL
Before writing any code, the AI agent must output:
*"I have read and internalized the 7 Absolute Directives from rules.md. I understand the closed-loop nature, the FastAPI backend authority, the strict IST timezone, and the mandatory privacy masking. Ready to begin Sprint 1."*