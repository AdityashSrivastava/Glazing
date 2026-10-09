import type { WeekSummary } from '../../api';
import { resolveWeeklyParty } from '../../api';
import { showNotification } from './navbar';
import { escapeHtml } from '../../utils';

export function renderWeeklyWinnerModal(): string {
  return `
    <div id="weekly-winner-modal" class="winner-modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4">
      
      <!-- Celebratory Organic 3D Floating Confetti -->
      <div id="confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div class="confetti-piece cp1"></div>
        <div class="confetti-piece cp2"></div>
        <div class="confetti-piece cp3"></div>
        <div class="confetti-piece cp4"></div>
        <div class="confetti-piece cp5"></div>
        <div class="confetti-piece cp6"></div>
        <div class="confetti-piece cp7"></div>
        <div class="confetti-piece cp8"></div>
        <div class="confetti-piece cp9"></div>
        <div class="confetti-piece cp10"></div>
        <div class="confetti-piece cp11"></div>
        <div class="confetti-piece cp12"></div>
        <div class="confetti-piece cp13"></div>
        <div class="confetti-piece cp14"></div>
        <div class="confetti-piece cp15"></div>
      </div>

      <div class="winner-modal-surface theme-card w-full max-w-xl relative z-10 border border-amber-400/50 shadow-[0_0_50px_rgba(251,191,36,0.25)] bg-[#0d0d12] p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        <button id="close-weekly-modal-btn" type="button" aria-label="Close weekly celebration" class="btn-tactile absolute top-4 right-4 text-muted hover:text-primary transition-colors text-2xl leading-none w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface cursor-pointer">&times;</button>

        <!-- Top Celebratory Badge -->
        <div class="text-center mb-4">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
            <span class="animate-spin" style="animation-duration: 3s;">✨</span>
            <span id="weekly-modal-badge-text">✨ NEW SPRINT CYCLE INITIATED ✨</span>
            <span class="animate-spin" style="animation-duration: 3s;">✨</span>
          </div>
          <h2 id="weekly-modal-week-title" class="text-xs text-muted font-mono uppercase mt-1">Week Concluded</h2>
        </div>

        <!-- Trophy & Winner Spotlight with Organic Celebration Physics -->
        <div class="text-center relative py-2">
          <!-- Ambient glowing radial aura -->
          <div class="trophy-ambient-glow"></div>

          <div class="inline-block relative">
            <div class="text-6xl md:text-7xl select-none trophy-bounce-craft">🏆</div>
            <div class="star-sparkle star-1">✨</div>
            <div class="star-sparkle star-2">⭐</div>
            <div class="star-sparkle star-3">✨</div>
          </div>

          <div class="mt-2">
            <span id="weekly-modal-winner-subtitle" class="text-[11px] font-mono uppercase tracking-wider text-amber-400/80 font-bold">👑 Reigning Weekly Champion</span>
            <h3 id="weekly-modal-winner-name" class="text-3xl md:text-4xl font-black text-amber-400 tracking-tight mt-0.5 filter drop-shadow">
              --
            </h3>
            <p id="weekly-modal-winner-stats" class="text-sm font-mono text-body mt-1">
              -- pts • -- tasks • --h logged
            </p>
          </div>
        </div>

        <!-- The Paneer Patties Party Mandate Banner -->
        <div id="weekly-modal-mandate-card" class="my-5 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/40 shadow-lg relative overflow-hidden transition-all duration-300">
          <div class="flex items-center gap-3">
            <div id="weekly-modal-mandate-icon" class="text-3xl select-none filter drop-shadow">🍔</div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h4 id="weekly-modal-mandate-title" class="text-xs font-black uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1.5">
                  <span>PANEER PATTIES PARTY MANDATE</span>
                </h4>
                <span id="weekly-modal-mandate-badge" class="hidden text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"></span>
              </div>
              <p id="weekly-modal-party-desc" class="text-xs text-body font-medium mt-1 leading-relaxed">
                By Glazing Sovereign Rule, Rank 4 & Rank 5 must sponsor a Paneer Patties Party for the champion!
              </p>
            </div>
          </div>
          
          <div id="weekly-modal-sponsors-badge" class="mt-3 pt-2.5 border-t border-orange-500/30 flex items-center justify-between text-xs font-mono">
            <span id="weekly-modal-sponsors-label" class="text-muted text-[11px]">Sponsors on Party Duty:</span>
            <span id="weekly-modal-sponsors-names" class="font-bold text-orange-300">--</span>
          </div>

          <!-- Winner Action Box: I Got the Party! -->
          <div id="weekly-modal-winner-action-box" class="hidden mt-3 pt-3 border-t border-orange-500/30 flex items-center justify-between gap-3">
            <div class="text-[11px] font-mono text-muted">
              Received your party feast from the sponsors?
            </div>
            <button id="weekly-modal-claim-party-btn" type="button" class="btn-tactile px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-md shadow-emerald-500/20 border border-emerald-400 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
              <span>🍔</span>
              <span>I Got the Party!</span>
            </button>
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
          <button id="weekly-modal-acknowledge-btn" type="button" class="btn-primary btn-tactile flex-1 py-3 text-sm font-bold shadow-md hover:shadow-amber-400/20 cursor-pointer flex items-center justify-center gap-2">
            <span>Acknowledge & Attack The New Week 🚀</span>
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
  const sponsorsLabel = document.getElementById('weekly-modal-sponsors-label');
  const ranksList = document.getElementById('weekly-modal-ranks-list');

  const badgeText = document.getElementById('weekly-modal-badge-text');
  const winnerSubtitle = document.getElementById('weekly-modal-winner-subtitle');
  const ackBtn = document.getElementById('weekly-modal-acknowledge-btn');

  const mandateCard = document.getElementById('weekly-modal-mandate-card');
  const mandateIcon = document.getElementById('weekly-modal-mandate-icon');
  const mandateTitle = document.getElementById('weekly-modal-mandate-title');
  const mandateBadge = document.getElementById('weekly-modal-mandate-badge');
  const winnerActionBox = document.getElementById('weekly-modal-winner-action-box');
  const claimPartyBtn = document.getElementById('weekly-modal-claim-party-btn');

  const isResolved = Boolean(week.party_resolved);

  if (week.is_completed) {
    if (badgeText) {
      badgeText.textContent = isResolved ? '✨ SPRINT CONCLUDED • PARTY FULFILLED ✨' : '✨ NEW SPRINT CYCLE INITIATED ✨';
    }
    if (winnerSubtitle) winnerSubtitle.textContent = '👑 Reigning Weekly Champion';
    if (ackBtn) {
      ackBtn.innerHTML = '<span>Acknowledge & Attack The New Week 🚀</span>';
    }
  } else {
    if (badgeText) badgeText.textContent = '⏳ LIVE SPRINT PROJECTION (FREEZES AT MIDNIGHT)';
    if (winnerSubtitle) winnerSubtitle.textContent = '⚡ Current Sprint Leader';
    if (ackBtn) {
      ackBtn.innerHTML = '<span>Got It — Back To The Grind ⚔️</span>';
    }
  }

  if (weekTitle) {
    weekTitle.textContent = week.is_completed 
      ? `${week.week_label} • Concluded` 
      : `${week.week_label} • In Progress (Freezes at 12:00 AM)`;
  }
  
  if (winnerName) {
    winnerName.textContent = week.winner?.display_name || 'Operative';
  }
  if (winnerStats) {
    winnerStats.textContent = `${week.winner?.points || 0} pts • ${week.winner?.tasks_completed || 0} tasks • ${week.winner?.hours_logged || 0}h logged`;
  }

  const s1 = week.party_sponsors[0] || 'Rank 4';
  const s2 = week.party_sponsors[1] || 'Rank 5';
  const champ = week.winner?.display_name || 'the Champion';

  if (isResolved) {
    // Mandate is officially fulfilled!
    if (mandateCard) {
      mandateCard.className = 'my-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/40 shadow-lg relative overflow-hidden transition-all duration-300';
    }
    if (mandateIcon) mandateIcon.textContent = '✅';
    if (mandateTitle) {
      mandateTitle.textContent = 'PANEER PATTIES PARTY MANDATE FULFILLED';
      mandateTitle.className = 'text-xs font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5';
    }
    if (mandateBadge) {
      mandateBadge.classList.remove('hidden');
      mandateBadge.textContent = 'Fulfilled & Archived';
      mandateBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    if (partyDesc) {
      partyDesc.innerHTML = `Champion <strong>${escapeHtml(champ)}</strong> confirmed receiving the celebratory Paneer Patties Party from <strong>${escapeHtml(s1)} & ${escapeHtml(s2)}</strong>! The sovereign mandate was honored in full. 🎉`;
    }
    if (sponsorsLabel) sponsorsLabel.textContent = 'Fulfilled by Sponsors:';
    if (sponsorsNames) {
      sponsorsNames.textContent = `${s1} & ${s2} (Delivered 🍔)`;
      sponsorsNames.className = 'font-bold text-emerald-300';
    }
    if (winnerActionBox) winnerActionBox.classList.add('hidden');

  } else {
    // Mandate is pending delivery or live
    if (mandateCard) {
      mandateCard.className = 'my-5 p-4 rounded-2xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-orange-500/15 border border-orange-500/40 shadow-lg relative overflow-hidden transition-all duration-300';
    }
    if (mandateIcon) mandateIcon.textContent = '🍔';
    if (mandateTitle) {
      mandateTitle.textContent = 'PANEER PATTIES PARTY MANDATE';
      mandateTitle.className = 'text-xs font-black uppercase tracking-wider text-orange-400 font-mono flex items-center gap-1.5';
    }
    if (mandateBadge) {
      mandateBadge.classList.remove('hidden');
      mandateBadge.textContent = week.is_completed ? 'Pending Delivery' : 'Live Hot Seat';
      mandateBadge.className = week.is_completed 
        ? 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse'
        : 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40';
    }
    if (partyDesc) {
      if (week.is_completed) {
        partyDesc.innerHTML = `By decree of the Glazing Sovereign Code, <strong>#4 ${escapeHtml(s1)}</strong> and <strong>#5 ${escapeHtml(s2)}</strong> MUST sponsor a celebratory <strong>Paneer Patties Party</strong> for <strong>${escapeHtml(champ)}</strong>!`;
      } else {
        partyDesc.innerHTML = `<strong>Sprint Finale Live:</strong> Standings freeze tonight at <strong>12:00 AM (midnight IST)</strong>! Operatives finishing at #4 and #5 (currently <strong>${escapeHtml(s1)}</strong> & <strong>${escapeHtml(s2)}</strong>) will owe <strong>${escapeHtml(champ)}</strong> a Paneer Patties Party!`;
      }
    }
    if (sponsorsLabel) sponsorsLabel.textContent = week.is_completed ? 'Sponsors on Party Duty:' : 'Currently on Hot Seat:';
    if (sponsorsNames) {
      sponsorsNames.textContent = week.is_completed 
        ? `${s1} & ${s2} (Party Duty Mandate)`
        : `${s1} & ${s2} (Currently on Hot Seat)`;
      sponsorsNames.className = 'font-bold text-orange-300';
    }

    // Check if the viewer is the champion (only the winner can confirm receipt!)
    const canResolve = Boolean(week.is_completed && week.winner?.is_me);

    if (canResolve && winnerActionBox && claimPartyBtn) {
      winnerActionBox.classList.remove('hidden');
      claimPartyBtn.removeAttribute('disabled');
      claimPartyBtn.innerHTML = '<span>🍔</span><span>I Got the Party!</span>';

      claimPartyBtn.onclick = async () => {
        const confirmed = window.confirm(`Confirm that you received your Paneer Patties Party from ${s1} & ${s2}?\n\nThis will fulfill the mandate across the squad and archive it.`);
        if (!confirmed) return;

        claimPartyBtn.setAttribute('disabled', 'true');
        claimPartyBtn.innerHTML = `
          <svg class="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          <span>Confirming...</span>
        `;

        try {
          await resolveWeeklyParty(week.week_id);
          week.party_resolved = true;
          week.party_resolved_by = champ;
          showNotification('🎉 Mandate fulfilled! Paneer Patties Party marked as received.', 'success');

          // Re-render modal to reflect fulfilled state
          openWeeklyWinnerModal(week);

          // Dispatch event so other components (dashboard banner, leaderboard) react instantly
          window.dispatchEvent(new CustomEvent('weekly-party-resolved', { detail: { week_id: week.week_id } }));
        } catch (err: any) {
          claimPartyBtn.removeAttribute('disabled');
          claimPartyBtn.innerHTML = '<span>🍔</span><span>I Got the Party!</span>';
          showNotification(err.message || 'Failed to resolve party mandate', 'error');
        }
      };
    } else if (winnerActionBox) {
      winnerActionBox.classList.add('hidden');
    }
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
        if (isResolved) {
          icon = `✅ #${r.rank}`;
          tagBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
          rowBg = 'bg-emerald-500/[0.03]';
        } else {
          icon = `🍔 #${r.rank}`;
          tagBg = 'bg-orange-500/20 text-orange-400 border-orange-500/40 font-bold animate-pulse';
          rowBg = 'bg-orange-500/[0.03]';
        }
      }

      const dutyLabel = r.rank === 1 
        ? (isResolved ? 'Party Enjoyed 🍔' : 'Free Patties') 
        : r.party_duty 
          ? (isResolved ? 'Party Delivered ✅' : '💸 Patties Sponsor') 
          : 'Safe';

      return `
        <div class="flex items-center justify-between p-3 text-xs ${rowBg}">
          <div class="flex items-center gap-2.5">
            <span class="font-mono font-bold ${r.rank === 1 ? 'text-amber-400' : (r.party_duty && isResolved) ? 'text-emerald-400' : r.party_duty ? 'text-orange-400' : 'text-muted'}">${icon}</span>
            <span class="font-bold text-primary">${escapeHtml(r.display_name)}</span>
            ${r.is_me ? '<span class="text-[10px] text-accent font-mono font-bold">(You)</span>' : ''}
          </div>
          <div class="flex items-center gap-3">
            <span class="font-mono font-bold text-primary">${r.points} pts</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-mono border ${tagBg}">
              ${dutyLabel}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Smooth physics-based opening via requestAnimationFrame
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.setAttribute('data-state', 'open');
  });
}

export function setupWeeklyWinnerModalLogic() {
  const modal = document.getElementById('weekly-winner-modal');
  const closeBtn = document.getElementById('close-weekly-modal-btn');
  const ackBtn = document.getElementById('weekly-modal-acknowledge-btn');

  let isClosing = false;
  const closeModal = () => {
    if (!modal || isClosing || modal.classList.contains('hidden')) return;
    isClosing = true;
    modal.setAttribute('data-state', 'closing');

    if (currentModalWeekId) {
      localStorage.setItem(`glazing_seen_week_winner_${currentModalWeekId}`, 'true');
    }

    // 160ms exit timing matching motion-craft cubic-bezier(0.4, 0, 1, 1)
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.removeAttribute('data-state');
      isClosing = false;
    }, 160);
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (ackBtn) ackBtn.onclick = closeModal;

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  // Accessible Escape keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}
