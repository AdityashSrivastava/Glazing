import { apiFetch } from '../api';
import { renderNavbar, setupNavbarLogic } from './components/navbar';
import { escapeHtml } from '../utils';

export function renderLeaderboard(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col">
      ${renderNavbar('leaderboard')}

      <!-- Main Content -->
      <main class="flex-1 w-full max-w-[1240px] mx-auto p-6 md:p-10 space-y-8">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono uppercase tracking-wider mb-2.5">
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
              <span>Combat Telemetry // Real-Time Rankings</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-primary tracking-tight">Squad Leaderboard</h2>
            <p class="text-body text-sm mt-1">High-velocity operative standings. Daily sprint points freeze every night at 12:00 AM IST.</p>
          </div>

          <!-- Ticking Midnight Countdown & Today's Total -->
          <div class="flex flex-wrap items-center gap-3 font-mono">
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Midnight IST Reset</span>
              </div>
              <div id="ticking-countdown" class="text-lg font-black text-amber-400 mt-0.5">--:--:--</div>
            </div>
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] text-muted uppercase tracking-wider">Squad Points Today</div>
              <div id="kpi-squad-today" class="text-lg font-black text-accent mt-0.5">-- pts</div>
            </div>
          </div>
        </div>

        <!-- Timeframe Switcher Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/70">
          <div class="flex items-center gap-2" id="timeframe-buttons">
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-accent text-white shadow-sm" data-tf="daily">
              <span>☀️</span> Daily Sprint
            </button>
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2" data-tf="weekly">
              <span>📅</span> Weekly League
            </button>
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2" data-tf="all_time">
              <span>🏆</span> All-Time Pantheon
            </button>
          </div>

          <!-- First Blood Badge -->
          <div id="first-blood-badge" class="hidden items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold">
            <span>🩸 First Blood:</span>
            <strong id="first-blood-name" class="text-primary font-bold">--</strong>
          </div>
        </div>

        <!-- Top 3 Podium Cards -->
        <div id="podium-container" class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <!-- Dynamically populated -->
        </div>

        <!-- Current User Position Banner -->
        <div id="my-standing-banner" class="theme-card p-4 bg-accent/[0.04] border-accent/30 flex items-center justify-between text-xs font-mono hidden">
          <div class="flex items-center gap-3">
            <span class="text-lg">🎯</span>
            <span id="my-standing-text" class="text-body font-medium">Calculating your position...</span>
          </div>
          <span id="my-standing-rank" class="px-2.5 py-1 rounded-lg bg-accent text-white font-bold">#--</span>
        </div>

        <!-- Complete Ranked Operative Table -->
        <div class="theme-card overflow-hidden p-0 border border-border shadow-sm">
          <div class="px-6 py-4 border-b border-border/70 flex items-center justify-between">
            <h3 class="text-xs font-semibold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent inline-block"></span>
              Operative Registry & Telemetry
            </h3>
            <span class="text-[10px] font-mono text-muted uppercase">Closed Loop: 5 Operatives</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-primary">
              <thead class="text-[11px] uppercase tracking-wider text-muted bg-surface/50 border-b border-border font-semibold font-mono">
                <tr>
                  <th class="px-6 py-3.5">Rank</th>
                  <th class="px-6 py-3.5">Operative</th>
                  <th class="px-6 py-3.5">Tier Status</th>
                  <th class="px-6 py-3.5 text-center">Execution</th>
                  <th class="px-6 py-3.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody id="leaderboard-tbody" class="divide-y divide-border/40">
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center text-muted data-text animate-pulse">
                    Synchronizing combat matrix...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Dev / Admin System Operations Bar -->
        <div class="flex items-center justify-between pt-6 border-t border-border/60 text-xs font-mono text-muted">
          <span>SYSTEM TIMEZONE: ASIA/KOLKATA (IST UTC+5:30)</span>
          <div class="flex items-center gap-3">
            <button id="resolve-abandoned-btn" class="px-2.5 py-1 rounded border border-border hover:border-rose-500 hover:text-rose-400 transition-colors cursor-pointer text-[10px]">
              Resolve Expired Tasks
            </button>
            <button id="generate-snapshots-btn" class="px-2.5 py-1 rounded border border-border hover:border-accent hover:text-accent transition-colors cursor-pointer text-[10px]">
              Trigger Midnight Snapshot
            </button>
          </div>
        </div>

      </main>
    </div>
  `;
}

let currentTimeframe = 'daily';
let countdownInterval: any = null;
let currentRemainingSeconds = 0;

export function setupLeaderboardLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);

  // Timeframe Tab Switching
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timeframe-btn').forEach(b => {
        b.className = 'timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2';
      });
      const target = e.currentTarget as HTMLButtonElement;
      target.className = 'timeframe-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-accent text-white shadow-sm';
      currentTimeframe = target.getAttribute('data-tf') || 'daily';
      fetchAndRenderLeaderboard();
    });
  });

  // Admin Ops
  const snapshotBtn = document.getElementById('generate-snapshots-btn') as HTMLButtonElement;
  const abandonBtn = document.getElementById('resolve-abandoned-btn') as HTMLButtonElement;

  if (snapshotBtn) {
    snapshotBtn.addEventListener('click', async () => {
      try {
        snapshotBtn.textContent = 'Generating...';
        const res = await apiFetch('/users/snapshots/generate', { method: 'POST' });
        alert(res.message);
        fetchAndRenderLeaderboard();
      } catch (e: any) {
        alert(`Error: ${e.message}`);
      } finally {
        snapshotBtn.textContent = 'Trigger Midnight Snapshot';
      }
    });
  }

  if (abandonBtn) {
    abandonBtn.addEventListener('click', async () => {
      try {
        abandonBtn.textContent = 'Resolving...';
        const res = await apiFetch('/tasks/cron/resolve-abandoned', { method: 'POST' });
        alert(res.message);
        fetchAndRenderLeaderboard();
      } catch (e: any) {
        alert(`Error: ${e.message}`);
      } finally {
        abandonBtn.textContent = 'Resolve Expired Tasks';
      }
    });
  }

  fetchAndRenderLeaderboard();
}

function startCountdown(seconds: number) {
  if (countdownInterval) clearInterval(countdownInterval);
  currentRemainingSeconds = seconds;

  const clockEl = document.getElementById('ticking-countdown');

  function updateClock() {
    if (!clockEl) return;
    if (currentRemainingSeconds <= 0) {
      clockEl.textContent = '00:00:00 (RESETTING)';
      return;
    }
    const h = Math.floor(currentRemainingSeconds / 3600);
    const m = Math.floor((currentRemainingSeconds % 3600) / 60);
    const s = currentRemainingSeconds % 60;
    clockEl.textContent = `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
    currentRemainingSeconds--;
  }

  updateClock();
  countdownInterval = setInterval(updateClock, 1000);
}

