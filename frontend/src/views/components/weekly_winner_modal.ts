import type { WeekSummary } from '../../api';
import { escapeHtml } from '../../utils';

export function renderWeeklyWinnerModal(): string {
  return `
    <div id="weekly-winner-modal" class="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4 transition-all duration-300">
      
      <!-- Celebratory Floating Confetti Background -->
      <div id="confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div class="confetti c1"></div>
        <div class="confetti c2"></div>
        <div class="confetti c3"></div>
        <div class="confetti c4"></div>
        <div class="confetti c5"></div>
        <div class="confetti c6"></div>
        <div class="confetti c7"></div>
        <div class="confetti c8"></div>
        <div class="confetti c9"></div>
        <div class="confetti c10"></div>
        <div class="confetti c11"></div>
        <div class="confetti c12"></div>
      </div>

      <div class="theme-card w-full max-w-xl relative z-10 animate-in fade-in zoom-in-95 duration-300 border-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.25)] bg-[#0d0d12] p-6 md:p-8 max-h-[90vh] overflow-y-auto">
        
        <button id="close-weekly-modal-btn" type="button" class="absolute top-4 right-4 text-muted hover:text-primary transition-colors text-2xl leading-none">&times;</button>

        <!-- Top Badge -->
        <div class="text-center mb-4">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest animate-pulse">
            <span>✨ NEW SPRINT CYCLE INITIATED ✨</span>
          </div>
          <h2 id="weekly-modal-week-title" class="text-xs text-muted font-mono uppercase mt-1">Week Concluded</h2>
        </div>

        <!-- Trophy & Winner Spotlight -->
        <div class="text-center relative py-2">
          <div class="inline-block relative">
            <div class="text-6xl md:text-7xl animate-bounce select-none">🏆</div>
            <div class="absolute -top-3 -right-2 text-2xl animate-spin" style="animation-duration: 4s;">✨</div>
          </div>

          <div class="mt-2">
            <span class="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">Weekly Champion</span>
            <h3 id="weekly-modal-winner-name" class="text-3xl md:text-4xl font-black text-amber-400 tracking-tight mt-0.5">
              --
            </h3>
            <p id="weekly-modal-winner-stats" class="text-sm font-mono text-body mt-1">
              -- pts • -- tasks • --h logged
            </p>
          </div>
        </div>

        <!-- The Paneer Patties Party Mandate Banner -->
        <div class="my-5 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/40 shadow-lg relative overflow-hidden">
          <div class="flex items-center gap-3">
            <div class="text-3xl select-none">🍔</div>
            <div class="flex-1">
              <h4 class="text-xs font-black uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1.5">
                <span>PANEER PATTIES PARTY MANDATE</span>
              </h4>
              <p id="weekly-modal-party-desc" class="text-xs text-body font-medium mt-1 leading-relaxed">
                By Glazing Sovereign Rule, Rank 4 & Rank 5 must sponsor a Paneer Patties Party for the champion!
              </p>
            </div>
          </div>
          
          <div id="weekly-modal-sponsors-badge" class="mt-3 pt-2.5 border-t border-orange-500/30 flex items-center justify-between text-xs font-mono">
            <span class="text-muted text-[11px]">Sponsors on Party Duty:</span>
            <span id="weekly-modal-sponsors-names" class="font-bold text-orange-300">--</span>
          </div>
        </div>

        <!-- Full Squad Standings Breakdown -->
        <div class="space-y-2 mb-6">
          <div class="flex items-center justify-between text-[11px] font-mono text-muted uppercase px-2 font-semibold">
            <span>Operative</span>
            <span>Status / Outcome</span>
          </div>
          <div id="weekly-modal-ranks-list" class="divide-y divide-border/40 rounded-xl bg-surface/50 border border-border overflow-hidden">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="weekly-modal-acknowledge-btn" type="button" class="btn-primary flex-1 py-3 text-sm font-bold shadow-md hover:shadow-amber-400/20">
            Acknowledge & Attack The New Week 🚀
          </button>
        </div>

      </div>
    </div>
  `;
}

