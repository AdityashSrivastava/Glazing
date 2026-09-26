import { apiFetch } from '../api';
import { supabase } from '../supabase';
import { renderNavbar, setupNavbarLogic } from './components/navbar';
import { escapeHtml } from '../utils';

export function renderBounties(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col">
      ${renderNavbar('bounties')}

      <main class="flex-1 w-full max-w-[1240px] mx-auto p-6 md:p-10 space-y-8">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[11px] font-mono uppercase tracking-wider mb-2.5">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Escrow Contracts // Peer Stakes</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-primary tracking-tight">Active Bounties</h2>
            <p class="text-body text-sm mt-1">Weaponized peer pressure. Stake points against peer tasks to enforce execution speed.</p>
          </div>

          <!-- Top Stats Bar -->
          <div class="flex items-center gap-3 font-mono">
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider">Your Stakable Vault</div>
              <div id="kpi-my-points" class="text-xl font-bold text-accent mt-0.5">-- pts</div>
            </div>
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider">Active Escrows</div>
              <div id="kpi-active-bounties" class="text-xl font-bold text-amber-500 mt-0.5">--</div>
            </div>
          </div>
        </div>

        <!-- Main Bento Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Panel: Create Bounty (5 cols) -->
          <div class="lg:col-span-5 theme-card p-6 md:p-7 relative border-dashed h-fit space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Place Escrow Challenge
              </h3>
              <span class="text-[10px] font-mono text-muted uppercase">Min 10 pts</span>
            </div>

            <form id="create-bounty-form" class="space-y-4">
              <!-- Target Task Dropdown -->
              <div>
                <label class="block text-xs font-semibold text-primary mb-1.5">Select Peer Target Task</label>
                <select id="bounty-task-id" required class="theme-input text-xs font-mono">
                  <option value="" disabled selected>Loading available tasks...</option>
                </select>
                <p id="task-select-hint" class="text-[11px] text-muted mt-1 hidden"></p>
              </div>

              <!-- Points at Stake -->
              <div>
                <div class="flex justify-between items-center mb-1.5">
                  <label class="block text-xs font-semibold text-primary">Points at Stake</label>
                  <span id="max-stake-hint" class="text-[11px] font-mono text-muted">Available: -- pts</span>
                </div>
                <input type="number" id="bounty-points" required class="theme-input text-sm font-mono font-bold" min="10" step="5" value="25" />
                
                <!-- Quick Staking Preset Buttons -->
                <div class="flex items-center gap-2 mt-2.5">
                  <button type="button" class="preset-btn px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface border border-border text-muted hover:text-primary hover:border-accent transition-colors" data-pts="10">+10</button>
                  <button type="button" class="preset-btn px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface border border-border text-muted hover:text-primary hover:border-accent transition-colors" data-pts="25">+25</button>
                  <button type="button" class="preset-btn px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface border border-border text-muted hover:text-primary hover:border-accent transition-colors" data-pts="50">+50</button>
                  <button type="button" class="preset-btn px-2.5 py-1 rounded-md text-[11px] font-mono bg-surface border border-border text-muted hover:text-primary hover:border-accent transition-colors" data-pts="100">+100</button>
                  <button type="button" id="btn-stake-max" class="px-2.5 py-1 rounded-md text-[11px] font-mono bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 transition-colors ml-auto">MAX</button>
                </div>
              </div>

              <!-- Contract Terms Breakdown -->
              <div class="p-3.5 rounded-xl bg-surface/60 border border-border text-[11px] space-y-1.5 font-mono text-muted">
                <div class="flex justify-between text-body">
                  <span>Target Wins If Finished:</span>
                  <span id="preview-win-pts" class="text-emerald-400 font-bold">+25 pts</span>
                </div>
                <div class="flex justify-between text-body">
                  <span>You Reclaim If Abandoned:</span>
                  <span id="preview-reclaim-pts" class="text-accent font-bold">100% + 10% penalty</span>
                </div>
              </div>

              <button type="submit" id="submit-bounty-btn" class="btn-primary w-full text-[11px] uppercase tracking-widest py-2.5 mt-2 cursor-pointer shadow-sm">
                Lock Escrow Bounty
              </button>
            </form>
          </div>

          <!-- Right Panel: Contracts Feed (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            
            <!-- Filter Tabs -->
            <div class="flex items-center justify-between gap-3 pb-1 border-b border-border/60">
              <div class="flex items-center gap-2">
                <button id="filter-all-btn" class="filter-tab px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white transition-all">All (<span id="count-all">0</span>)</button>
                <button id="filter-active-btn" class="filter-tab px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all">Active (<span id="count-active">0</span>)</button>
                <button id="filter-resolved-btn" class="filter-tab px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all">Resolved (<span id="count-resolved">0</span>)</button>
              </div>
              <button id="refresh-bounties-btn" class="text-xs font-mono text-muted hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sync
              </button>
            </div>

            <!-- Bounties List Container -->
            <div id="bounties-container" class="space-y-4">
               <div class="theme-card text-center py-16 animate-pulse">
                  <span class="data-text text-muted">Synchronizing escrow ledger...</span>
               </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  `;
}

let cachedBounties: any[] = [];
let activeFilter = 'all';
let currentUserId: string = '';
let currentUserPoints: number = 0;

export async function setupBountiesLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);

  // Get current user ID and balance
  try {
    const { data: { session } } = await supabase.auth.getSession();
    currentUserId = session?.user?.id || '';
    const me = await apiFetch('/users/me');
    currentUserPoints = me.total_lifetime_points || 0;
    
    const kpiMyPoints = document.getElementById('kpi-my-points');
    const maxHint = document.getElementById('max-stake-hint');
    if (kpiMyPoints) kpiMyPoints.textContent = `${currentUserPoints} pts`;
    if (maxHint) maxHint.textContent = `Available: ${currentUserPoints} pts`;
  } catch (e) {}

  const form = document.getElementById('create-bounty-form') as HTMLFormElement;
  const container = document.getElementById('bounties-container') as HTMLDivElement;
  const refreshBtn = document.getElementById('refresh-bounties-btn');

  // Staking Presets
  const pointsInput = document.getElementById('bounty-points') as HTMLInputElement;
  const winPtsPreview = document.getElementById('preview-win-pts');
  
  function updatePreview() {
    const pts = parseInt(pointsInput?.value || '0', 10);
    if (winPtsPreview) winPtsPreview.textContent = `+${isNaN(pts) ? 0 : pts} pts`;
  }

  if (pointsInput) {
    pointsInput.addEventListener('input', updatePreview);
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const add = parseInt((btn as HTMLButtonElement).getAttribute('data-pts') || '10', 10);
      const curr = parseInt(pointsInput.value || '0', 10);
      pointsInput.value = String(Math.max(10, curr + add));
      updatePreview();
    });
  });

  const maxBtn = document.getElementById('btn-stake-max');
  if (maxBtn) {
    maxBtn.addEventListener('click', () => {
      pointsInput.value = String(Math.max(10, currentUserPoints));
      updatePreview();
    });
  }

  // Filter Tabs
  setupFilterTabs(container);

  // Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-bounty-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'LOCKING CONTRACT...';

      const target_task_id = (document.getElementById('bounty-task-id') as HTMLSelectElement).value;
      const points_at_stake = parseInt((document.getElementById('bounty-points') as HTMLInputElement).value, 10);

      if (!target_task_id) {
        alert('Please select a valid peer target task.');
        btn.disabled = false;
        btn.textContent = 'Lock Escrow Bounty';
        return;
      }

      if (points_at_stake > currentUserPoints) {
        alert(`Insufficient vault points (${currentUserPoints} available) to stake ${points_at_stake} pts.`);
        btn.disabled = false;
        btn.textContent = 'Lock Escrow Bounty';
        return;
      }

      try {
        await apiFetch('/bounties', {
          method: 'POST',
          body: JSON.stringify({ target_task_id, points_at_stake })
        });
        
        // Refresh balance and feeds
        currentUserPoints -= points_at_stake;
        const kpiMyPoints = document.getElementById('kpi-my-points');
        const maxHint = document.getElementById('max-stake-hint');
        if (kpiMyPoints) kpiMyPoints.textContent = `${currentUserPoints} pts`;
        if (maxHint) maxHint.textContent = `Available: ${currentUserPoints} pts`;

        form.reset();
        pointsInput.value = '25';
        updatePreview();

        await populateEligibleTasks();
        await fetchAndRenderBounties(container);
      } catch (err: any) {
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Lock Escrow Bounty';
      }
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await populateEligibleTasks();
      await fetchAndRenderBounties(container);
    });
  }

  // Initial Data Loads
  await populateEligibleTasks();
  await fetchAndRenderBounties(container);
}

async function populateEligibleTasks() {
  const select = document.getElementById('bounty-task-id') as HTMLSelectElement;
  const hint = document.getElementById('task-select-hint') as HTMLParagraphElement;
  if (!select) return;

  try {
    const tasks = await apiFetch('/bounties/eligible-tasks');
    if (tasks.length === 0) {
      select.innerHTML = '<option value="" disabled selected>-- NO PEER TASKS AVAILABLE --</option>';
      select.disabled = true;
      if (hint) {
        hint.textContent = 'No peer pending tasks found. Only tasks belonging to teammates can be challenged.';
        hint.classList.remove('hidden');
      }
      return;
    }

    select.disabled = false;
    select.innerHTML = '<option value="" disabled selected>Select a target task...</option>' + 
      tasks.map((t: any) => {
        const est = t.estimated_hours ? `${t.estimated_hours}h` : 'N/A';
        const bountiesLabel = t.active_bounties_count > 0 ? ` [${t.active_bounties_count} active / ${t.total_bounty_points} pts staked]` : '';
        return `<option value="${t.id}">[${t.user_name}] "${t.title}" (Est: ${est})${bountiesLabel}</option>`;
      }).join('');

    if (hint) {
      hint.textContent = `${tasks.length} active peer task(s) available for challenge.`;
      hint.classList.remove('hidden');
    }
  } catch (err) {
    select.innerHTML = '<option value="" disabled>Error fetching peer tasks</option>';
  }
}

function setupFilterTabs(container: HTMLDivElement) {
  const allBtn = document.getElementById('filter-all-btn');
  const activeBtn = document.getElementById('filter-active-btn');
  const resolvedBtn = document.getElementById('filter-resolved-btn');

  function updateTabStyles() {
    [allBtn, activeBtn, resolvedBtn].forEach(b => {
      if (b) {
        b.className = 'filter-tab px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all';
      }
    });
    if (activeFilter === 'all' && allBtn) {
      allBtn.className = 'filter-tab px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white transition-all';
    } else if (activeFilter === 'active' && activeBtn) {
      activeBtn.className = 'filter-tab px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-white transition-all';
    } else if (activeFilter === 'resolved' && resolvedBtn) {
      resolvedBtn.className = 'filter-tab px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white transition-all';
    }
    renderFilteredBounties(container);
  }

  allBtn?.addEventListener('click', () => { activeFilter = 'all'; updateTabStyles(); });
  activeBtn?.addEventListener('click', () => { activeFilter = 'active'; updateTabStyles(); });
  resolvedBtn?.addEventListener('click', () => { activeFilter = 'resolved'; updateTabStyles(); });
}

function renderFilteredBounties(container: HTMLDivElement) {
  let list = cachedBounties;
  if (activeFilter === 'active') {
    list = cachedBounties.filter(b => b.status === 'ACTIVE');
  } else if (activeFilter === 'resolved') {
    list = cachedBounties.filter(b => b.status !== 'ACTIVE');
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="theme-card text-center py-14 border-dashed">
        <span class="data-text text-muted">No contracts match the current filter.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((b: any) => {
    const isActive = b.status === 'ACTIVE';
    const isTargetWon = b.status === 'RESOLVED_TARGET_WON';
    const isIssuerWon = b.status === 'RESOLVED_ISSUER_WON';

    let statusBadge = '';
    if (isActive) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-500">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
          ACTIVE ESCROW
        </span>
      `;
    } else if (isTargetWon) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          ✓ TARGET WON (+${b.points_at_stake} pts)
        </span>
      `;
    } else if (isIssuerWon) {
      statusBadge = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
          🏆 ISSUER WON (Penalty Claimed)
        </span>
      `;
    } else {
      statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-mono bg-surface border border-border text-muted">${b.status}</span>`;
    }

    const isMyBounty = b.issuer_id === currentUserId;
    const canRetract = isActive && isMyBounty;

    const issuerName = b.issuer_name || 'Operative';
    const targetName = b.target_user_name || 'Operative';
    const taskTitle = b.target_task_title || 'Classified Objective';

    return `
      <div class="theme-card p-5 transition-all duration-200 hover:border-amber-500/40 relative overflow-hidden space-y-3.5" id="bounty-card-${b.id}">
        <!-- Top Row: Points & Status -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="text-lg font-mono font-black ${isActive ? 'text-amber-400' : isTargetWon ? 'text-emerald-400' : 'text-purple-400'}">
              ⚡ ${b.points_at_stake} PTS
            </span>
            ${statusBadge}
          </div>

          ${canRetract ? `
            <button data-bounty-id="${b.id}" data-pts="${b.points_at_stake}" class="retract-bounty-btn text-[11px] font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 transition-all cursor-pointer">
              Retract & Refund
            </button>
          ` : ''}
        </div>

        <!-- Middle: Task Title -->
        <div>
          <div class="text-[11px] font-mono uppercase text-muted tracking-wider mb-1">Target Task</div>
          <h4 class="text-sm font-semibold text-primary tracking-tight">${escapeHtml(taskTitle)}</h4>
        </div>

        <!-- Bottom: Matchup Telemetry -->
        <div class="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60 text-[11px] font-mono text-muted">
          <div class="flex items-center gap-2">
            <span class="text-body font-semibold flex items-center gap-1">
              <span class="w-4 h-4 rounded-full bg-accent/20 text-accent flex items-center justify-center text-[9px] font-bold">
                ${issuerName.charAt(0).toUpperCase()}
              </span>
              ${escapeHtml(issuerName)} ${isMyBounty ? '<span class="text-[10px] text-accent font-normal">(You)</span>' : ''}
            </span>
            <span class="text-muted/60">challenged</span>
            <span class="text-primary font-semibold flex items-center gap-1">
              <span class="w-4 h-4 rounded-full bg-surface border border-border text-primary flex items-center justify-center text-[9px] font-bold">
                ${targetName.charAt(0).toUpperCase()}
              </span>
              ${escapeHtml(targetName)}
            </span>
          </div>

          <div class="text-[10px] text-muted">
            Contract ID: ${b.id.slice(0, 8)}...
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Retract Buttons Listener
  const retractBtns = container.querySelectorAll('.retract-bounty-btn');
  retractBtns.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const bountyId = target.getAttribute('data-bounty-id');
      const pts = target.getAttribute('data-pts') || 'points';
      if (!bountyId) return;

      const confirmed = window.confirm(`Are you sure you want to retract this active contract and refund ${pts} points back to your vault?`);
      if (!confirmed) return;

      target.disabled = true;
      target.textContent = 'Refunding...';

      try {
        await apiFetch(`/bounties/${bountyId}`, { method: 'DELETE' });
        
        // Refresh balance & feeds
        const me = await apiFetch('/users/me');
        currentUserPoints = me.total_lifetime_points || 0;
        const kpiMyPoints = document.getElementById('kpi-my-points');
        const maxHint = document.getElementById('max-stake-hint');
        if (kpiMyPoints) kpiMyPoints.textContent = `${currentUserPoints} pts`;
        if (maxHint) maxHint.textContent = `Available: ${currentUserPoints} pts`;

        await populateEligibleTasks();
        await fetchAndRenderBounties(container);
      } catch (err: any) {
        alert(`Failed to retract bounty: ${err.message}`);
        target.disabled = false;
        target.textContent = 'Retract & Refund';
      }
    });
  });
}

async function fetchAndRenderBounties(container: HTMLDivElement) {
  try {
    const bounties = await apiFetch('/bounties');
    cachedBounties = bounties;

    // Update Counts
    const countAll = document.getElementById('count-all');
    const countActive = document.getElementById('count-active');
    const countResolved = document.getElementById('count-resolved');
    const kpiActive = document.getElementById('kpi-active-bounties');

    const activeList = bounties.filter((b: any) => b.status === 'ACTIVE');
    const resolvedList = bounties.filter((b: any) => b.status !== 'ACTIVE');

    if (countAll) countAll.textContent = String(bounties.length);
    if (countActive) countActive.textContent = String(activeList.length);
    if (countResolved) countResolved.textContent = String(resolvedList.length);
    if (kpiActive) kpiActive.textContent = `${activeList.length} Active`;

    renderFilteredBounties(container);
  } catch (e: any) {
    container.innerHTML = `
      <div class="theme-card border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs data-text p-4">
        Error loading bounty contracts: ${e.message}
      </div>
    `;
  }
}
