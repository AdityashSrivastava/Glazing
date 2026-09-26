import { supabase } from '../supabase';
import { apiFetch } from '../api';
import { renderCompleteModal, openCompleteTaskModal, setupCompleteModalLogic } from './components/complete_modal';
import { renderNavbar, setupNavbarLogic } from './components/navbar';
import { escapeHtml } from '../utils';

interface Task {
  id: string;
  user_id: string;
  user_name: string;
  goal_id?: string | null;
  goal_title?: string | null;
  title: string;
  is_private: boolean;
  estimated_hours: number;
  actual_hours?: number | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  proof_url?: string | null;
  points_earned: number;
  active_bounties_count?: number;
  total_bounty_points?: number;
  bounty_issuers?: string[];
  is_sniper?: boolean;
  is_first_blood?: boolean;
  tracked_timer_minutes?: number;
  tracked_timer_hours?: number;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface FeedStats {
  active_in_progress_count: number;
  active_operatives_count: number;
  completed_today_count: number;
  hours_logged_today: number;
  points_scored_today: number;
  open_bounties_count: number;
  open_bounty_points: number;
}

// State
let allTasks: Task[] = [];
let allGoals: any[] = [];
let currentFilterStatus: 'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'BOUNTY' = 'ALL';
let currentFilterOperative = 'ALL';
let currentFilterGoal = 'ALL';
let searchQuery = '';
let currentUserId = '';
let myTotalPoints = 0;

export function renderDashboard(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col selection:bg-accent selection:text-white">
      ${renderNavbar('dashboard')}

      <!-- Main Feed Container -->
      <main class="flex-1 w-full max-w-[1240px] mx-auto p-4 md:p-8">
        
        <!-- Header & Tactical Actions -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-accent/10 border border-accent/30 text-accent">
                <span class="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
                Live Tactical Stream
              </span>
              <span id="last-updated-text" class="text-[11px] font-mono text-muted">Synced just now</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">Global Activity</h2>
            <p class="text-body text-sm mt-1">Real-time squad execution feed, live task completions, and active field contracts.</p>
          </div>

          <div class="flex items-center gap-3">
            <button id="open-create-task-btn" class="btn-primary flex items-center gap-2 text-xs font-semibold py-2 px-4 shadow-sm hover:shadow-md transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
              </svg>
              <span>Initialize Task</span>
            </button>
            <button id="refresh-feed-btn" class="btn-ghost flex items-center gap-1.5 text-xs py-2 px-3 border border-border hover:bg-surface transition-colors" title="Reload live feed">
              <svg id="refresh-spinner" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Squad Pulse Telemetry Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <!-- Operatives In Field -->
          <div class="theme-card p-4 flex flex-col justify-between border-l-4 border-l-amber-500/80 hover:border-accent/40 transition-colors">
            <div class="flex items-center justify-between text-muted mb-2">
              <span class="text-[11px] font-mono uppercase font-bold tracking-wider">In Field Focus</span>
              <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            </div>
            <div>
              <div id="stat-active-in-field" class="text-2xl font-black font-mono text-primary">0</div>
              <p class="text-[11px] text-muted mt-0.5">Operatives actively working</p>
            </div>
          </div>

          <!-- Hours Logged Today -->
          <div class="theme-card p-4 flex flex-col justify-between border-l-4 border-l-cyan-500/80 hover:border-accent/40 transition-colors">
            <div class="flex items-center justify-between text-muted mb-2">
              <span class="text-[11px] font-mono uppercase font-bold tracking-wider">Hours Today</span>
              <svg class="w-3.5 h-3.5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <div id="stat-hours-today" class="text-2xl font-black font-mono text-primary">0.0h</div>
              <p class="text-[11px] text-muted mt-0.5">IST squad dedication</p>
            </div>
          </div>

          <!-- Points Scored Today -->
          <div class="theme-card p-4 flex flex-col justify-between border-l-4 border-l-emerald-500/80 hover:border-accent/40 transition-colors">
            <div class="flex items-center justify-between text-muted mb-2">
              <span class="text-[11px] font-mono uppercase font-bold tracking-wider">Squad Points</span>
              <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <div>
              <div id="stat-points-today" class="text-2xl font-black font-mono text-primary">0 pts</div>
              <p class="text-[11px] text-muted mt-0.5" id="stat-completed-count">0 tasks finalized today</p>
            </div>
          </div>

          <!-- Active Bounty Pool -->
          <div class="theme-card p-4 flex flex-col justify-between border-l-4 border-l-yellow-500/80 hover:border-accent/40 transition-colors">
            <div class="flex items-center justify-between text-muted mb-2">
              <span class="text-[11px] font-mono uppercase font-bold tracking-wider">Bounty Pool</span>
              <span class="text-yellow-400 font-bold text-xs">🎯</span>
            </div>
            <div>
              <div id="stat-bounty-pool" class="text-2xl font-black font-mono text-yellow-500">0 pts</div>
              <p class="text-[11px] text-muted mt-0.5" id="stat-bounties-count">0 active challenge contracts</p>
            </div>
          </div>
        </div>

        <!-- Filter & Search Console -->
        <div class="theme-card p-4 mb-6 space-y-4">
          <!-- Top Row: Search and Status Tabs -->
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <!-- Search Input -->
            <div class="relative flex-1 max-w-md">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </span>
              <input 
                type="text" 
                id="feed-search-input" 
                placeholder="Search tasks by title, operative, or objective..." 
                class="theme-input pl-9 pr-8 text-xs w-full py-2"
              />
              <button id="clear-search-btn" class="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-primary hidden">
                &times;
              </button>
            </div>

            <!-- Status Tabs -->
            <div class="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0" id="status-filter-tabs">
              <button data-status="ALL" class="status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent text-white shadow-sm">
                All Feed <span id="count-badge-all" class="ml-1 opacity-80 text-[10px] font-mono">(0)</span>
              </button>
              <button data-status="IN_PROGRESS" class="status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-body hover:text-primary hover:bg-surface transition-all">
                ⚡ In Focus <span id="count-badge-inprogress" class="ml-1 opacity-80 text-[10px] font-mono">(0)</span>
              </button>
              <button data-status="COMPLETED" class="status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-body hover:text-primary hover:bg-surface transition-all">
                ✅ Completed <span id="count-badge-completed" class="ml-1 opacity-80 text-[10px] font-mono">(0)</span>
              </button>
              <button data-status="BOUNTY" class="status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-body hover:text-primary hover:bg-surface transition-all">
                🎯 Bounty Targets <span id="count-badge-bounty" class="ml-1 opacity-80 text-[10px] font-mono">(0)</span>
              </button>
            </div>
          </div>

          <!-- Bottom Row: Multi-Dimension Filters -->
          <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-xs">
            <div class="flex flex-wrap items-center gap-3">
              <!-- Operative Filter -->
              <div class="flex items-center gap-1.5">
                <span class="text-muted font-medium">Operative:</span>
                <select id="filter-operative-select" class="theme-input py-1 px-2.5 text-xs font-medium max-w-[160px]">
                  <option value="ALL">All Squad Members</option>
                  <option value="Adityash">Adityash</option>
                  <option value="Manas">Manas</option>
                  <option value="Shivansh">Shivansh</option>
                  <option value="Praveen">Praveen</option>
                  <option value="Harshit">Harshit</option>
                </select>
              </div>

              <!-- Objective / Goal Filter -->
              <div class="flex items-center gap-1.5">
                <span class="text-muted font-medium">Objective:</span>
                <select id="filter-goal-select" class="theme-input py-1 px-2.5 text-xs font-medium max-w-[200px]">
                  <option value="ALL">All Linked Goals</option>
                </select>
              </div>
            </div>

            <!-- Result Counter & Reset -->
            <div class="flex items-center gap-2">
              <span id="feed-results-count" class="text-muted font-mono text-[11px]">Showing 0 executions</span>
              <button id="reset-filters-btn" class="text-accent hover:underline text-[11px] font-medium hidden">
                Reset Filters
              </button>
            </div>
          </div>
        </div>
        
        <!-- Live Stream List Container -->
        <div id="feed-container" class="space-y-3.5">
          <div class="theme-card text-center py-16 animate-pulse">
            <span class="font-mono text-xs text-muted">Establishing secure telemetry uplink to squad feed...</span>
          </div>
        </div>

      </main>

      <!-- Modals -->
      ${renderCompleteModal()}
      
      <!-- Inline Quick Bounty Staking Modal -->
      <div id="quick-bounty-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
        <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-yellow-500/40">
          <div class="flex justify-between items-center mb-5 pb-4 border-b border-border">
            <div>
              <h2 class="text-sm font-bold tracking-wider text-yellow-500 uppercase flex items-center gap-2">
                <span>🎯 Stake Bounty Escrow</span>
              </h2>
              <p id="bounty-modal-task-title" class="text-xs text-muted truncate max-w-[280px] mt-0.5">Task title</p>
            </div>
            <button id="close-quick-bounty-btn" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
          </div>

          <form id="quick-bounty-form" class="space-y-4">
            <input type="hidden" id="quick-bounty-task-id" />
            
            <div class="p-3 rounded-lg bg-surface/60 border border-border/80 flex items-center justify-between text-xs">
              <span class="text-muted">Your Available Vault:</span>
              <span id="quick-bounty-vault-pts" class="font-mono font-bold text-accent">0 pts</span>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase mb-1.5 text-muted tracking-wider">
                Select Points to Stake
              </label>
              
              <!-- Preset Chips -->
              <div class="grid grid-cols-4 gap-2 mb-3">
                <button type="button" data-preset="10" class="bounty-preset-chip py-1.5 rounded-lg border border-border hover:border-yellow-500/60 font-mono text-xs font-bold text-primary hover:bg-yellow-500/10 transition-colors">10 pts</button>
                <button type="button" data-preset="15" class="bounty-preset-chip py-1.5 rounded-lg border border-border hover:border-yellow-500/60 font-mono text-xs font-bold text-primary hover:bg-yellow-500/10 transition-colors">15 pts</button>
                <button type="button" data-preset="25" class="bounty-preset-chip py-1.5 rounded-lg border border-border hover:border-yellow-500/60 font-mono text-xs font-bold text-primary hover:bg-yellow-500/10 transition-colors">25 pts</button>
                <button type="button" data-preset="50" class="bounty-preset-chip py-1.5 rounded-lg border border-border hover:border-yellow-500/60 font-mono text-xs font-bold text-primary hover:bg-yellow-500/10 transition-colors">50 pts</button>
              </div>

              <input 
                type="number" 
                id="quick-bounty-points-input" 
                required 
                min="10" 
                step="5" 
                class="theme-input font-mono text-sm" 
                placeholder="Custom stake (min 10)" 
                value="15"
              />
              <p class="text-[10px] text-muted mt-1">If the operative completes this task, they win your staked points!</p>
            </div>

            <button type="submit" id="submit-quick-bounty-btn" class="btn-primary w-full bg-yellow-500 hover:bg-yellow-600 text-black font-mono font-bold tracking-wider text-xs uppercase py-2.5">
              Lock Escrow & Issue Bounty
            </button>
          </form>
        </div>
      </div>

    </div>
  `;
}

export function setupDashboardLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);

  const refreshBtn = document.getElementById('refresh-feed-btn') as HTMLButtonElement;
  const feedContainer = document.getElementById('feed-container') as HTMLDivElement;
  const searchInput = document.getElementById('feed-search-input') as HTMLInputElement;
  const clearSearchBtn = document.getElementById('clear-search-btn') as HTMLButtonElement;
  const filterOperativeSelect = document.getElementById('filter-operative-select') as HTMLSelectElement;
  const filterGoalSelect = document.getElementById('filter-goal-select') as HTMLSelectElement;
  const resetFiltersBtn = document.getElementById('reset-filters-btn') as HTMLButtonElement;
  const statusTabs = document.querySelectorAll('.status-tab-btn');

  const openModalBtnHeader = document.getElementById('open-create-task-btn') as HTMLButtonElement;

  // Quick Bounty Modal Elements
  const quickBountyModal = document.getElementById('quick-bounty-modal') as HTMLDivElement;
  const closeQuickBountyBtn = document.getElementById('close-quick-bounty-btn') as HTMLButtonElement;
  const quickBountyForm = document.getElementById('quick-bounty-form') as HTMLFormElement;

  // 1. Initial Load
  initDashboard();

  // 2. Event Listeners for Filters & Search
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = (e.target as HTMLInputElement).value.trim().toLowerCase();
      if (clearSearchBtn) clearSearchBtn.classList.toggle('hidden', searchQuery.length === 0);
      renderFilteredTasks(feedContainer);
    });
  }

  if (clearSearchBtn && searchInput) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      renderFilteredTasks(feedContainer);
    });
  }

  statusTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      const status = btn.getAttribute('data-status') as any;
      currentFilterStatus = status;

      // Update button styling
      statusTabs.forEach(t => {
        t.className = 'status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-body hover:text-primary hover:bg-surface transition-all';
      });
      btn.className = 'status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent text-white shadow-sm';

      renderFilteredTasks(feedContainer);
    });
  });

  if (filterOperativeSelect) {
    filterOperativeSelect.addEventListener('change', (e) => {
      currentFilterOperative = (e.target as HTMLSelectElement).value;
      renderFilteredTasks(feedContainer);
    });
  }

  if (filterGoalSelect) {
    filterGoalSelect.addEventListener('change', (e) => {
      currentFilterGoal = (e.target as HTMLSelectElement).value;
      renderFilteredTasks(feedContainer);
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      currentFilterStatus = 'ALL';
      currentFilterOperative = 'ALL';
      currentFilterGoal = 'ALL';
      searchQuery = '';
      if (searchInput) searchInput.value = '';
      if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
      if (filterOperativeSelect) filterOperativeSelect.value = 'ALL';
      if (filterGoalSelect) filterGoalSelect.value = 'ALL';

      statusTabs.forEach(t => {
        const isAll = t.getAttribute('data-status') === 'ALL';
        t.className = isAll 
          ? 'status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all bg-accent text-white shadow-sm'
          : 'status-tab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-body hover:text-primary hover:bg-surface transition-all';
      });

      renderFilteredTasks(feedContainer);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      const spinner = document.getElementById('refresh-spinner');
      if (spinner) spinner.classList.add('animate-spin');
      await loadFeedAndStats(feedContainer);
      if (spinner) setTimeout(() => spinner.classList.remove('animate-spin'), 400);
    });
  }

  // --- Create Task Button Integration (Delegated to Global Navbar Modal) ---
  if (openModalBtnHeader) {
    openModalBtnHeader.addEventListener('click', () => {
      document.getElementById('open-modal-btn')?.click();
    });
  }

  // Auto-refresh feed when a task is initialized anywhere in the app
  window.addEventListener('task-created', () => {
    loadFeedAndStats(feedContainer);
  });

  // --- Complete Modal Logic ---
  setupCompleteModalLogic(async () => {
    await loadFeedAndStats(feedContainer);
  });

  // --- Quick Bounty Modal Logic ---
  if (closeQuickBountyBtn && quickBountyModal) {
    closeQuickBountyBtn.addEventListener('click', () => quickBountyModal.classList.add('hidden'));
    quickBountyModal.addEventListener('click', (e) => {
      if (e.target === quickBountyModal) quickBountyModal.classList.add('hidden');
    });
  }

  const presetChips = quickBountyModal?.querySelectorAll('.bounty-preset-chip');
  const pointsInput = document.getElementById('quick-bounty-points-input') as HTMLInputElement;
  presetChips?.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const val = (e.currentTarget as HTMLButtonElement).getAttribute('data-preset');
      if (val && pointsInput) pointsInput.value = val;
    });
  });

  if (quickBountyForm) {
    quickBountyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-quick-bounty-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'LOCKING ESCROW...';

      const taskId = (document.getElementById('quick-bounty-task-id') as HTMLInputElement).value;
      const pointsToStake = parseInt(pointsInput.value, 10);

      if (isNaN(pointsToStake) || pointsToStake < 10) {
        alert('Minimum bounty stake is 10 points.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lock Escrow & Issue Bounty';
        return;
      }

      if (pointsToStake > myTotalPoints) {
        alert(`Insufficient points in vault. You have ${myTotalPoints} pts available.`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lock Escrow & Issue Bounty';
        return;
      }

      try {
        await apiFetch('/bounties', {
          method: 'POST',
          body: JSON.stringify({ target_task_id: taskId, points_at_stake: pointsToStake })
        });
        
        quickBountyModal.classList.add('hidden');
        quickBountyForm.reset();
        await loadFeedAndStats(feedContainer);
      } catch (err: any) {
        alert(`Failed to stake bounty: ${err.message}`);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lock Escrow & Issue Bounty';
      }
    });
  }
}

// --- Data Fetching and Initialization ---
async function initDashboard() {
  const feedContainer = document.getElementById('feed-container') as HTMLDivElement;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user.id || '';

    // Fetch user profile for vault balance
    try {
      const me = await apiFetch('/users/me');
      myTotalPoints = me.total_lifetime_points || 0;
    } catch {}

    // Fetch goals for filter dropdown
    try {
      allGoals = await apiFetch('/goals');
      const goalSelect = document.getElementById('filter-goal-select') as HTMLSelectElement;
      if (goalSelect) {
        goalSelect.innerHTML = '<option value="ALL">All Linked Goals</option>' + 
          allGoals.map(g => `<option value="${g.id}">🎯 ${g.title}</option>`).join('');
      }
    } catch {}

    await loadFeedAndStats(feedContainer);
  } catch (err: any) {
    if (feedContainer) {
      feedContainer.innerHTML = `
        <div class="theme-card border-rose-500/30 bg-rose-500/5 text-center py-8">
           <span class="font-mono text-xs text-rose-500">Failed to initialize telemetry: ${err.message}</span>
        </div>
      `;
    }
  }
}

async function loadFeedAndStats(container: HTMLDivElement) {
  try {
    const [tasks, stats] = await Promise.all([
      apiFetch('/tasks/feed'),
      apiFetch('/tasks/stats')
    ]);

    allTasks = tasks || [];
    updatePulseStats(stats);
    updateFilterCounts();
    renderFilteredTasks(container);

    const lastUpdated = document.getElementById('last-updated-text');
    if (lastUpdated) {
      const now = new Date();
      lastUpdated.textContent = `Synced at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
  } catch (err: any) {
    container.innerHTML = `
      <div class="theme-card border-rose-500/30 bg-rose-500/5 text-center py-8">
         <span class="font-mono text-xs text-rose-500">Telemetry uplink error: ${err.message}</span>
      </div>
    `;
  }
}

