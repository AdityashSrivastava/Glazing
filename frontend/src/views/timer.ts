import { supabase } from '../supabase';
import { apiFetch } from '../api';
import { escapeHtml } from '../utils';
import { renderNavbar, setupNavbarLogic, showNotification } from './components/navbar';
import { renderCompleteModal, openCompleteTaskModal, setupCompleteModalLogic } from './components/complete_modal';

interface FocusRecord {
  id: string;
  user_id: string;
  task_id?: string | null;
  task_title: string;
  duration_minutes: number;
  mode: 'pomo' | 'stopwatch';
  started_at: string;
  completed_at: string;
  created_at: string;
}

interface TimerStats {
  todays_pomos: number;
  todays_focus_duration_minutes: number;
  total_pomos: number;
  total_focus_duration_minutes: number;
}

interface UserTask {
  id: string;
  title: string;
  estimated_hours: number;
  goal_title?: string | null;
  category?: string | null;
  status: string;
  tracked_timer_minutes?: number;
  tracked_timer_hours?: number;
}

// Timer State
let timerMode: 'pomo' | 'stopwatch' = 'pomo';
let pomoDurationSeconds = 50 * 60; // 50:00 default (matching screenshot)
let timerSecondsRemaining = pomoDurationSeconds;
let stopwatchElapsedSeconds = 0;
let timerInterval: any = null;
let isTimerRunning = false;
let sessionStartTime: Date | null = null;

// Selected task
let selectedTaskId: string | null = null;
let selectedTaskTitle: string = 'General Deep Work';

// Cached data
let myTasks: UserTask[] = [];
let currentUserId = '';

