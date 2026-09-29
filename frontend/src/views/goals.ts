import { apiFetch } from '../api';
import { renderNavbar, setupNavbarLogic } from './components/navbar';
import { escapeHtml } from '../utils';

export function renderGoals(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col">
      ${renderNavbar('goals')}

      <!-- Main Content -->
      <main class="flex-1 w-full max-w-[1240px] mx-auto p-6 md:p-10 space-y-8">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono uppercase tracking-wider mb-2.5">
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span>Strategic Directives // Skill Campaigns</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-primary tracking-tight">Active Objectives</h2>
            <p class="text-body text-sm mt-1">Define long-term campaigns. Link daily execution tasks to accumulate mastery points.</p>
          </div>

          <!-- Top Stats Cards -->
          <div class="flex items-center gap-3 font-mono">
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider">Active Campaigns</div>
              <div id="kpi-active-goals" class="text-xl font-bold text-emerald-400 mt-0.5">--</div>
            </div>
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider">Campaign Points</div>
              <div id="kpi-goals-points" class="text-xl font-bold text-accent mt-0.5">-- pts</div>
            </div>
          </div>
        </div>

        <!-- Main Bento Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Panel: Create Goal Form (4 cols) -->
          <div class="lg:col-span-4 theme-card p-6 md:p-7 relative border-dashed h-fit space-y-5">
            <div class="flex items-center justify-between pb-3 border-b border-border/70">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Initialize Objective
              </h3>
              <span class="text-[10px] font-mono text-muted uppercase">Phase 1</span>
            </div>

            <form id="create-goal-form" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-primary mb-1.5">Objective Title</label>
                <input type="text" id="goal-title" required class="theme-input text-sm" placeholder="e.g. Master Typescript & Next.js" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-primary mb-1.5">Competency Domain</label>
                <select id="goal-category" class="theme-input text-xs font-medium">
                  <option value="Development">Development (Full-Stack & Systems • 12.5 pts/hr)</option>
                  <option value="DSA">DSA (Algorithms & Problem Solving • 15 pts/hr)</option>
                  <option value="College Work">College Work (Academics & Exams • 10 pts/hr)</option>
                </select>
              </div>

              <!-- Private Goal Checkbox -->
              <div class="flex items-center space-x-2.5 pt-1">
                <input type="checkbox" id="goal-private" class="rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-surface w-4 h-4 cursor-pointer" />
                <label class="text-[11px] uppercase text-muted tracking-wider cursor-pointer select-none font-semibold" for="goal-private">
                  Mark as Classified Directive (Private Goal)
                </label>
              </div>

              <div class="p-3 rounded-xl bg-surface/60 border border-border text-[11px] text-muted leading-relaxed font-mono">
                Points from completed tasks under this objective funnel directly into this domain on your Skill Matrix Radar at its designated hourly rate.
              </div>

              <button type="submit" id="submit-goal-btn" class="btn-primary w-full text-[11px] uppercase tracking-widest py-2.5 mt-2 cursor-pointer shadow-sm">
                Commit Objective
              </button>
            </form>
          </div>

          <!-- Right Panel: Goals Board (8 cols) -->
          <div class="lg:col-span-8 space-y-4">
            
            <!-- Filter Tabs -->
            <div class="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-border/60">
              <div class="flex flex-wrap items-center gap-1.5" id="category-filters">
                <button class="cat-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white transition-all" data-cat="all">All</button>
                <button class="cat-filter-btn px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all" data-cat="Development">Development (12.5h)</button>
                <button class="cat-filter-btn px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all" data-cat="DSA">DSA (15h)</button>
                <button class="cat-filter-btn px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all" data-cat="College Work">College Work (10h)</button>
                <button class="cat-filter-btn px-3 py-1 rounded-full text-xs font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-all border border-amber-500/20" data-cat="private">🔒 Classified</button>
              </div>

              <div class="flex items-center gap-2">
                <button id="toggle-status-filter" class="text-xs font-mono px-2.5 py-1 rounded-lg border border-border text-muted hover:text-primary hover:border-accent transition-colors cursor-pointer">
                  Showing: <span id="status-filter-label" class="font-bold text-accent">Active Only</span>
                </button>
              </div>
            </div>

            <!-- Objectives List Container -->
            <div id="goals-container" class="space-y-4">
               <div class="theme-card text-center py-16 animate-pulse">
                  <span class="data-text text-muted">Scanning strategic objectives...</span>
               </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  `;
}

let cachedGoals: any[] = [];
let selectedCategory = 'all';
let showOnlyActive = true;

const CATEGORY_STYLES: Record<string, { badge: string; bar: string }> = {
  'DSA': { badge: 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10', bar: '#6366f1' },
  'Development': { badge: 'border-sky-500/30 text-sky-400 bg-sky-500/10', bar: '#38bdf8' },
  'College Work': { badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10', bar: '#f59e0b' },
  'College Studies': { badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10', bar: '#f59e0b' },
  'Coding': { badge: 'border-sky-500/30 text-sky-400 bg-sky-500/10', bar: '#38bdf8' },
  'Learning': { badge: 'border-amber-500/30 text-amber-400 bg-amber-500/10', bar: '#f59e0b' },
  'Career': { badge: 'border-purple-500/30 text-purple-400 bg-purple-500/10', bar: '#818cf8' },
};

export function setupGoalsLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);

  const form = document.getElementById('create-goal-form') as HTMLFormElement;
  const container = document.getElementById('goals-container') as HTMLDivElement;

  // Category filter buttons
  document.querySelectorAll('.cat-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.cat-filter-btn').forEach(b => {
        b.className = 'cat-filter-btn px-3 py-1 rounded-full text-xs font-medium text-muted hover:text-primary transition-all';
      });
      const target = e.currentTarget as HTMLButtonElement;
      target.className = 'cat-filter-btn px-3 py-1 rounded-full text-xs font-semibold bg-accent text-white transition-all';
      selectedCategory = target.getAttribute('data-cat') || 'all';
      renderFilteredGoals(container, navigateFn);
    });
  });

  // Status toggle filter (Active vs All)
  const statusFilterBtn = document.getElementById('toggle-status-filter');
  const statusFilterLabel = document.getElementById('status-filter-label');
  if (statusFilterBtn && statusFilterLabel) {
    statusFilterBtn.addEventListener('click', () => {
      showOnlyActive = !showOnlyActive;
      statusFilterLabel.textContent = showOnlyActive ? 'Active Only' : 'All Statuses';
      renderFilteredGoals(container, navigateFn);
    });
  }

  // Create Goal
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('submit-goal-btn') as HTMLButtonElement;
      btn.disabled = true;
      btn.textContent = 'COMMITTING...';

      const title = (document.getElementById('goal-title') as HTMLInputElement).value;
      const category = (document.getElementById('goal-category') as HTMLSelectElement).value;
      const isPrivate = (document.getElementById('goal-private') as HTMLInputElement).checked;

      try {
        await apiFetch('/goals', {
          method: 'POST',
          body: JSON.stringify({ title, category, is_private: isPrivate })
        });
        form.reset();
        await fetchAndRenderGoals(container, navigateFn);
      } catch (err: any) {
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Commit Objective';
      }
    });
  }

  // Auto-refresh objectives when a task is initialized anywhere in the app
  window.addEventListener('task-created', () => {
    fetchAndRenderGoals(container, navigateFn);
  });

  fetchAndRenderGoals(container, navigateFn);
}

function renderFilteredGoals(container: HTMLDivElement, navigateFn: (route: string) => void) {
  let list = cachedGoals;

  if (selectedCategory === 'private') {
    list = list.filter(g => g.is_private);
  } else if (selectedCategory === 'College Work') {
    list = list.filter(g => g.category === 'College Work' || g.category === 'College Studies' || g.category === 'Learning');
  } else if (selectedCategory !== 'all') {
    list = list.filter(g => g.category === selectedCategory);
  }

  if (showOnlyActive) {
    list = list.filter(g => g.status === 'ACTIVE');
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="theme-card text-center py-14 border-dashed">
        <span class="data-text text-muted">No objectives match this filter.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map((g: any) => {
    const isCompleted = g.status === 'COMPLETED';
    const catStyle = CATEGORY_STYLES[g.category] || { badge: 'border-border text-muted bg-surface', bar: '#635bff' };
    
    const tasksCount = g.tasks_count || 0;
    const completedTasks = g.completed_tasks_count || 0;
    const pointsEarned = g.points_earned || 0;
    const hoursLogged = g.hours_logged || 0;

    const percent = tasksCount > 0 ? Math.round((completedTasks / tasksCount) * 100) : 0;

    return `
      <div class="theme-card p-6 transition-all duration-200 hover:border-accent/40 space-y-4 relative overflow-hidden ${g.is_private ? 'border-l-4 border-l-amber-400' : ''}" id="goal-card-${g.id}">
        
        <!-- Top Row: Category Badge, Privacy, Status, Actions -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider border font-bold ${catStyle.badge}">
              ${g.category}
            </span>
            ${g.is_private ? `
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                🔒 CLASSIFIED
              </span>
            ` : ''}
            ${isCompleted ? `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                🏆 OBJECTIVE COMPLETED
              </span>
            ` : `
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> ACTIVE CAMPAIGN
              </span>
            `}
          </div>

          <div class="flex items-center gap-2">
            <!-- Toggle Completed / Reactivate Button -->
            <button 
              data-goal-id="${g.id}" 
              data-next-status="${isCompleted ? 'ACTIVE' : 'COMPLETED'}" 
              class="toggle-status-btn text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                isCompleted 
                  ? 'border-border text-muted hover:text-primary hover:border-accent' 
                  : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
              }"
            >
              ${isCompleted ? '↺ Reactivate' : '✓ Mark Finished'}
            </button>

            <!-- Delete Button -->
            <button 
              data-goal-id="${g.id}" 
              data-goal-title="${(g.title || '').replace(/"/g, '&quot;')}"
              class="delete-goal-btn text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 transition-all cursor-pointer"
              title="Delete Objective"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Title -->
        <div>
          <h4 class="text-base font-semibold text-primary tracking-tight">${escapeHtml(g.title)}</h4>
        </div>

        <!-- Progress Bar -->
        <div class="space-y-1.5">
          <div class="flex justify-between items-center text-[11px] font-mono text-muted">
            <span>Execution Progress</span>
            <span class="font-bold text-primary">${completedTasks} / ${tasksCount} Tasks (${percent}%)</span>
          </div>
          <div class="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
            <div class="h-full rounded-full transition-all duration-700 ease-out" 
                 style="width: ${Math.max(percent, completedTasks > 0 ? 5 : 0)}%; background-color: ${catStyle.bar};">
            </div>
          </div>
        </div>

        <!-- Metrics Strip -->
        <div class="grid grid-cols-3 gap-3 pt-3 border-t border-border/60 text-center font-mono">
          <div class="p-2 rounded-xl bg-surface/50 border border-border/40">
            <div class="text-[9px] text-muted uppercase tracking-wider">Completed</div>
            <div class="text-xs font-bold text-primary mt-0.5">${completedTasks} tasks</div>
          </div>
          <div class="p-2 rounded-xl bg-surface/50 border border-border/40">
            <div class="text-[9px] text-muted uppercase tracking-wider">Points Funneled</div>
            <div class="text-xs font-bold text-accent mt-0.5">+${pointsEarned} pts</div>
          </div>
          <div class="p-2 rounded-xl bg-surface/50 border border-border/40">
            <div class="text-[9px] text-muted uppercase tracking-wider">Hours Logged</div>
            <div class="text-xs font-bold text-primary mt-0.5">${hoursLogged}h</div>
          </div>
        </div>

        <!-- Accordion / Drawer for Linked Tasks -->
        <div class="pt-1">
          <button data-goal-id="${g.id}" class="toggle-tasks-btn w-full flex items-center justify-between text-[11px] font-mono text-muted hover:text-accent transition-colors pt-2 border-t border-border/40 cursor-pointer">
            <span class="flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5 chevron-icon transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
              <span>View Linked Tasks (${tasksCount})</span>
            </span>
            <span class="text-[10px] text-muted/60">ID: ${g.id.slice(0, 8)}...</span>
          </button>

          <!-- Drawer Content Container (Hidden by default) -->
          <div id="tasks-drawer-${g.id}" class="tasks-drawer hidden mt-3 pt-3 border-t border-border/40 space-y-2">
            <div class="text-xs text-muted font-mono animate-pulse py-2 text-center">Loading linked tasks...</div>
          </div>
        </div>

      </div>
    `;
  }).join('');

  attachCardEventListeners(container, navigateFn);
}

function attachCardEventListeners(container: HTMLDivElement, navigateFn: (route: string) => void) {
  // Toggle Status (ACTIVE <-> COMPLETED)
  container.querySelectorAll('.toggle-status-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const goalId = target.getAttribute('data-goal-id');
      const nextStatus = target.getAttribute('data-next-status');
      if (!goalId || !nextStatus) return;

      target.disabled = true;
      target.textContent = 'Updating...';

      try {
        await apiFetch(`/goals/${goalId}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus })
        });
        await fetchAndRenderGoals(container, navigateFn);
      } catch (err: any) {
        alert(`Failed to update status: ${err.message}`);
        target.disabled = false;
      }
    });
  });

  // Delete Goal
  container.querySelectorAll('.delete-goal-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const goalId = target.getAttribute('data-goal-id');
      const goalTitle = target.getAttribute('data-goal-title') || 'this objective';
      if (!goalId) return;

      const confirmed = window.confirm(`Are you sure you want to delete "${goalTitle}"?\nAny tasks linked to this objective will remain intact.`);
      if (!confirmed) return;

      target.disabled = true;

      try {
        await apiFetch(`/goals/${goalId}`, { method: 'DELETE' });
        await fetchAndRenderGoals(container, navigateFn);
      } catch (err: any) {
        alert(`Failed to delete objective: ${err.message}`);
        target.disabled = false;
      }
    });
  });

  // Toggle Linked Tasks Drawer
  container.querySelectorAll('.toggle-tasks-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const goalId = target.getAttribute('data-goal-id');
      if (!goalId) return;

      const drawer = document.getElementById(`tasks-drawer-${goalId}`) as HTMLDivElement;
      const chevron = target.querySelector('.chevron-icon');
      if (!drawer) return;

      const isHidden = drawer.classList.contains('hidden');
      if (isHidden) {
        drawer.classList.remove('hidden');
        if (chevron) chevron.classList.add('rotate-180');

        // Fetch tasks
        try {
          const tasks = await apiFetch(`/goals/${goalId}/tasks`);
          if (tasks.length === 0) {
            drawer.innerHTML = `
              <div class="text-[11px] font-mono text-muted text-center py-2 bg-surface/40 rounded-lg">
                No tasks linked yet. Choose this objective when creating a task on the <a href="#" class="go-to-dash text-accent underline">Dashboard</a>.
              </div>
            `;
            drawer.querySelector('.go-to-dash')?.addEventListener('click', (ev) => {
              ev.preventDefault();
              navigateFn('dashboard');
            });
            return;
          }

          drawer.innerHTML = tasks.map((t: any) => {
            const isDone = t.status === 'COMPLETED';
            const isInProgress = t.status === 'IN_PROGRESS';
            return `
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface/60 border border-border/50 text-[11px] font-mono">
                <div class="flex items-center gap-2">
                  <span class="w-1.5 h-1.5 rounded-full ${isDone || isInProgress ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
                  <span class="font-semibold text-primary">${escapeHtml(t.title)}</span>
                  <span class="px-2 py-0.5 rounded text-[9px] ${
                    isDone ? 'bg-emerald-500/10 text-emerald-400' : 
                    isInProgress ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold' : 
                    'bg-amber-500/10 text-amber-400'
                  }">
                    ${isInProgress ? 'IN FOCUS' : t.status}
                  </span>
                </div>
                <div class="flex items-center gap-3 text-muted">
                  <span>${isDone ? `${t.actual_hours || t.estimated_hours}h logged` : `Est: ${t.estimated_hours}h`}</span>
                  <span class="text-accent font-bold">+${t.points_earned} pts</span>
                </div>
              </div>
            `;
          }).join('');

        } catch (err: any) {
          drawer.innerHTML = `<div class="text-[11px] text-rose-500 font-mono text-center">Failed to load tasks: ${escapeHtml(err.message)}</div>`;
        }

      } else {
        drawer.classList.add('hidden');
        if (chevron) chevron.classList.remove('rotate-180');
      }
    });
  });
}

async function fetchAndRenderGoals(container: HTMLDivElement, navigateFn: (route: string) => void) {
  try {
    const goals = await apiFetch('/goals');
    cachedGoals = goals;

    // Update KPI badges
    const kpiActive = document.getElementById('kpi-active-goals');
    const kpiPoints = document.getElementById('kpi-goals-points');

    const activeGoals = goals.filter((g: any) => g.status === 'ACTIVE');
    const totalPts = goals.reduce((acc: number, g: any) => acc + (g.points_earned || 0), 0);

    if (kpiActive) kpiActive.textContent = `${activeGoals.length} Active`;
    if (kpiPoints) kpiPoints.textContent = `${totalPts} pts`;

    renderFilteredGoals(container, navigateFn);
  } catch (e: any) {
    container.innerHTML = `
      <div class="theme-card border-rose-500/30 bg-rose-500/5 text-rose-500 text-xs data-text p-4">
        Error loading strategic objectives: ${e.message}
      </div>
    `;
  }
}