let currentModalWeekId: string | null = null;

export function openWeeklyWinnerModal(week: WeekSummary) {
  const modal = document.getElementById('weekly-winner-modal');
  if (!modal) return;

  currentModalWeekId = week.week_id;

  const weekTitle = document.getElementById('weekly-modal-week-title');
  const winnerName = document.getElementById('weekly-modal-winner-name');
  const winnerStats = document.getElementById('weekly-modal-winner-stats');
  const partyDesc = document.getElementById('weekly-modal-party-desc');
  const sponsorsNames = document.getElementById('weekly-modal-sponsors-names');
  const ranksList = document.getElementById('weekly-modal-ranks-list');

  if (weekTitle) weekTitle.textContent = `${week.week_label}`;
  
  if (winnerName) {
    winnerName.textContent = week.winner?.display_name || 'Operative';
  }
  if (winnerStats) {
    winnerStats.textContent = `${week.winner?.points || 0} pts • ${week.winner?.tasks_completed || 0} tasks • ${week.winner?.hours_logged || 0}h logged`;
  }

  const s1 = week.party_sponsors[0] || 'Rank 4';
  const s2 = week.party_sponsors[1] || 'Rank 5';
  const champ = week.winner?.display_name || 'the Champion';

  if (partyDesc) {
    partyDesc.innerHTML = `By decree of the Glazing Sovereign Code, <strong>#4 ${escapeHtml(s1)}</strong> and <strong>#5 ${escapeHtml(s2)}</strong> MUST sponsor a celebratory <strong>Paneer Patties Party</strong> for <strong>${escapeHtml(champ)}</strong>!`;
  }

  if (sponsorsNames) {
    sponsorsNames.textContent = `${s1} & ${s2} (Party Duty)`;
  }

  if (ranksList) {
    ranksList.innerHTML = week.rankings.map(r => {
      let icon = '🥈';
      let tagBg = 'bg-surface text-muted border-border';
      let rowBg = '';

      if (r.rank === 1) {
        icon = '👑 #1';
        tagBg = 'bg-amber-400/20 text-amber-400 border-amber-400/40 font-bold';
        rowBg = 'bg-amber-400/[0.04]';
      } else if (r.rank === 2) {
        icon = '🥈 #2';
        tagBg = 'bg-slate-400/15 text-slate-300 border-slate-400/30';
      } else if (r.rank === 3) {
        icon = '🥉 #3';
        tagBg = 'bg-amber-700/15 text-amber-600 border-amber-700/30';
      } else if (r.party_duty) {
        icon = `🍔 #${r.rank}`;
        tagBg = 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold animate-pulse';
        rowBg = 'bg-orange-500/[0.03]';
      }

      return `
        <div class="flex items-center justify-between p-3 text-xs ${rowBg}">
          <div class="flex items-center gap-2.5">
            <span class="font-mono font-bold ${r.rank === 1 ? 'text-amber-400' : r.party_duty ? 'text-orange-400' : 'text-muted'}">${icon}</span>
            <span class="font-bold text-primary">${escapeHtml(r.display_name)}</span>
            ${r.is_me ? '<span class="text-[10px] text-accent font-mono font-bold">(You)</span>' : ''}
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-primary">${r.points} pts</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono border ${tagBg}">
              ${r.rank === 1 ? 'Free Patties' : r.party_duty ? '💸 Patties Sponsor' : 'Safe'}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  modal.classList.remove('hidden');
}

export function setupWeeklyWinnerModalLogic() {
  const modal = document.getElementById('weekly-winner-modal');
  const closeBtn = document.getElementById('close-weekly-modal-btn');
  const ackBtn = document.getElementById('weekly-modal-acknowledge-btn');

  const closeModal = () => {
    if (modal) modal.classList.add('hidden');
    if (currentModalWeekId) {
      localStorage.setItem(`glazing_seen_week_winner_${currentModalWeekId}`, 'true');
    }
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (ackBtn) ackBtn.onclick = closeModal;

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }
}