function updatePulseStats(stats: FeedStats) {
  const elActive = document.getElementById('stat-active-in-field');
  const elHours = document.getElementById('stat-hours-today');
  const elPoints = document.getElementById('stat-points-today');
  const elCompleted = document.getElementById('stat-completed-count');
  const elBountyPool = document.getElementById('stat-bounty-pool');
  const elBountiesCount = document.getElementById('stat-bounties-count');

  if (elActive) elActive.textContent = `${stats.active_operatives_count} Active`;
  if (elHours) elHours.textContent = `${stats.hours_logged_today}h`;
  if (elPoints) elPoints.textContent = `${stats.points_scored_today} pts`;
  if (elCompleted) elCompleted.textContent = `${stats.completed_today_count} tasks finalized today`;
  if (elBountyPool) elBountyPool.textContent = `${stats.open_bounty_points} pts`;
  if (elBountiesCount) elBountiesCount.textContent = `${stats.open_bounties_count} active challenge contracts`;
}

function updateFilterCounts() {
  const countAll = document.getElementById('count-badge-all');
  const countInProg = document.getElementById('count-badge-inprogress');
  const countComp = document.getElementById('count-badge-completed');
  const countBounty = document.getElementById('count-badge-bounty');

  if (countAll) countAll.textContent = `(${allTasks.length})`;
  if (countInProg) countInProg.textContent = `(${allTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length})`;
  if (countComp) countComp.textContent = `(${allTasks.filter(t => t.status === 'COMPLETED').length})`;
  if (countBounty) countBounty.textContent = `(${allTasks.filter(t => (t.active_bounties_count || 0) > 0).length})`;
}