async function fetchAndRenderLeaderboard() {
  const tbody = document.getElementById('leaderboard-tbody') as HTMLTableSectionElement;
  const podiumContainer = document.getElementById('podium-container') as HTMLDivElement;
  const kpiSquad = document.getElementById('kpi-squad-today');
  const fbBadge = document.getElementById('first-blood-badge');
  const fbName = document.getElementById('first-blood-name');
  const myBanner = document.getElementById('my-standing-banner');
  const myText = document.getElementById('my-standing-text');
  const myRankEl = document.getElementById('my-standing-rank');

  try {
    const data = await apiFetch(`/users/leaderboard?timeframe=${currentTimeframe}`);
    const operatives = data.operatives || [];
    const meta = data.meta || {};

    // Start live midnight countdown
    if (meta.seconds_until_midnight_ist) {
      startCountdown(meta.seconds_until_midnight_ist);
    }

    if (kpiSquad) {
      kpiSquad.textContent = `${meta.squad_total_points_today || 0} pts`;
    }

    // First Blood Display
    if (meta.first_blood_operative && currentTimeframe === 'daily') {
      if (fbBadge && fbName) {
        fbName.textContent = meta.first_blood_operative;
        fbBadge.classList.remove('hidden');
        fbBadge.classList.add('flex');
      }
    } else if (fbBadge) {
      fbBadge.classList.add('hidden');
      fbBadge.classList.remove('flex');
    }

    // Render Podium for Top 3
    if (podiumContainer && operatives.length >= 3) {
      const top1 = operatives[0];
      const top2 = operatives[1];
      const top3 = operatives[2];

      const renderPodiumCard = (op: any, rank: number, crown: string, badgeBg: string, borderColor: string, heightOffset: string) => `
        <div data-rank="${rank}" class="theme-card p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300 hover:border-accent/60 ${heightOffset} ${borderColor}">
          <div class="text-3xl mb-1.5">${crown}</div>
          <div class="w-14 h-14 rounded-full flex items-center justify-center text-lg font-black font-mono mb-3 ${badgeBg} border">
            ${op.display_name.charAt(0).toUpperCase()}
          </div>
          
          <div class="flex items-center gap-1.5 mb-1">
            <h4 class="text-base font-bold text-primary tracking-tight">${escapeHtml(op.display_name)}</h4>
            ${op.is_me ? '<span class="text-[10px] text-accent font-mono font-bold">(You)</span>' : ''}
          </div>

          <span class="px-2 py-0.5 rounded text-[10px] font-mono text-muted border border-border uppercase tracking-wider mb-3">
            ${op.tier}
          </span>

          <div class="mt-auto w-full pt-3 border-t border-border/60">
            <div class="text-2xl font-black font-mono text-primary">${op.points}</div>
            <div class="text-[10px] font-mono text-muted uppercase mt-0.5">
              ${currentTimeframe === 'all_time' ? 'Lifetime Score' : currentTimeframe === 'weekly' ? 'Weekly Points' : "Today's Points"}
            </div>
            
            <div class="flex items-center justify-center gap-3 mt-2 text-[11px] font-mono text-muted">
              <span>${op.tasks_completed} tasks</span>
              <span>•</span>
              <span>${op.hours_logged}h logged</span>
            </div>
          </div>
        </div>
      `;

      // Order on desktop: #2 on left, #1 in center (elevated), #3 on right
      podiumContainer.innerHTML = `
        ${renderPodiumCard(top2, 2, '🥈 #2', 'bg-slate-400/10 text-slate-300 border-slate-400/30', 'border-slate-500/30', 'mt-4 md:mt-6')}
        ${renderPodiumCard(top1, 1, '👑 #1 CHAMPION', 'bg-amber-400/15 text-amber-400 border-amber-400/40 shadow-lg', 'border-amber-400/40 bg-amber-400/[0.02]', 'mt-0 scale-105 z-10')}
        ${renderPodiumCard(top3, 3, '🥉 #3', 'bg-amber-700/10 text-amber-600 border-amber-700/30', 'border-amber-700/30', 'mt-4 md:mt-8')}
      `;
    }

    // My Standing Banner
    if (myBanner && myText && myRankEl && meta.my_rank) {
      myBanner.classList.remove('hidden');
      myRankEl.textContent = `#${meta.my_rank}`;

      if (meta.my_rank === 1) {
        myText.innerHTML = `👑 <strong>Dominating the matrix!</strong> You are in 1st place with <strong>${meta.my_points} pts</strong>. Hold the lead until midnight freeze!`;
      } else {
        const leader = operatives[0];
        const gap = leader.points - (meta.my_points || 0);
        myText.innerHTML = `You are currently in <strong>#${meta.my_rank} place</strong> (${meta.my_points} pts). You are <strong>${gap} points behind</strong> #1 ${leader.display_name}.`;
      }
    }

    // Render Full Table
    if (operatives.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-12 text-center text-muted font-mono">
            No operative telemetry found for this timeframe.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = operatives.map((op: any) => {
      const isTop = op.rank === 1;
      const isTop3 = op.rank <= 3;
      
      let rankBadge = '';
      if (op.rank === 1) rankBadge = '<span class="text-amber-400 font-bold">👑 #1</span>';
      else if (op.rank === 2) rankBadge = '<span class="text-slate-300 font-bold">🥈 #2</span>';
      else if (op.rank === 3) rankBadge = '<span class="text-amber-600 font-bold">🥉 #3</span>';
      else rankBadge = `<span class="text-muted font-mono font-medium">#${op.rank}</span>`;

      return `
        <tr class="hover:bg-surface/50 transition-colors ${op.is_me ? 'bg-accent/[0.03]' : ''}">
          <!-- Rank -->
          <td class="px-6 py-4 font-mono text-sm whitespace-nowrap">
            ${rankBadge}
          </td>

          <!-- Operative -->
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                isTop ? 'bg-amber-400/20 text-amber-400' : 'bg-surface border border-border text-primary'
              }">
                ${op.display_name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-primary tracking-tight">${escapeHtml(op.display_name)}</span>
                  ${op.is_me ? '<span class="text-[10px] text-accent font-mono font-bold">(You)</span>' : ''}
                </div>

                <!-- Badges -->
                <div class="flex items-center gap-2 mt-0.5">
                  ${op.first_blood && currentTimeframe === 'daily' ? `
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      🩸 First Blood
                    </span>
                  ` : ''}

                  ${op.is_in_progress ? `
                    <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span class="w-1 h-1 rounded-full bg-emerald-400 animate-ping"></span>
                      In Focus
                    </span>
                  ` : ''}

                  ${op.current_streak > 0 ? `
                    <span class="text-[9px] font-mono text-amber-400">
                      🔥 ${op.current_streak}d
                    </span>
                  ` : ''}
                </div>
              </div>
            </div>
          </td>

          <!-- Tier Status -->
          <td class="px-6 py-4 font-mono text-xs text-muted whitespace-nowrap">
            <span class="px-2.5 py-1 rounded-full border border-border bg-surface text-[10px]">
              ${op.tier}
            </span>
          </td>

          <!-- Execution Stats -->
          <td class="px-6 py-4 text-center font-mono text-xs text-muted whitespace-nowrap">
            <span class="text-primary font-bold">${op.tasks_completed}</span> tasks
            <span class="mx-1 opacity-50">•</span>
            <span>${op.hours_logged}h</span>
          </td>

          <!-- Score -->
          <td class="px-6 py-4 text-right font-mono whitespace-nowrap">
            <span class="text-base font-black ${isTop ? 'text-accent' : isTop3 ? 'text-primary' : 'text-muted'}">
              +${op.points}
            </span>
            <span class="text-[10px] text-muted ml-0.5">pts</span>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err: any) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-12 text-center text-rose-500 bg-rose-500/5 font-mono text-xs">
          Telemetry Error: ${err.message}
        </td>
      </tr>
    `;
  }
}