export function renderTimer(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col selection:bg-accent selection:text-white">
      ${renderNavbar('timer')}

      <!-- Main Layout: 2 Columns (Timer Left, Overview & Record Right) -->
      <main class="flex-1 w-full max-w-[1240px] mx-auto p-4 md:p-8">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- LEFT / CENTER PANEL: Timer & Focus Control (7 cols) -->
          <div class="lg:col-span-7 flex flex-col items-center theme-card p-6 md:p-10 relative overflow-hidden">
            
            <!-- Header Controls: Title & Mode Toggle -->
            <div class="w-full flex items-center justify-between mb-8 pb-4 border-b border-border/60">
              <h2 class="text-2xl font-bold text-primary tracking-tight">Pomodoro</h2>

              <!-- Mode Switcher: [ Pomo ] | [ Stopwatch ] -->
              <div class="flex items-center p-1 rounded-xl bg-surface border border-border">
                <button 
                  id="mode-pomo-btn" 
                  class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${timerMode === 'pomo' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-primary'}"
                >
                  Pomo
                </button>
                <button 
                  id="mode-stopwatch-btn" 
                  class="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${timerMode === 'stopwatch' ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-primary'}"
                >
                  Stopwatch
                </button>
              </div>
            </div>

            <!-- Focus Task Selector Button (Focus >) & Quick Complete -->
            <div class="mb-6 flex flex-col items-center">
              <div class="flex items-center gap-2">
                <button 
                  id="open-task-selector-btn" 
                  class="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface border border-border hover:border-accent/60 transition-all text-xs font-medium text-body hover:text-primary cursor-pointer shadow-sm"
                >
                  <span class="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                  <span id="focus-task-label" class="max-w-[260px] truncate">Focus ></span>
                  <svg class="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
                <button 
                  id="timer-complete-task-btn" 
                  type="button"
                  class="hidden px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 transition-all text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1.5 animate-in fade-in"
                  title="Finalize and claim gamification points for this task"
                >
                  <span>⚡ Complete Task</span>
                </button>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <span id="linked-goal-pill" class="text-[10px] font-mono text-muted hidden"></span>
                <span id="task-tracked-time-pill" class="text-[10px] font-mono text-accent hidden"></span>
              </div>
            </div>

            <!-- Large Circular Progress Timer -->
            <div class="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-8 select-none">
              <!-- SVG Ring -->
              <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <!-- Background Circle -->
                <circle 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  class="text-surface/80 dark:text-border/40" 
                  stroke-width="2.5"
                />
                <!-- Animated Progress Circle -->
                <circle 
                  id="timer-progress-ring" 
                  cx="50" 
                  cy="50" 
                  r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  class="text-accent transition-all duration-300" 
                  stroke-width="3" 
                  stroke-dasharray="283" 
                  stroke-dashoffset="0" 
                  stroke-linecap="round"
                />
              </svg>

              <!-- Central Digital Time Display -->
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span id="timer-digits" class="text-5xl md:text-6xl font-black font-mono tracking-tighter text-primary">
                  50:00
                </span>
                <span id="timer-status-hint" class="text-[11px] font-mono text-muted uppercase tracking-wider mt-2">
                  Ready to Focus
                </span>
              </div>
            </div>

            <!-- Presets Strip (Pomo Mode) -->
            <div id="pomo-presets-container" class="flex items-center gap-2 mb-8">
              <button data-duration="25" class="preset-btn px-3 py-1 rounded-lg text-xs font-mono font-medium border border-border text-muted hover:text-primary hover:border-accent/40 transition-all">25m</button>
              <button data-duration="50" class="preset-btn px-3 py-1 rounded-lg text-xs font-mono font-bold border border-accent bg-accent/10 text-accent transition-all">50m</button>
              <button data-duration="90" class="preset-btn px-3 py-1 rounded-lg text-xs font-mono font-medium border border-border text-muted hover:text-primary hover:border-accent/40 transition-all">90m</button>
              <button id="custom-time-btn" class="px-3 py-1 rounded-lg text-xs font-mono text-muted hover:text-primary border border-border hover:border-accent/40 transition-all">Custom</button>
            </div>

            <!-- Primary Action Controls -->
            <div class="flex items-center gap-4">
              <!-- Start / Pause Button (Large Blue Pill Matching Screenshot) -->
              <button 
                id="timer-start-btn" 
                class="w-40 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer"
              >
                Start
              </button>

              <!-- Reset / Log Controls (shown when active/paused) -->
              <button 
                id="timer-reset-btn" 
                class="p-3 rounded-full border border-border hover:bg-surface text-muted hover:text-primary transition-colors cursor-pointer hidden" 
                title="Reset Timer"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>

              <button 
                id="timer-finish-early-btn" 
                class="px-4 py-2.5 rounded-full border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-mono text-xs font-bold transition-all cursor-pointer hidden"
              >
                Finish & Log
              </button>
            </div>

          </div>

          <!-- RIGHT PANEL: Overview & Focus Record (5 cols) -->
          <div class="lg:col-span-5 space-y-6">
            
            <!-- Overview Bento Grid (2x2) -->
            <div class="theme-card p-6 space-y-4">
              <h3 class="text-sm font-bold text-primary tracking-tight">Overview</h3>

              <div class="grid grid-cols-2 gap-3 font-mono">
                <!-- Today's Pomos -->
                <div class="p-3.5 rounded-xl bg-surface/70 border border-border/80">
                  <span class="text-[10px] text-muted uppercase tracking-wider block">Today's Pomos</span>
                  <span id="overview-today-pomos" class="text-2xl font-black text-primary mt-1 block">0</span>
                </div>

                <!-- Today's Focus Duration -->
                <div class="p-3.5 rounded-xl bg-surface/70 border border-border/80">
                  <span class="text-[10px] text-muted uppercase tracking-wider block">Today's Focus Duration</span>
                  <span id="overview-today-duration" class="text-2xl font-black text-primary mt-1 block">0 m</span>
                </div>

                <!-- Total Pomos -->
                <div class="p-3.5 rounded-xl bg-surface/70 border border-border/80">
                  <span class="text-[10px] text-muted uppercase tracking-wider block">Total Pomos</span>
                  <span id="overview-total-pomos" class="text-2xl font-black text-primary mt-1 block">0</span>
                </div>

                <!-- Total Focus Duration -->
                <div class="p-3.5 rounded-xl bg-surface/70 border border-border/80">
                  <span class="text-[10px] text-muted uppercase tracking-wider block">Total Focus Duration</span>
                  <span id="overview-total-duration" class="text-2xl font-black text-primary mt-1 block">0 m</span>
                </div>
              </div>
            </div>

            <!-- Focus Record Timeline Section -->
            <div class="theme-card p-6 space-y-4">
              <div class="flex items-center justify-between pb-3 border-b border-border/60">
                <h3 class="text-sm font-bold text-primary tracking-tight">Focus Record</h3>
                <button id="open-manual-log-btn" class="p-1 rounded-md text-muted hover:text-primary hover:bg-surface transition-colors" title="Manually Log Session">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
              </div>

              <!-- Records Timeline Container -->
              <div id="focus-records-timeline" class="space-y-6 max-h-[460px] overflow-y-auto pr-1">
                <div class="text-center py-12 text-muted font-mono text-xs">
                  Loading focus telemetry...
                </div>
              </div>
            </div>

          </div>

        </div>

      </main>

      <!-- Task Selector Drawer / Modal (Triggered by Focus >) -->
      <div id="task-selector-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
        <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 space-y-4">
          
          <div class="flex justify-between items-center pb-3 border-b border-border">
            <div>
              <h3 class="text-sm font-bold tracking-wider text-primary uppercase">Select Focus Task</h3>
              <p class="text-xs text-muted mt-0.5">Link your timer session directly to an operative execution.</p>
            </div>
            <button id="close-task-selector-btn" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
          </div>

          <!-- Search Input -->
          <div class="relative">
            <input 
              type="text" 
              id="task-selector-search" 
              placeholder="Search your pending tasks..." 
              class="theme-input text-xs py-2 w-full"
            />
          </div>

          <!-- Standalone Deep Work Option -->
          <div 
            id="standalone-deepwork-option" 
            class="p-3 rounded-xl border border-dashed border-border hover:border-accent hover:bg-accent/[0.04] transition-all cursor-pointer flex items-center justify-between group"
          >
            <div class="flex items-center gap-2.5">
              <span class="w-7 h-7 rounded-lg bg-surface border border-border flex items-center justify-center text-sm">⚡</span>
              <div>
                <h4 class="text-xs font-bold text-primary group-hover:text-accent transition-colors">General Deep Work</h4>
                <p class="text-[10px] text-muted">Standalone focus block without linked task</p>
              </div>
            </div>
            <span class="text-xs font-mono text-muted">Select</span>
          </div>

          <!-- Task Items List -->
          <div class="text-[11px] font-mono text-muted uppercase tracking-wider font-semibold">Your Pending Tasks:</div>
          <div id="task-selector-list" class="space-y-2 max-h-60 overflow-y-auto pr-1">
            <div class="text-center py-6 text-muted font-mono text-xs">Scanning pending directives...</div>
          </div>

        </div>
      </div>

      <!-- Manual Log Session Modal -->
      <div id="manual-log-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
        <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 space-y-4">
          <div class="flex justify-between items-center pb-3 border-b border-border">
            <h3 class="text-sm font-bold tracking-wider text-primary uppercase">Manual Focus Entry</h3>
            <button id="close-manual-log-btn" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
          </div>

          <form id="manual-log-form" class="space-y-4">
            <div>
              <label class="block text-[11px] font-semibold uppercase mb-1 text-muted">Task Description</label>
              <input type="text" id="manual-task-title" required class="theme-input text-xs" placeholder="e.g. Code Review & Refactoring" />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase mb-1 text-muted">Duration (Minutes)</label>
              <input type="number" id="manual-duration-mins" required min="5" max="360" class="theme-input font-mono text-xs" value="25" />
            </div>

            <button type="submit" class="btn-primary w-full py-2 text-xs font-bold tracking-wider uppercase font-mono mt-2">
              Save Focus Record
            </button>
          </form>
        </div>
      </div>

      <!-- Complete Task Execution Modal -->
      ${renderCompleteModal()}

    </div>
  `;
}

export function setupTimerLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);

  // Initialize Elements
  const startBtn = document.getElementById('timer-start-btn') as HTMLButtonElement;
  const resetBtn = document.getElementById('timer-reset-btn') as HTMLButtonElement;
  const finishEarlyBtn = document.getElementById('timer-finish-early-btn') as HTMLButtonElement;
  const digitsEl = document.getElementById('timer-digits') as HTMLSpanElement;
  const statusHint = document.getElementById('timer-status-hint') as HTMLSpanElement;
  const progressRing = document.getElementById('timer-progress-ring') as unknown as SVGCircleElement;

  const modePomoBtn = document.getElementById('mode-pomo-btn') as HTMLButtonElement;
  const modeStopwatchBtn = document.getElementById('mode-stopwatch-btn') as HTMLButtonElement;
  const pomoPresets = document.getElementById('pomo-presets-container') as HTMLDivElement;

  // Task Selector Elements
  const openTaskSelectorBtn = document.getElementById('open-task-selector-btn') as HTMLButtonElement;
  const taskSelectorModal = document.getElementById('task-selector-modal') as HTMLDivElement;
  const closeTaskSelectorBtn = document.getElementById('close-task-selector-btn') as HTMLButtonElement;
  const taskSelectorSearch = document.getElementById('task-selector-search') as HTMLInputElement;
  const standaloneOption = document.getElementById('standalone-deepwork-option') as HTMLDivElement;
  const focusTaskLabel = document.getElementById('focus-task-label') as HTMLSpanElement;
  const timerCompleteTaskBtn = document.getElementById('timer-complete-task-btn') as HTMLButtonElement;

  // Manual Log Modal Elements
  const manualLogBtn = document.getElementById('open-manual-log-btn') as HTMLButtonElement;
  const manualLogModal = document.getElementById('manual-log-modal') as HTMLDivElement;
  const closeManualLogBtn = document.getElementById('close-manual-log-btn') as HTMLButtonElement;
  const manualLogForm = document.getElementById('manual-log-form') as HTMLFormElement;

  // Setup Complete Task Modal Logic for timer view
  setupCompleteModalLogic(async () => {
    if (selectedTaskId) {
      myTasks = myTasks.filter(t => t.id !== selectedTaskId);
      selectedTaskId = null;
      selectedTaskTitle = 'General Deep Work';
      if (focusTaskLabel) focusTaskLabel.textContent = 'Focus >';
      if (timerCompleteTaskBtn) timerCompleteTaskBtn.classList.add('hidden');
      const goalPill = document.getElementById('linked-goal-pill');
      if (goalPill) goalPill.classList.add('hidden');
      const timePill = document.getElementById('task-tracked-time-pill');
      if (timePill) timePill.classList.add('hidden');
    }
    showNotification('Task completed & points awarded!');
    await loadTimerStatsAndRecords();
  });

  // Complete Task Button Handler
  if (timerCompleteTaskBtn) {
    timerCompleteTaskBtn.addEventListener('click', async () => {
      if (!selectedTaskId) return;
      const task = myTasks.find(t => t.id === selectedTaskId);
      
      let timerMins = 0;
      let timerHours = 0;
      try {
        const durationData = await apiFetch(`/timer/task/${selectedTaskId}/duration`);
        if (durationData) {
          timerMins = durationData.total_focus_minutes || 0;
          timerHours = durationData.total_focus_hours || 0;
        }
      } catch (err) {
        console.error("Could not fetch task focus duration:", err);
      }

      openCompleteTaskModal({
        taskId: selectedTaskId,
        title: selectedTaskTitle,
        estHours: task?.estimated_hours || 1.0,
        trackedTimerMinutes: timerMins,
        trackedTimerHours: timerHours,
        category: task?.category || null
      });
    });
  }

  // 1. Load Initial Data
  initTimerView();

  // 2. Mode Toggle Handling
  if (modePomoBtn && modeStopwatchBtn) {
    modePomoBtn.addEventListener('click', () => {
      if (timerMode === 'pomo') return;
      if (isTimerRunning) {
        if (!confirm('Switching modes will reset your current timer. Continue?')) return;
      }
      timerMode = 'pomo';
      resetTimer();
      modePomoBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all bg-accent text-white shadow-sm';
      modeStopwatchBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all text-muted hover:text-primary';
      if (pomoPresets) pomoPresets.classList.remove('hidden');
      updateDisplay();
    });

    modeStopwatchBtn.addEventListener('click', () => {
      if (timerMode === 'stopwatch') return;
      if (isTimerRunning) {
        if (!confirm('Switching modes will reset your current timer. Continue?')) return;
      }
      timerMode = 'stopwatch';
      resetTimer();
      modeStopwatchBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all bg-accent text-white shadow-sm';
      modePomoBtn.className = 'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all text-muted hover:text-primary';
      if (pomoPresets) pomoPresets.classList.add('hidden');
      updateDisplay();
    });
  }

  // 3. Preset Duration Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (isTimerRunning) return;
      const target = e.currentTarget as HTMLButtonElement;
      const mins = parseInt(target.getAttribute('data-duration') || '50', 10);
      
      document.querySelectorAll('.preset-btn').forEach(b => {
        b.className = 'preset-btn px-3 py-1 rounded-lg text-xs font-mono font-medium border border-border text-muted hover:text-primary hover:border-accent/40 transition-all';
      });
      target.className = 'preset-btn px-3 py-1 rounded-lg text-xs font-mono font-bold border border-accent bg-accent/10 text-accent transition-all';

      pomoDurationSeconds = mins * 60;
      timerSecondsRemaining = pomoDurationSeconds;
      updateDisplay();
    });
  });

  const customTimeBtn = document.getElementById('custom-time-btn');
  if (customTimeBtn) {
    customTimeBtn.addEventListener('click', () => {
      if (isTimerRunning) return;
      const input = prompt('Enter custom session duration in minutes (1 - 180):', '45');
      if (!input) return;
      const mins = parseInt(input, 10);
      if (isNaN(mins) || mins < 1 || mins > 180) {
        alert('Please enter a duration between 1 and 180 minutes.');
        return;
      }
      pomoDurationSeconds = mins * 60;
      timerSecondsRemaining = pomoDurationSeconds;
      updateDisplay();
    });
  }

  // 4. Timer Controls (Start / Pause / Reset / Finish)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (isTimerRunning) {
        pauseTimer();
      } else {
        startTimer();
      }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the timer?')) {
        resetTimer();
      }
    });
  }

  if (finishEarlyBtn) {
    finishEarlyBtn.addEventListener('click', async () => {
      await handleSessionComplete(true);
    });
  }

  // 5. Task Selector Modal Logic
  if (openTaskSelectorBtn && taskSelectorModal) {
    openTaskSelectorBtn.addEventListener('click', () => {
      taskSelectorModal.classList.remove('hidden');
      renderTaskSelectorList();
    });
  }

  if (closeTaskSelectorBtn && taskSelectorModal) {
    closeTaskSelectorBtn.addEventListener('click', () => taskSelectorModal.classList.add('hidden'));
    taskSelectorModal.addEventListener('click', (e) => {
      if (e.target === taskSelectorModal) taskSelectorModal.classList.add('hidden');
    });
  }

  if (standaloneOption) {
    standaloneOption.addEventListener('click', () => {
      selectedTaskId = null;
      selectedTaskTitle = 'General Deep Work';
      if (focusTaskLabel) focusTaskLabel.textContent = 'Focus >';
      const goalPill = document.getElementById('linked-goal-pill');
      if (goalPill) goalPill.classList.add('hidden');
      const timePill = document.getElementById('task-tracked-time-pill');
      if (timePill) timePill.classList.add('hidden');
      const completeBtn = document.getElementById('timer-complete-task-btn');
      if (completeBtn) completeBtn.classList.add('hidden');
      taskSelectorModal.classList.add('hidden');
    });
  }

  if (taskSelectorSearch) {
    taskSelectorSearch.addEventListener('input', () => {
      renderTaskSelectorList();
    });
  }

  // 6. Manual Log Modal Logic
  if (manualLogBtn && manualLogModal) {
    manualLogBtn.addEventListener('click', () => manualLogModal.classList.remove('hidden'));
  }
  if (closeManualLogBtn && manualLogModal) {
    closeManualLogBtn.addEventListener('click', () => manualLogModal.classList.add('hidden'));
    manualLogModal.addEventListener('click', (e) => {
      if (e.target === manualLogModal) manualLogModal.classList.add('hidden');
    });
  }

  if (manualLogForm) {
    manualLogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const taskTitle = (document.getElementById('manual-task-title') as HTMLInputElement).value;
      const durationMins = parseInt((document.getElementById('manual-duration-mins') as HTMLInputElement).value, 10);

      const now = new Date();
      const started = new Date(now.getTime() - durationMins * 60 * 1000);

      try {
        await apiFetch('/timer/session', {
          method: 'POST',
          body: JSON.stringify({
            task_title: taskTitle,
            duration_minutes: durationMins,
            mode: 'pomo',
            started_at: started.toISOString(),
            completed_at: now.toISOString()
          })
        });

        manualLogModal.classList.add('hidden');
        manualLogForm.reset();
        showNotification(`Logged ${durationMins}m focus session!`);
        await loadTimerStatsAndRecords();
      } catch (err: any) {
        alert(`Failed to save record: ${err.message}`);
      }
    });
  }

  // Helper Functions inside setup
  function startTimer() {
    isTimerRunning = true;
    sessionStartTime = sessionStartTime || new Date();

    startBtn.textContent = 'Pause';
    startBtn.className = 'w-40 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm tracking-wide shadow-lg hover:shadow-amber-500/25 transition-all transform active:scale-95 cursor-pointer';

    if (resetBtn) resetBtn.classList.remove('hidden');
    if (finishEarlyBtn) finishEarlyBtn.classList.remove('hidden');
    if (statusHint) statusHint.textContent = `In Focus: ${selectedTaskTitle}`;

    timerInterval = setInterval(() => {
      if (timerMode === 'pomo') {
        timerSecondsRemaining--;
        if (timerSecondsRemaining <= 0) {
          timerSecondsRemaining = 0;
          updateDisplay();
          handleSessionComplete(false);
          return;
        }
      } else {
        stopwatchElapsedSeconds++;
      }
      updateDisplay();
    }, 1000);
  }

  function pauseTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);

    startBtn.textContent = 'Resume';
    startBtn.className = 'w-40 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer';

    if (statusHint) statusHint.textContent = 'Paused';
  }

  function resetTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
    sessionStartTime = null;

    timerSecondsRemaining = pomoDurationSeconds;
    stopwatchElapsedSeconds = 0;

    startBtn.textContent = 'Start';
    startBtn.className = 'w-40 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-blue-500/25 transition-all transform active:scale-95 cursor-pointer';

    if (resetBtn) resetBtn.classList.add('hidden');
    if (finishEarlyBtn) finishEarlyBtn.classList.add('hidden');
    if (statusHint) statusHint.textContent = 'Ready to Focus';

    updateDisplay();
  }

  async function handleSessionComplete(isEarly: boolean) {
    clearInterval(timerInterval);
    isTimerRunning = false;

    playChimeSound();

    const now = new Date();
    const start = sessionStartTime || new Date(now.getTime() - (timerMode === 'pomo' ? pomoDurationSeconds : stopwatchElapsedSeconds) * 1000);

    let durationMins = 0;
    if (timerMode === 'pomo') {
      const elapsed = isEarly ? (pomoDurationSeconds - timerSecondsRemaining) : pomoDurationSeconds;
      durationMins = Math.max(1, Math.round(elapsed / 60));
    } else {
      durationMins = Math.max(1, Math.round(stopwatchElapsedSeconds / 60));
    }

    try {
      await apiFetch('/timer/session', {
        method: 'POST',
        body: JSON.stringify({
          task_id: selectedTaskId,
          task_title: selectedTaskTitle,
          duration_minutes: durationMins,
          mode: timerMode,
          started_at: start.toISOString(),
          completed_at: now.toISOString()
        })
      });

      showNotification(`🎉 Great focus! ${durationMins} minutes recorded.`);
      resetTimer();
      await loadTimerStatsAndRecords();

      // If a specific task was selected, offer to complete it with auto-fed duration
      if (selectedTaskId) {
        const shouldComplete = confirm(`Session completed for "${selectedTaskTitle}"! Would you like to finalize and claim your points for this task now?`);
        if (shouldComplete) {
          const completeBtn = document.getElementById('timer-complete-task-btn');
          if (completeBtn) {
            completeBtn.click();
          }
        }
      }
    } catch (e: any) {
      alert(`Session finished but failed to save record: ${e.message}`);
      resetTimer();
    }
  }

  function updateDisplay() {
    let totalSec = timerMode === 'pomo' ? timerSecondsRemaining : stopwatchElapsedSeconds;
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (digitsEl) digitsEl.textContent = formatted;

    // Update Progress Ring
    if (progressRing) {
      const circumference = 2 * Math.PI * 45; // 282.74
      if (timerMode === 'pomo') {
        const progress = timerSecondsRemaining / pomoDurationSeconds;
        const offset = circumference * (1 - progress);
        progressRing.style.strokeDashoffset = String(offset);
      } else {
        // Stopwatch loop every 60s
        const progress = (stopwatchElapsedSeconds % 60) / 60;
        const offset = circumference * (1 - progress);
        progressRing.style.strokeDashoffset = String(offset);
      }
    }
  }

  // Initial display update
  updateDisplay();
}

async function initTimerView() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user.id || '';

    // Load user's pending tasks for the focus selector
    try {
      const feed = await apiFetch('/tasks/feed');
      myTasks = (feed || []).filter((t: any) => t.user_id === currentUserId && (t.status === 'PENDING' || t.status === 'IN_PROGRESS'));
    } catch (e) {
      console.error("Error loading user tasks for timer:", e);
    }

    await loadTimerStatsAndRecords();
  } catch (err) {
    console.error("Timer initialization error:", err);
  }
}

async function loadTimerStatsAndRecords() {
  try {
    const [stats, records] = await Promise.all([
      apiFetch('/timer/stats'),
      apiFetch('/timer/records')
    ]);

    updateOverviewCards(stats);
    renderFocusRecordTimeline(records || []);
  } catch (e) {
    console.error("Failed to load timer stats:", e);
  }
}

function updateOverviewCards(stats: TimerStats) {
  const elTodayPomos = document.getElementById('overview-today-pomos');
  const elTodayDur = document.getElementById('overview-today-duration');
  const elTotalPomos = document.getElementById('overview-total-pomos');
  const elTotalDur = document.getElementById('overview-total-duration');

  if (elTodayPomos) elTodayPomos.textContent = String(stats.todays_pomos || 0);
  if (elTodayDur) elTodayDur.textContent = formatDuration(stats.todays_focus_duration_minutes || 0);
  if (elTotalPomos) elTotalPomos.textContent = String(stats.total_pomos || 0);
  if (elTotalDur) elTotalDur.textContent = formatDuration(stats.total_focus_duration_minutes || 0);
}

function formatDuration(totalMins: number): string {
  if (totalMins < 60) return `${totalMins} m`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hrs} h ${mins} m` : `${hrs} h`;
}

function renderTaskSelectorList() {
  const container = document.getElementById('task-selector-list');
  const searchInput = document.getElementById('task-selector-search') as HTMLInputElement;
  const q = (searchInput?.value || '').trim().toLowerCase();

  if (!container) return;

  let filtered = myTasks;
  if (q) {
    filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || (t.goal_title && t.goal_title.toLowerCase().includes(q)));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-muted font-mono text-xs">
        No matching pending tasks found.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div 
      data-task-id="${t.id}" 
      data-task-title="${encodeURIComponent(t.title)}" 
      data-goal-title="${encodeURIComponent(t.goal_title || '')}"
      class="task-selector-item p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/[0.04] transition-all cursor-pointer flex items-center justify-between group"
    >
      <div class="flex items-center gap-2.5">
        <span class="w-2 h-2 rounded-full bg-accent group-hover:scale-125 transition-transform"></span>
        <div>
          <h4 class="text-xs font-bold text-primary group-hover:text-accent transition-colors">${escapeHtml(t.title)}</h4>
          <div class="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-muted">
            <span>Target: ${t.estimated_hours}h</span>
            ${t.goal_title ? `<span class="text-accent">• 🎯 ${escapeHtml(t.goal_title)}</span>` : ''}
          </div>
        </div>
      </div>
      <span class="text-xs font-mono text-muted group-hover:text-primary transition-colors">Select</span>
    </div>
  `).join('');

  container.querySelectorAll('.task-selector-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLDivElement;
      const tid = target.getAttribute('data-task-id');
      const ttitle = decodeURIComponent(target.getAttribute('data-task-title') || '');
      const gtitle = decodeURIComponent(target.getAttribute('data-goal-title') || '');

      selectedTaskId = tid;
      selectedTaskTitle = ttitle;

      const label = document.getElementById('focus-task-label');
      if (label) label.textContent = `Focus: ${ttitle} >`;

      const goalPill = document.getElementById('linked-goal-pill');
      if (goalPill) {
        if (gtitle) {
          goalPill.textContent = `🎯 ${gtitle}`;
          goalPill.classList.remove('hidden');
        } else {
          goalPill.classList.add('hidden');
        }
      }

      const completeBtn = document.getElementById('timer-complete-task-btn');
      if (completeBtn) completeBtn.classList.remove('hidden');

      // Update tracked time pill
      const timePill = document.getElementById('task-tracked-time-pill');
      if (timePill && tid) {
        try {
          const durationData = await apiFetch(`/timer/task/${tid}/duration`);
          if (durationData && durationData.total_focus_minutes > 0) {
            timePill.textContent = `⏱️ ${durationData.total_focus_minutes}m focused (~${durationData.total_focus_hours}h)`;
            timePill.classList.remove('hidden');
          } else {
            timePill.classList.add('hidden');
          }
        } catch {
          timePill.classList.add('hidden');
        }
      }

      document.getElementById('task-selector-modal')?.classList.add('hidden');
    });
  });
}

function renderFocusRecordTimeline(records: FocusRecord[]) {
  const container = document.getElementById('focus-records-timeline');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-muted font-mono text-xs">
        No focus sessions recorded yet. Start your first Pomodoro!
      </div>
    `;
    return;
  }

  // Group records by date string (e.g., 'Today', 'Yesterday', 'Aug 12')
  const groups: Record<string, FocusRecord[]> = {};
  const todayStr = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  records.forEach(r => {
    const d = new Date(r.completed_at);
    let groupKey = '';
    if (d.toDateString() === todayStr) groupKey = 'Today';
    else if (d.toDateString() === yesterday) groupKey = 'Yesterday';
    else groupKey = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(r);
  });

  container.innerHTML = Object.entries(groups).map(([dateLabel, groupItems]) => `
    <div class="space-y-3">
      <!-- Date Heading -->
      <div class="text-xs font-bold text-muted font-mono tracking-tight">${dateLabel}</div>

      <!-- Timeline Entries -->
      <div class="relative pl-6 space-y-4 border-l-2 border-border/60 ml-2">
        ${groupItems.map(item => {
          const start = new Date(item.started_at);
          const end = new Date(item.completed_at);
          const timeRange = `${formatTime(start)} - ${formatTime(end)}`;

          return `
            <div class="relative group">
              <!-- Blue Node on Timeline (Matching Screenshot) -->
              <span class="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-bg shadow-sm"></span>

              <!-- Content Row -->
              <div class="flex items-center justify-between text-xs">
                <div>
                  <div class="font-mono text-[11px] text-primary font-medium">${timeRange}</div>
                  <div class="text-muted text-[11px] font-semibold mt-0.5 max-w-[200px] truncate" title="${escapeHtml(item.task_title)}">
                    ${escapeHtml(item.task_title)}
                  </div>
                </div>

                <!-- Right Pill: Duration (e.g. 50m) -->
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-bold text-body bg-surface px-2 py-0.5 rounded-md border border-border">
                    ${item.duration_minutes}m
                  </span>
                  <button 
                    data-record-id="${item.id}" 
                    class="delete-record-btn opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-400 p-1 transition-opacity" 
                    title="Delete Record"
                  >
                    &times;
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  // Attach delete handlers
  container.querySelectorAll('.delete-record-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const rid = (e.currentTarget as HTMLButtonElement).getAttribute('data-record-id');
      if (!rid) return;
      if (!confirm('Delete this focus session?')) return;

      try {
        await apiFetch(`/timer/session/${rid}`, { method: 'DELETE' });
        await loadTimerStatsAndRecords();
      } catch (err: any) {
        alert(`Failed to delete record: ${err.message}`);
      }
    });
  });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

function playChimeSound() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.2);
  } catch (e) {
    console.error("Audio playback not supported or user gesture required:", e);
  }
}