function renderFilteredTasks(container: HTMLDivElement) {
  let filtered = allTasks;

  // 1. Status Filter
  if (currentFilterStatus === 'IN_PROGRESS') {
    filtered = filtered.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
  } else if (currentFilterStatus === 'COMPLETED') {
    filtered = filtered.filter(t => t.status === 'COMPLETED');
  } else if (currentFilterStatus === 'BOUNTY') {
    filtered = filtered.filter(t => (t.active_bounties_count || 0) > 0);
  }

  // 2. Operative Filter
  if (currentFilterOperative !== 'ALL') {
    filtered = filtered.filter(t => t.user_name.toLowerCase() === currentFilterOperative.toLowerCase());
  }

  // 3. Goal Filter
  if (currentFilterGoal !== 'ALL') {
    filtered = filtered.filter(t => t.goal_id === currentFilterGoal);
  }

  // 4. Keyword Search
  if (searchQuery) {
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(searchQuery) ||
      t.user_name.toLowerCase().includes(searchQuery) ||
      (t.goal_title && t.goal_title.toLowerCase().includes(searchQuery))
    );
  }

  // Update Result Counter & Reset Button
  const resultsCounter = document.getElementById('feed-results-count');
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resultsCounter) {
    resultsCounter.textContent = `Showing ${filtered.length} of ${allTasks.length} executions`;
  }
  const isFiltered = currentFilterStatus !== 'ALL' || currentFilterOperative !== 'ALL' || currentFilterGoal !== 'ALL' || searchQuery.length > 0;
  if (resetBtn) resetBtn.classList.toggle('hidden', !isFiltered);

  // Render empty state
  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="theme-card text-center py-16">
        <div class="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-muted text-lg">
          🔍
        </div>
        <h3 class="text-sm font-bold text-primary">No tasks match your telemetry criteria</h3>
        <p class="text-xs text-muted mt-1 max-w-sm mx-auto">Try clearing search filters or initialize a new task to dispatch to the squad feed.</p>
        <button id="empty-state-reset-btn" class="btn-primary text-xs font-semibold py-1.5 px-4 mt-4">
          Reset Telemetry Filters
        </button>
      </div>
    `;

    const emptyResetBtn = document.getElementById('empty-state-reset-btn');
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', () => {
        document.getElementById('reset-filters-btn')?.click();
      });
    }
    return;
  }

  // Render cards
  container.innerHTML = filtered.map(task => {
    const isMe = task.user_id === currentUserId;
    const isClassified = task.title === '[ CLASSIFIED DATA ]';
    const isPending = task.status === 'PENDING';
    const isInProgress = task.status === 'IN_PROGRESS';
    const isCompleted = task.status === 'COMPLETED';
    const isAbandoned = task.status === 'ABANDONED';
    
    // Status Badge
    let statusBadge = '';
    if (isCompleted) {
      statusBadge = `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
          COMPLETED
        </span>
      `;
    } else if (isInProgress) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          DEEP FOCUS
        </span>
      `;
    } else if (isPending) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          STANDBY
        </span>
      `;
    } else if (isAbandoned) {
      statusBadge = `
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
          ABANDONED
        </span>
      `;
    }

    // Border styling
    let borderAccent = 'border-l-accent/50';
    if (isInProgress) borderAccent = 'border-l-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.08)]';
    else if (isPending) borderAccent = 'border-l-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.04)]';
    else if (isCompleted) borderAccent = 'border-l-emerald-500/40';
    else if (isClassified) borderAccent = 'border-l-rose-500';

    const relativeTime = formatRelativeTime(task.created_at);
    const userInitial = (task.user_name || 'Operative').charAt(0).toUpperCase();

    // Bounty Callout Banner
    const hasBounties = (task.active_bounties_count || 0) > 0;
    const bountyBanner = hasBounties ? `
      <div class="mt-3 p-2.5 rounded-lg border border-yellow-500/40 bg-yellow-500/[0.06] flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 text-yellow-400 font-semibold">
          <span class="text-sm">🎯</span>
          <span>${task.total_bounty_points} PTS BOUNTY STAKED by ${escapeHtml((task.bounty_issuers || []).join(', ')) || 'Squad Peer'}</span>
        </div>
        <span class="font-mono text-[10px] text-yellow-500 uppercase tracking-wider font-bold">Escrow Active</span>
      </div>
    ` : '';

    return `
      <div class="theme-card p-5 border-l-4 ${borderAccent} transition-all duration-200 hover:border-accent/60">
        <!-- Top Row: Operative, Time, Goal, Status -->
        <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2.5">
            <!-- Operative Avatar -->
            <div class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
              isMe ? 'bg-accent/20 text-accent border border-accent/40' : 'bg-surface border border-border text-primary'
            }">
              ${userInitial}
            </div>

            <!-- Operative Name -->
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-primary tracking-tight">${escapeHtml(task.user_name)}</span>
              ${isMe ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-accent/15 text-accent font-bold">YOU</span>' : ''}
              <span class="text-muted text-[11px]">•</span>
              <span class="text-[11px] font-mono text-muted" title="${new Date(task.created_at).toLocaleString()}">${relativeTime}</span>
            </div>
          </div>

          <!-- Status & Goal Badges -->
          <div class="flex items-center gap-2">
            ${task.goal_title ? `
              <span class="px-2 py-0.5 rounded text-[10px] bg-surface border border-border text-muted font-mono tracking-tight truncate max-w-[180px]">
                🎯 ${escapeHtml(task.goal_title)}
              </span>
            ` : ''}
            ${statusBadge}
          </div>
        </div>

        <!-- Middle Content: Task Title & Badges -->
        <div class="mb-3">
          <h3 class="text-base font-bold tracking-tight ${isClassified ? 'text-rose-400 italic' : 'text-primary'}">
            ${isClassified ? '🔒 [ CLASSIFIED TACTICAL DATA ]' : escapeHtml(task.title)}
          </h3>

          <!-- Achievement Badges (Sniper, First Blood) -->
          <div class="flex flex-wrap items-center gap-2 mt-2">
            ${task.is_first_blood ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                🩸 First Blood (+3 pts)
              </span>
            ` : ''}

            ${task.is_sniper ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                🎯 Sniper Precision (+5 pts)
              </span>
            ` : ''}

            <!-- Time Metrics -->
            <span class="text-[11px] font-mono text-muted flex items-center gap-1">
              <span>Target:</span>
              <strong class="text-primary">${task.estimated_hours}h</strong>
            </span>

            ${(task.tracked_timer_minutes || 0) > 0 ? `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                ⏱️ ${task.tracked_timer_minutes}m focused
              </span>
            ` : ''}

            ${isCompleted && task.actual_hours !== null && task.actual_hours !== undefined ? `
              <span class="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span>• Logged:</span>
                <strong>${task.actual_hours}h</strong>
              </span>
            ` : ''}
          </div>

          ${isCompleted && task.proof_url && !isClassified ? `
            <div class="mt-2.5 flex items-center gap-1.5 text-xs">
              <span class="text-muted text-[10px] font-mono uppercase tracking-wider">Proof of Work:</span>
              <a href="${escapeHtml(task.proof_url)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline bg-accent/10 px-2 py-0.5 rounded border border-accent/20 truncate max-w-[320px]">
                <svg class="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                <span class="truncate">${escapeHtml(task.proof_url)}</span>
              </a>
            </div>
          ` : ''}

          ${bountyBanner}
        </div>

        <!-- Bottom Row: Points & Action Controls -->
        <div class="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
          <!-- Points Telemetry -->
          <div>
            ${isCompleted ? `
              <div class="flex items-center gap-1.5">
                <span class="text-base font-black font-mono text-accent">+${task.points_earned} pts</span>
                <span class="text-[10px] font-mono text-muted uppercase">Claimed</span>
              </div>
            ` : `
              <div class="flex items-center gap-1.5">
                <span class="text-xs font-mono text-muted">Est. Reward:</span>
                <span class="text-xs font-mono font-bold text-primary">~${Math.floor(task.estimated_hours * 10) + 5} pts</span>
              </div>
            `}
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <!-- Owner Pending / In Progress: Focus toggle, Finalize or Cancel -->
            ${isMe && (isPending || isInProgress) ? `
              <button 
                data-action="focus" 
                data-task-id="${task.id}" 
                data-task-status="${task.status}"
                class="btn-ghost text-xs font-semibold py-1.5 px-2.5 border ${
                  isInProgress ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-border text-muted hover:text-primary hover:bg-surface'
                } flex items-center gap-1 transition-colors"
                title="${isInProgress ? 'Stand down focus' : 'Activate Deep Focus'}"
              >
                <span>${isInProgress ? '🟢 In Focus' : '⚡ Deep Focus'}</span>
              </button>
              <button 
                data-action="complete" 
                data-task-id="${task.id}" 
                data-task-title="${encodeURIComponent(task.title)}" 
                data-task-est="${task.estimated_hours}" 
                data-task-timer-mins="${task.tracked_timer_minutes || 0}"
                data-task-timer-hours="${task.tracked_timer_hours || 0}"
                class="btn-primary text-xs font-semibold py-1.5 px-3 flex items-center gap-1.5 shadow-sm"
              >
                <span>Finalize</span>
              </button>
              <button 
                data-action="cancel" 
                data-task-id="${task.id}" 
                class="btn-ghost text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 py-1.5 px-2 border border-rose-500/20"
                title="Cancel and withdraw this task"
              >
                Cancel
              </button>
            ` : ''}

            <!-- Peer Pending / In Progress: Challenge with Bounty -->
            ${!isMe && (isPending || isInProgress) ? `
              <button 
                data-action="bounty" 
                data-task-id="${task.id}" 
                data-task-title="${encodeURIComponent(task.title)}" 
                class="btn-ghost text-xs font-semibold py-1.5 px-3 border border-yellow-500/40 text-yellow-500 hover:bg-yellow-500/10 flex items-center gap-1.5"
              >
                <span>🎯 Stake Bounty</span>
              </button>
            ` : ''}

            <!-- Completed Indicator -->
            ${isCompleted ? `
              <span class="text-[11px] font-mono text-muted flex items-center gap-1">
                <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                <span>Finalized</span>
              </span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach card event listeners
  setupCardActionListeners(container);
}

function setupCardActionListeners(container: HTMLDivElement) {
  // 0. Toggle Deep Focus Action
  const focusBtns = container.querySelectorAll('[data-action="focus"]');
  focusBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const taskId = target.getAttribute('data-task-id');
      if (!taskId) return;
      target.disabled = true;

      try {
        await apiFetch(`/tasks/${taskId}/focus`, { method: 'PATCH' });
        await loadFeedAndStats(container);
      } catch (err: any) {
        alert(`Failed to toggle focus: ${err.message}`);
        target.disabled = false;
      }
    });
  });

  // 1. Complete Task Action
  const completeBtns = container.querySelectorAll('[data-action="complete"]');
  completeBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const taskId = target.getAttribute('data-task-id') || '';
      const taskTitle = decodeURIComponent(target.getAttribute('data-task-title') || '');
      const estHours = parseFloat(target.getAttribute('data-task-est') || '0');
      const timerMins = parseInt(target.getAttribute('data-task-timer-mins') || '0', 10);
      const timerHours = parseFloat(target.getAttribute('data-task-timer-hours') || '0');

      openCompleteTaskModal({
        taskId,
        title: taskTitle,
        estHours,
        trackedTimerMinutes: timerMins,
        trackedTimerHours: timerHours
      });
    });
  });

  // 2. Cancel Task Action
  const cancelBtns = container.querySelectorAll('[data-action="cancel"]');
  cancelBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const taskId = (e.currentTarget as HTMLButtonElement).getAttribute('data-task-id');
      if (!taskId) return;

      const confirmed = window.confirm('Are you sure you want to cancel and remove this task? Any active bounties will be returned to their issuers.');
      if (!confirmed) return;

      try {
        await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
        await loadFeedAndStats(container);
      } catch (err: any) {
        alert(`Failed to cancel task: ${err.message}`);
      }
    });
  });

  // 3. Challenge with Bounty Action
  const bountyBtns = container.querySelectorAll('[data-action="bounty"]');
  bountyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const taskId = target.getAttribute('data-task-id');
      const taskTitle = decodeURIComponent(target.getAttribute('data-task-title') || '');

      const quickBountyModal = document.getElementById('quick-bounty-modal');
      const taskIdInput = document.getElementById('quick-bounty-task-id') as HTMLInputElement;
      const titleDisplay = document.getElementById('bounty-modal-task-title');
      const vaultDisplay = document.getElementById('quick-bounty-vault-pts');

      if (quickBountyModal && taskIdInput) {
        taskIdInput.value = taskId || '';
        if (titleDisplay) titleDisplay.textContent = taskTitle;
        if (vaultDisplay) vaultDisplay.textContent = `${myTotalPoints} pts`;
        quickBountyModal.classList.remove('hidden');
      }
    });
  });
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
