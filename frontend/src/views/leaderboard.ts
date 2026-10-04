import { apiFetch, getWeeklyAchievers } from '../api';
import { renderNavbar, setupNavbarLogic } from './components/navbar';
import { escapeHtml } from '../utils';
import { renderWeeklyWinnerModal, setupWeeklyWinnerModalLogic, openWeeklyWinnerModal } from './components/weekly_winner_modal';

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
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-accent text-white shadow-sm cursor-pointer" data-tf="daily">
              <span>☀️</span> Daily Sprint
            </button>
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2 cursor-pointer" data-tf="weekly">
              <span>📅</span> Weekly League
            </button>
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2 cursor-pointer" data-tf="all_time">
              <span>🏆</span> All-Time Pantheon
            </button>
            <button class="timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2 cursor-pointer" data-tf="weekly_achievers">
              <span>🏅</span> Weekly Achievers
            </button>
          </div>

          <!-- First Blood Badge -->
          <div id="first-blood-badge" class="hidden items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold">
            <span>🩸 First Blood:</span>
            <strong id="first-blood-name" class="text-primary font-bold">--</strong>
          </div>
        </div>

        <!-- Standard Leaderboard View (Daily, Weekly, All-Time) -->
        <div id="standard-leaderboard-view" class="space-y-8">
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
        </div>

        <!-- Weekly Achievers & Hall of Champions View -->
        <div id="weekly-achievers-view" class="hidden space-y-8">
          <!-- Dynamically populated by fetchAndRenderWeeklyAchievers() -->
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

      <!-- Weekly Winner Celebration Modal Mount -->
      ${renderWeeklyWinnerModal()}
    </div>
  `;
}

let currentTimeframe = 'daily';
let countdownInterval: any = null;
let currentRemainingSeconds = 0;

export function setupLeaderboardLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);
  setupWeeklyWinnerModalLogic();

  // Timeframe Tab Switching
  document.querySelectorAll('.timeframe-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timeframe-btn').forEach(b => {
        b.className = 'timeframe-btn px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-primary transition-all flex items-center gap-2 cursor-pointer';
      });
      const target = e.currentTarget as HTMLButtonElement;
      target.className = 'timeframe-btn px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-accent text-white shadow-sm cursor-pointer';
      currentTimeframe = target.getAttribute('data-tf') || 'daily';

      const stdView = document.getElementById('standard-leaderboard-view');
      const weeklyView = document.getElementById('weekly-achievers-view');
      const fbBadge = document.getElementById('first-blood-badge');

      if (currentTimeframe === 'weekly_achievers') {
        if (stdView) stdView.classList.add('hidden');
        if (weeklyView) weeklyView.classList.remove('hidden');
        if (fbBadge) fbBadge.classList.add('hidden');
        fetchAndRenderWeeklyAchievers();
      } else {
        if (weeklyView) weeklyView.classList.add('hidden');
        if (stdView) stdView.classList.remove('hidden');
        fetchAndRenderLeaderboard();
      }
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
        const gap = (leader?.points || 0) - (meta.my_points || 0);
        myText.innerHTML = `You are currently in <strong>#${meta.my_rank} place</strong> (${meta.my_points} pts). You are <strong>${gap} points behind</strong> #1 ${escapeHtml(leader?.display_name || 'Operative')}.`;
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

