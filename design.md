# Design & UI/UX Architecture
**Document Version:** 2.0 (Expanded)
**Project Name:** Glazing
**Architecture:** Next.js (App Router) + Tailwind CSS + shadcn/ui

---

## 1. Core Aesthetic & Theming
**Glazing** is a late-night, developer-focused tool. It must feel premium, fast, and highly utilitarian. 

*   **Mode:** STRICTLY DARK MODE. The application does not support, nor should it contain any code for, a light mode.
*   **Vibe:** Cyber/Hacker, Terminal-inspired, high contrast, minimal fluff. 

### 1.1. Exact Color Palette (Tailwind Reference)
The AI Agent must stick strictly to this color scale:
*   **Background (App):** `bg-zinc-950` or `bg-black`
*   **Surface/Cards:** `bg-zinc-900`
*   **Borders:** `border-zinc-800`
*   **Primary Text:** `text-zinc-100`
*   **Muted/Secondary Text:** `text-zinc-400`
*   **Success/Points/Live Accent:** `text-emerald-400` and `bg-emerald-500/10`
*   **Error/Bounty Accent:** `text-rose-500` and `bg-rose-500/10`
*   **Warning/Pending:** `text-amber-500`

### 1.2. Typography
*   **Primary (Headers/Body):** `font-sans` (Inter or standard Next.js Geist Sans). Clean, readable.
*   **Data (Scores, Hours, Dates):** `font-mono` (Geist Mono, JetBrains Mono, or Fira Code). **Rule:** Any number related to the "race" (points, hours, timers) MUST be monospace to ensure vertical alignment on leaderboards.

---

## 2. Layout Architecture (The Dashboard)
The primary `/dashboard` view uses a strict 3-column layout, optimized for desktop displays (1080p and above).

### Column 1: Left Navigation (Width: 256px / `w-64`)
*   **Position:** Fixed on the left screen edge.
*   **Contents:**
    *   App Logo/Title ("GLAZING").
    *   Current User Profile summary (Avatar, Total Lifetime Points, Current Rank).
    *   Primary CTA: Large `bg-emerald-600 hover:bg-emerald-500` button for "Add Task".
    *   Navigation Links (Dashboard, Goals, History, Profile).

### Column 2: The Activity Feed (Flex: `flex-1`)
*   **Position:** Center column, scrollable.
*   **Contents:**
    *   A chronological timeline of events (Tasks started, completed, bounties issued).
    *   **Empty State:** "The feed is quiet... too quiet. Get to work."

### Column 3: The Arena / Leaderboards (Width: 320px / `w-80`)
*   **Position:** Fixed on the right screen edge.
*   **Contents:**
    *   **Top Half:** Daily Leaderboard (Ranks 1 to 5). Resets at midnight.
    *   **Bottom Half:** Weekly Leaderboard. 

---

## 3. Component-Level Specifications

### 3.1. Task Card (Public)
A standard card in the Activity Feed.
*   **Container:** `rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm`
*   **Header:** User Avatar + Name + "completed a task" in `text-zinc-400`.
*   **Body:** Task Title (`text-lg font-semibold text-zinc-100`).
*   **Footer:** Actual Hours (`font-mono text-zinc-400`) • Points Earned (`font-mono text-emerald-400 font-bold`).
*   **Proof Attachment:** If a proof image exists, render a small, clickable thumbnail `rounded-md object-cover h-24 w-full mt-2 opacity-80 hover:opacity-100 transition-opacity`.

### 3.2. Task Card (Private / Classified)
How a task looks when `is_private = true` and belongs to someone else.
*   **Container:** `rounded-lg border border-dashed border-zinc-800 bg-zinc-950 p-4`
*   **Masked Title UI:** Render a solid block with monospace text: 
    `<span className="inline-block bg-zinc-800 text-zinc-500 font-mono text-sm px-2 py-1 rounded select-none uppercase tracking-widest">[ CLASSIFIED DATA ]</span>`
*   **Footer:** Points are STILL visible (so the math makes sense to peers), but Hours and Proof are hidden.

### 3.3. Live "Deep Focus" Indicator
When a user sets a task to `IN_PROGRESS`.
*   **Visual:** A glowing dot next to their avatar on the leaderboard and feed.
*   **Tailwind:** `<span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>`
*   **Text:** Add a subtle `text-emerald-400 animate-pulse` label reading "In Deep Focus...".

### 3.4. Forms & Inputs (shadcn/ui)
*   **Inputs:** `bg-zinc-950 border-zinc-800 focus:ring-emerald-500 focus:border-emerald-500`.
*   **Labels:** `text-sm font-medium text-zinc-300`.

---

## 4. UI/UX Rules for the AI Agent
1.  **Never Use White Backgrounds:** Do not generate classes like `bg-white`, `text-black`, or `gray-100`. Strictly adhere to the `zinc` dark palette.
2.  **No Full-Page Reloads:** All form submissions (Task Complete, Add Task) must use client-side fetching/mutation (React Query or Next.js Server Actions with `revalidatePath`) and display a success Toast (shadcn `use-toast`) instead of reloading the page.
3.  **Loading States:** Use skeleton loaders (`animate-pulse bg-zinc-800 rounded`) for the feed and leaderboards while data is fetching. Do not use generic loading spinners unless inside a button during form submission.