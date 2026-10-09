import type { WeekSummary } from '../../api';
import { resolveWeeklyParty } from '../../api';
import { showNotification } from './navbar';
import { escapeHtml } from '../../utils';

export function renderWeeklyWinnerModal(): string {
  return `
    <div id="weekly-winner-modal" class="winner-modal-backdrop fixed inset-0 bg-black/80 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4">
      
      <div class="winner-modal-surface theme-card w-full max-w-xl relative z-10 border border-amber-500/30 bg-[#0e0e12] p-6 md:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
        
        <button id="close-weekly-modal-btn" type="button" aria-label="Close weekly champion debrief" class="btn-tactile absolute top-4 right-4 text-muted hover:text-primary transition-colors text-xl leading-none w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface cursor-pointer">&times;</button>

        <!-- Top Badge -->
        <div class="winner-stagger-1 text-center mb-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span id="weekly-modal-badge-text">Sprint Cycle Concluded</span>
          </div>
          <h2 id="weekly-modal-week-title" class="text-xs text-muted font-mono uppercase mt-1">Week Concluded</h2>
        </div>

        <!-- Trophy & Winner Spotlight -->
        <div class="winner-stagger-2 text-center relative py-2">
          <div class="relative inline-flex items-center justify-center mb-2">
            <!-- Ambient 1-shot radiant aura -->
            <div class="crest-aura absolute inset-0 -m-6 rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-500/10 to-transparent blur-xl pointer-events-none"></div>

            <!-- 1-shot particle burst emitters (radiating in 8 directions, non-looping) -->
            <div class="particle-burst" style="--tx: 32px; --ty: -32px; background: #fbbf24;"></div>
            <div class="particle-burst" style="--tx: -32px; --ty: -32px; background: #f59e0b;"></div>
            <div class="particle-burst" style="--tx: 40px; --ty: 0px; background: #fbbf24;"></div>
            <div class="particle-burst" style="--tx: -40px; --ty: 0px; background: #f59e0b;"></div>
            <div class="particle-burst" style="--tx: 28px; --ty: 36px; background: #d97706;"></div>
            <div class="particle-burst" style="--tx: -28px; --ty: 36px; background: #fbbf24;"></div>
            <div class="particle-burst" style="--tx: 0px; --ty: -42px; background: #fef3c7;"></div>
            <div class="particle-burst" style="--tx: 0px; --ty: 42px; background: #f59e0b;"></div>

            <!-- Authored High-Craft Vector Champion Crest -->
            <div class="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-b from-amber-400/20 to-amber-500/5 border border-amber-400/40 flex items-center justify-center shadow-lg">
              <svg class="w-10 h-10 md:w-12 md:h-12 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="rgba(245, 158, 11, 0.15)"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7v5l3 3" opacity="0.6"/>
              </svg>
            </div>
          </div>

          <div>
            <span id="weekly-modal-winner-subtitle" class="text-[11px] font-mono uppercase tracking-wider text-muted font-semibold">Weekly Champion</span>
            <h3 id="weekly-modal-winner-name" class="text-3xl md:text-4xl font-extrabold text-primary tracking-tight mt-0.5">
              --
            </h3>
            <p id="weekly-modal-winner-stats" class="text-xs font-mono text-muted mt-1">
              -- pts • -- tasks • --h logged
            </p>
          </div>
        </div>

        <!-- The Paneer Patties Party Mandate Banner -->
        <div id="weekly-modal-mandate-card" class="winner-stagger-3 my-5 p-4 rounded-xl bg-surface border border-orange-500/30 shadow-sm relative overflow-hidden transition-all duration-300">
          <div class="flex items-center gap-3.5">
            <div id="weekly-modal-mandate-icon-box" class="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h4 id="weekly-modal-mandate-title" class="text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
                  Paneer Patties Party Mandate
                </h4>
                <span id="weekly-modal-mandate-badge" class="hidden text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"></span>
              </div>
              <p id="weekly-modal-party-desc" class="text-xs text-body mt-1 leading-relaxed">
                By Glazing Sovereign Rule, Rank 4 & Rank 5 must sponsor a Paneer Patties Party for the champion!
              </p>
            </div>
          </div>
          
          <div id="weekly-modal-sponsors-badge" class="mt-3 pt-2.5 border-t border-border/80 flex items-center justify-between text-xs font-mono">
            <span id="weekly-modal-sponsors-label" class="text-muted text-[11px]">Sponsors on Party Duty:</span>
            <span id="weekly-modal-sponsors-names" class="font-bold text-orange-300">--</span>
          </div>

          <!-- Winner Action Box: I Got the Party! -->
          <div id="weekly-modal-winner-action-box" class="hidden mt-3 pt-3 border-t border-border/80 flex items-center justify-between gap-3">
            <div class="text-[11px] font-mono text-muted">
              Received your feast from the sponsors?
            </div>
            <button id="weekly-modal-claim-party-btn" type="button" class="btn-tactile px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold shadow-sm border border-emerald-400/40 cursor-pointer flex items-center gap-1.5 min-h-[36px]">
              <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>I Got the Party!</span>
            </button>
          </div>
        </div>

        <!-- Full Squad Standings Breakdown -->
        <div class="winner-stagger-4 space-y-2 mb-6">
          <div class="flex items-center justify-between text-[11px] font-mono text-muted uppercase px-2 font-semibold">
            <span>Operative Standing</span>
            <span>Points // Outcome</span>
          </div>
          <div id="weekly-modal-ranks-list" class="divide-y divide-border/60 rounded-xl bg-surface/50 border border-border overflow-hidden">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex flex-col sm:flex-row gap-3">
          <button id="weekly-modal-acknowledge-btn" type="button" class="btn-primary btn-tactile flex-1 py-3 text-xs font-bold font-mono tracking-wider uppercase cursor-pointer min-h-[44px]">
            Acknowledge & Close
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
  const mandateIconBox = document.getElementById('weekly-modal-mandate-icon-box');
  const mandateTitle = document.getElementById('weekly-modal-mandate-title');
  const mandateBadge = document.getElementById('weekly-modal-mandate-badge');
  const winnerActionBox = document.getElementById('weekly-modal-winner-action-box');
  const claimPartyBtn = document.getElementById('weekly-modal-claim-party-btn');

  const isResolved = Boolean(week.party_resolved);

  if (week.is_completed) {
    if (badgeText) {
      badgeText.textContent = isResolved ? 'Sprint Concluded • Mandate Fulfilled' : 'Sprint Cycle Concluded';
    }
    if (winnerSubtitle) winnerSubtitle.textContent = 'Reigning Weekly Champion';
    if (ackBtn) ackBtn.textContent = 'Acknowledge & Return To Feed';
  } else {
    if (badgeText) badgeText.textContent = 'Live Standings • Midnight Freeze';
    if (winnerSubtitle) winnerSubtitle.textContent = 'Current Sprint Leader';
    if (ackBtn) ackBtn.textContent = 'Understood — Back To Mission';
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
      mandateCard.className = 'winner-stagger-3 my-5 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/40 shadow-sm relative overflow-hidden transition-all duration-300';
    }
    if (mandateIconBox) {
      mandateIconBox.className = 'w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0';
      mandateIconBox.innerHTML = `
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      `;
    }
    if (mandateTitle) {
      mandateTitle.textContent = 'PANEER PATTIES PARTY MANDATE // FULFILLED';
      mandateTitle.className = 'text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono';
    }
    if (mandateBadge) {
      mandateBadge.classList.remove('hidden');
      mandateBadge.textContent = 'Archived & Honored';
      mandateBadge.className = 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    if (partyDesc) {
      partyDesc.innerHTML = `Champion <strong>${escapeHtml(champ)}</strong> confirmed receiving the celebratory Paneer Patties feast from <strong>${escapeHtml(s1)} & ${escapeHtml(s2)}</strong>! The sovereign mandate was honored in full.`;
    }
    if (sponsorsLabel) sponsorsLabel.textContent = 'Fulfilled by Sponsors:';
    if (sponsorsNames) {
      sponsorsNames.textContent = `${s1} & ${s2} (Delivered)`;
      sponsorsNames.className = 'font-bold text-emerald-300';
    }
    if (winnerActionBox) winnerActionBox.classList.add('hidden');

  } else {
    // Mandate is pending delivery or live
    if (mandateCard) {
      mandateCard.className = 'winner-stagger-3 my-5 p-4 rounded-xl bg-orange-500/[0.04] border border-orange-500/30 shadow-sm relative overflow-hidden transition-all duration-300';
    }
    if (mandateIconBox) {
      mandateIconBox.className = 'w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center flex-shrink-0';
      mandateIconBox.innerHTML = `
        <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>
        </svg>
      `;
    }
    if (mandateTitle) {
      mandateTitle.textContent = 'PANEER PATTIES PARTY MANDATE';
      mandateTitle.className = 'text-xs font-bold uppercase tracking-wider text-orange-400 font-mono';
    }
    if (mandateBadge) {
      mandateBadge.classList.remove('hidden');
      mandateBadge.textContent = week.is_completed ? 'Pending Delivery' : 'Live Hot Seat';
      mandateBadge.className = week.is_completed 
        ? 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40'
        : 'text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40';
    }
    if (partyDesc) {
      if (week.is_completed) {
        partyDesc.innerHTML = `By decree of the Glazing Sovereign Code, <strong>#4 ${escapeHtml(s1)}</strong> and <strong>#5 ${escapeHtml(s2)}</strong> must sponsor a celebratory <strong>Paneer Patties Party</strong> for <strong>${escapeHtml(champ)}</strong>.`;
      } else {
        partyDesc.innerHTML = `<strong>Sprint Finale Live:</strong> Standings freeze tonight at <strong>12:00 AM (midnight IST)</strong>! Operatives finishing at #4 and #5 (currently <strong>${escapeHtml(s1)}</strong> & <strong>${escapeHtml(s2)}</strong>) will owe <strong>${escapeHtml(champ)}</strong> a Paneer Patties Party.`;
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
      claimPartyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
        <span>I Got the Party!</span>
      `;

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
          showNotification('Mandate fulfilled! Paneer Patties Party marked as received.', 'success');

          // Re-render modal to reflect fulfilled state
          openWeeklyWinnerModal(week);

          // Dispatch event so other components (dashboard banner, leaderboard) react instantly
          window.dispatchEvent(new CustomEvent('weekly-party-resolved', { detail: { week_id: week.week_id } }));
        } catch (err: any) {
          claimPartyBtn.removeAttribute('disabled');
          claimPartyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <span>I Got the Party!</span>
          `;
          showNotification(err.message || 'Failed to resolve party mandate', 'error');
        }
      };
    } else if (winnerActionBox) {
      winnerActionBox.classList.add('hidden');
    }
  }

  if (ranksList) {
    ranksList.innerHTML = week.rankings.map(r => {
      let badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">#${r.rank}</span>`;
      let tagBg = 'bg-surface text-muted border-border';
      let rowBg = '';

      if (r.rank === 1) {
        badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-400 border border-amber-400/40">#1</span>`;
        tagBg = 'bg-amber-400/15 text-amber-300 border-amber-400/40 font-bold';
        rowBg = 'bg-amber-400/[0.03]';
      } else if (r.rank === 2) {
        badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-400/15 text-slate-300 border border-slate-400/30">#2</span>`;
        tagBg = 'bg-slate-400/10 text-slate-300 border-slate-400/20';
      } else if (r.rank === 3) {
        badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-700/15 text-amber-500 border border-amber-700/30">#3</span>`;
        tagBg = 'bg-amber-700/10 text-amber-500 border-amber-700/20';
      } else if (r.party_duty) {
        if (isResolved) {
          badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">#${r.rank}</span>`;
          tagBg = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-semibold';
          rowBg = 'bg-emerald-500/[0.02]';
        } else {
          badgeMarkup = `<span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">#${r.rank}</span>`;
          tagBg = 'bg-orange-500/15 text-orange-300 border-orange-500/30 font-semibold';
          rowBg = 'bg-orange-500/[0.03]';
        }
      }

      const dutyLabel = r.rank === 1 
        ? (isResolved ? 'Party Enjoyed' : 'Free Feast Award') 
        : r.party_duty 
          ? (isResolved ? 'Duty Delivered' : 'Party Sponsor Duty') 
          : 'Safe';

      return `
        <div class="flex items-center justify-between p-3 text-xs ${rowBg}">
          <div class="flex items-center gap-2.5">
            ${badgeMarkup}
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