async function fetchAndRenderWeeklyAchievers() {
  const container = document.getElementById('weekly-achievers-view');
  if (!container) return;

  container.innerHTML = `
    <div class="theme-card p-12 text-center text-muted font-mono animate-pulse">
      Retrieving weekly achievers and party mandate telemetry...
    </div>
  `;

  try {
    const data = await getWeeklyAchievers();
    const latest = data.latest_completed_week;
    const preview = data.current_week_preview;
    const pastWeeks = data.past_weeks || [];
    const isSunday = data.is_sunday_night;

    const activeOrLatest = (latest && latest.is_completed) ? latest : preview;
    const winner = activeOrLatest?.winner;
    const s1 = activeOrLatest?.party_sponsors?.[0] || 'Rank 4';
    const s2 = activeOrLatest?.party_sponsors?.[1] || 'Rank 5';
    const isCompleted = activeOrLatest?.is_completed || false;

    let heroHtml = '';
    if (activeOrLatest && winner) {
      heroHtml = `
        <div class="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-amber-400/[0.08] via-surface to-orange-500/[0.05] border border-amber-400/30 shadow-lg">
          
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/60">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full ${isCompleted ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30'} text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                <span>${isCompleted ? '👑 REIGNING WEEKLY CHAMPION' : isSunday ? '⚡ SUNDAY SPRINT FINALE (FREEZES AT 12:00 AM)' : '🔥 LIVE SPRINT PROJECTION'}</span>
              </div>
              <h3 class="text-3xl md:text-4xl font-extrabold text-primary tracking-tight">
                ${escapeHtml(winner.display_name)}
              </h3>
              <p class="text-xs text-muted font-mono mt-1">
                ${escapeHtml(activeOrLatest.week_label)} • ${winner.points} pts scored • ${winner.tasks_completed} tasks • ${winner.hours_logged}h logged
                ${!isCompleted ? ' • <span class="text-amber-400 font-bold">Live Standings</span>' : ''}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <button id="view-celebration-popup-btn" class="btn-primary py-2.5 px-5 text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-amber-400/20 cursor-pointer">
                <span>🎉</span> ${isCompleted ? 'View Party Mandate Popup' : 'Preview Party Mandate'}
              </button>
            </div>
          </div>

          <!-- Paneer Patties Party Callout Box -->
          <div class="mt-6 p-4 md:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <span class="text-3xl md:text-4xl select-none">🍔</span>
              <div>
                <h4 class="text-xs font-black uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1.5">
                  <span>PANEER PATTIES PARTY MANDATE</span>
                </h4>
                <p class="text-xs text-body font-medium mt-0.5 leading-relaxed">
                  ${isCompleted 
                    ? `Rank 4 (<strong>${escapeHtml(s1)}</strong>) & Rank 5 (<strong>${escapeHtml(s2)}</strong>) MUST sponsor a celebratory Paneer Patties Party for champion <strong>${escapeHtml(winner.display_name)}</strong>!`
                    : `<strong>Sunday Freeze Warning:</strong> Operatives who finish at #4 (currently <strong>${escapeHtml(s1)}</strong>) & #5 (currently <strong>${escapeHtml(s2)}</strong>) at midnight will owe <strong>${escapeHtml(winner.display_name)}</strong> a Paneer Patties Party!`
                  }
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 font-mono text-[11px] px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold whitespace-nowrap self-start sm:self-auto">
              <span>${isCompleted ? '💸 Mandate on' : '⚠️ On Hot Seat:'} ${escapeHtml(s1)} & ${escapeHtml(s2)}</span>
            </div>
          </div>

          <!-- Standings Accordion -->
          <div class="mt-6">
            <div class="text-[11px] font-mono text-muted uppercase mb-2 font-semibold">
              ${escapeHtml(activeOrLatest.week_label)} Squad Standings ${!isCompleted ? '(Live)' : ''}:
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              ${activeOrLatest.rankings.map(r => `
                <div class="p-3.5 rounded-xl border ${r.rank === 1 ? 'border-amber-400/50 bg-amber-400/[0.04]' : r.party_duty ? 'border-orange-500/40 bg-orange-500/[0.03]' : 'border-border bg-surface'} flex flex-col justify-between">
                  <div class="flex items-center justify-between text-xs mb-1.5">
                    <span class="font-mono font-bold ${r.rank === 1 ? 'text-amber-400' : r.party_duty ? 'text-orange-400' : 'text-muted'}">
                      ${r.rank === 1 ? '👑 #1' : r.party_duty ? `🍔 #${r.rank}` : `#${r.rank}`}
                    </span>
                    <span class="font-mono font-bold text-primary">${r.points} pts</span>
                  </div>
                  <div class="font-bold text-sm text-primary truncate">${escapeHtml(r.display_name)}</div>
                  <div class="mt-2 text-[10px] font-mono ${r.rank === 1 ? 'text-amber-400 font-bold' : r.party_duty ? 'text-orange-400 font-bold animate-pulse' : 'text-muted'}">
                    ${r.rank === 1 ? 'Free Patties' : r.party_duty ? (isCompleted ? '💸 Sponsoring Party' : '⚠️ Hot Seat') : 'Safe'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      `;
    }

    // Historical Archive Cards
    const weeksToDisplay = pastWeeks;

    const archiveHtml = `
      <div class="theme-card p-6 border border-border">
        <div class="flex items-center justify-between pb-4 border-b border-border/70 mb-5">
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wider text-primary font-mono flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent inline-block"></span>
              Weekly Champions Archive
            </h3>
            <p class="text-[11px] text-muted mt-0.5">Historical records of weekly winners and party duty assignments.</p>
          </div>
          <span class="text-[10px] font-mono text-muted uppercase">Closed Loop: 5 Operatives</span>
        </div>

        <div class="space-y-4">
          ${weeksToDisplay.length === 0 ? `
            <div class="py-8 text-center text-muted font-mono text-xs bg-surface/30 rounded-xl border border-border/40">
              No previous weeks archived yet. The current week concludes and archives tonight after 12:00 AM (midnight IST).
            </div>
          ` : weeksToDisplay.map((w, idx) => `
            <div class="p-4 rounded-2xl bg-surface/60 border border-border/80 hover:border-accent/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center text-xl font-bold font-mono shrink-0">
                  ${idx === 0 ? '👑' : '🏆'}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h4 class="text-sm font-bold text-primary">${escapeHtml(w.week_label)}</h4>
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono ${w.is_completed ? 'bg-accent/10 text-accent' : 'bg-amber-400/15 text-amber-400'} font-semibold">
                      ${w.is_completed ? 'Concluded' : 'Active Cycle'}
                    </span>
                  </div>
                  <p class="text-xs text-body mt-1">
                    Champion: <strong class="text-amber-400 font-bold">${escapeHtml(w.winner?.display_name || 'Operative')}</strong> with <strong>${w.winner?.points || 0} pts</strong> (${w.winner?.tasks_completed || 0} tasks, ${w.winner?.hours_logged || 0}h logged)
                  </p>
                  <p class="text-[11px] font-mono text-orange-400 mt-0.5">
                    🍔 Party Duty: <strong>${escapeHtml(w.party_sponsors.join(' & ') || 'Rank 4 & 5')}</strong>
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2 self-end md:self-center">
                <button class="view-week-detail-btn px-3.5 py-2 rounded-xl border border-border hover:border-accent hover:text-accent text-xs font-mono text-primary transition-colors cursor-pointer" data-week-id="${w.week_id}">
                  🎉 Launch Debrief
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.innerHTML = `
      <div class="space-y-8">
        ${heroHtml}
        ${archiveHtml}
      </div>
    `;

    // Hook up view celebration button
    const celebrationBtn = document.getElementById('view-celebration-popup-btn');
    if (celebrationBtn && activeOrLatest) {
      celebrationBtn.onclick = () => openWeeklyWinnerModal(activeOrLatest);
    }

    // Hook up detail buttons in archive
    document.querySelectorAll('.view-week-detail-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const weekId = (e.currentTarget as HTMLElement).getAttribute('data-week-id');
        const found = weeksToDisplay.find(w => w.week_id === weekId);
        if (found) {
          openWeeklyWinnerModal(found);
        }
      });
    });

  } catch (err: any) {
    container.innerHTML = `
      <div class="theme-card p-8 text-center text-rose-500 font-mono text-xs">
        Failed to load weekly achievers: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

