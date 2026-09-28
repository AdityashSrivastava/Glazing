# Product Requirements Document (PRD): Glazing
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Target Audience:** Adityash, Manas, Shivansh, Praveen, and Harshit.

---

## 1. Executive Summary & Product Vision
**Glazing** is a highly competitive, private accountability platform designed exclusively for a closed group of five individuals. The primary objective is to foster a gamified environment where users compete for maximum productivity through peer pressure, transparent task tracking, and verifiable proof of work. 

Unlike traditional productivity tools, Glazing is built on the concept of a continuous "race." It combines long-term goal tracking with daily execution, utilizing a point-based leaderboard system that resets dynamically. The platform assumes high trust but enforces strict accountability through evidence uploads and time-estimation accuracy.

## 2. User Roles & Authentication
*   **Target Users:** Exactly 5 pre-defined users. 
*   **Authentication Model:** Closed-loop authentication. There is no public registration, no "forgot password" flow, and no onboarding. Accounts are manually seeded into the database (via Supabase Auth) by the administrator.
*   **Permissions:** All 5 users have equal permissions (Standard User). 

## 3. Core Functional Requirements (Features)

### 3.1. Goals and Task Management
The system differentiates between Macro (Goals) and Micro (Tasks) achievements.
*   **Long-Term Goals:**
    *   Users can define overarching goals (e.g., "Master FastAPI," "Complete 100 LeetCode Problems").
    *   Goals must have a Title, Category (e.g., DSA, Development, College Studies, Gym, Life), and a Status (Active, Completed).
    *   Goals act as "folders" or tags for daily tasks.
*   **Daily Tasks:**
    *   Users create tasks they intend to complete *today*.
    *   **Required Fields:** Title, Estimated Time (in hours), Visibility (Public vs. Private).
    *   **Optional Fields:** Associated Goal ID.
*   **The Privacy Toggle (Public vs. Private):**
    *   If a task is marked `Public`, all users can see the title, linked goal, and proof of work.
    *   If a task is marked `Private`, the task still contributes to the user's daily total hours and leaderboard points. However, the system must mask the UI for other users.
    *   *Masking Rules:* Title is replaced with `"CLASSIFIED TASK"`. Goal is hidden. Proof of work is hidden. Only the hours logged and points earned are visible to peers.

### 3.2. Execution & State Tracking
*   **Live Status / "Deep Focus":**
    *   Users can toggle their status to "In Progress" or "Deep Focus" on a specific task.
    *   This triggers a visual indicator on the dashboard (e.g., a pulsating green dot next to their avatar) so peers know they are actively working.
*   **Completion Workflow (The Pop-up):**
    *   When a user clicks "Finish" on a task, a mandatory modal appears.
    *   **Input 1 (Required):** `Actual Hours Spent`. The user logs the realistic time it took.
    *   **Input 2 (Required):** `Proof of Work`. The user must provide a URL, a GitHub commit link, or upload an image (screenshot of code, gym selfie, etc.).
    *   *Edge Case Handling:* A user cannot log more than 24 hours in a single day. 

### 3.3. Gamification, Points & The Leaderboard
*   **Point Calculation Algorithm:**
    *   *Base Points:* `Actual Hours * 10`
    *   *Completion Bonus:* `+5` points for finishing the task.
    *   *Accuracy Bonus:* If `Actual Hours` matches `Estimated Hours` within a 15-minute margin, award `+5` points. (Encourages realistic planning).
*   **Leaderboard Mechanics:**
    *   **Daily Leaderboard:** Ranks users based on points earned *today*. 
    *   **Weekly Leaderboard:** An aggregation of daily points, running from Monday 12:00 AM to Sunday 11:59 PM.
*   **The Midnight Reset (Crucial):**
    *   At exactly 12:00 AM IST (Indian Standard Time), the daily leaderboard takes a database snapshot.
    *   The active daily board is wiped clean for the new day.
    *   Yesterday's stats become immutable and are moved to the "History" tab.

### 3.4. Social Mechanics & Peer Pressure
*   **The Feed:** The central dashboard features a real-time activity feed showing who just started a task, who finished one, and who went into Deep Focus.
*   **Bounties (Stretch Goal/Phase 2):** Users can stake their own points to place a bounty on another user's task to incentivize them to finish it by midnight.
*   **Nudges:** A button on the sidebar to send a ping/notification to a user who has 0 points for the day by 8:00 PM.

## 4. User Journey & Application Flow
1.  **Morning Initialization:** User logs in. Views yesterday's results and current weekly standings.
2.  **Planning:** User navigates to the Sidebar -> "Add Task". Submits 2 tasks for the day, linking one to a Long-Term Goal. Sets one to Private.
3.  **The Grind:** User starts working and toggles "Deep Focus". Other users see this live on the dashboard.
4.  **The Drop:** User finishes the task. Clicks "Complete". The modal prompts for actual time and proof. User uploads a screenshot.
5.  **The Reward:** The backend calculates points. The user jumps from 3rd place to 1st place on the Daily Leaderboard. A notification appears in the Feed.

## 5. Non-Functional Requirements (NFRs)
*   **Performance:** The dashboard feed and leaderboard should ideally fetch fresh data without manual page reloads (using React Query polling or WebSockets).
*   **Security & Privacy:** The masking of `Private` tasks must happen at the backend (FastAPI) layer. The frontend should never receive the actual text of a private task belonging to another user.
*   **Timezone:** The entire application operates strictly on IST (UTC +5:30). All database timestamps and cron jobs for resets must be calibrated to IST.
*   **Device Support:** Desktop-first design. Since the users are developers/students, the UI must be optimized for wide screens, dark environments, and dense data display. Mobile responsiveness is secondary.

## 6. Design & UI/UX Principles
*   **Aesthetic:** "Hacker/Terminal". High-contrast dark mode only. Deep blacks (`#09090b`), slate grays, and neon accents (emerald for success, crimson for missed deadlines).
*   **Typography:** Monospace fonts for all numbers, times, and leaderboard scores to emphasize the data. Clean sans-serif for task descriptions.
*   **Layout:** 3-column architecture (Left Nav/Goals -> Center Feed -> Right Leaderboards).

## 7. Assumptions & Constraints
*   Users will not maliciously attempt to hack the point system (e.g., logging 15 hours for a 1-hour task), as social accountability and the "Proof of Work" check prevent this.
*   Supabase free tier limits are sufficient for 5 users.
*   Image uploads (proof) will be compressed to save storage space.