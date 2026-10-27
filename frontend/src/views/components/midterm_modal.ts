/**
 * Midterm Academic Recess & Operations Freeze Modal
 * Suspends Glazing operations, task validation, and daily scoring until November 6, 2026.
 */

// Target Re-activation: November 6, 2026, 00:00:00 IST (UTC+5:30)
export const MIDTERM_RESUME_DATE = new Date('2026-11-06T00:00:00+05:30');

export function isMidtermFreezeActive(): boolean {
  return Date.now() < MIDTERM_RESUME_DATE.getTime();
}

export function getMidtermRemaining() {
  const total = Math.max(0, MIDTERM_RESUME_DATE.getTime() - Date.now());
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export function renderMidtermBanner(): string {
  if (!isMidtermFreezeActive()) return '';

  return `
    <!-- Sticky Persistent Midterm Recess Alert Banner -->
    <div id="midterm-sticky-banner" class="w-full bg-gradient-to-r from-amber-950/95 via-black to-amber-950/95 border-b border-amber-500/40 px-3 md:px-4 py-2 z-40 sticky top-0 backdrop-blur-xl shadow-lg shadow-black/60">
      <div class="max-w-[1340px] mx-auto w-full flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div class="flex items-center gap-2 text-amber-400">
          <span class="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0"></span>
          <span class="inline-flex items-center gap-1.5 font-bold tracking-wider uppercase text-[11px] sm:text-xs">
            <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Academic Standby Active:
          </span>
          <span class="text-zinc-300 hidden sm:inline">Operations & scoring paused for Midterms until 06 Nov 2026</span>
          <span class="text-zinc-300 sm:hidden">Operations paused for Midterms</span>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 text-[11px]">
            <span class="hidden sm:inline">Resumes in:</span>
            <span id="midterm-banner-countdown" class="tracking-wider">--d --h --m --s</span>
          </div>
          <button id="midterm-reopen-btn" type="button" class="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[11px] font-bold transition-all cursor-pointer">
            View Protocol
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderMidtermModal(): string {
  if (!isMidtermFreezeActive()) return '';

  return `
    <!-- Midterm Operations Freeze Modal Overlay -->
    <div id="midterm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="midterm-modal-title" class="winner-modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-md z-[110] hidden flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      
      <div class="winner-modal-surface theme-card w-full max-w-[490px] my-auto relative z-10 border border-amber-500/35 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-[#0c0d10] p-5 sm:p-6 rounded-2xl text-center overflow-hidden">
        
        <!-- Accessible Close Button -->
        <button id="close-midterm-modal-btn" type="button" aria-label="Close midterm alert" class="btn-tactile absolute top-3.5 right-3.5 text-zinc-400 hover:text-white transition-colors w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 cursor-pointer">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Top Tactical Directive Badge -->
        <div class="text-center mb-2.5">
          <div class="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-widest shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
            <span>ACADEMIC STANDBY // MIDTERMS ACTIVE</span>
          </div>
        </div>

        <!-- Academic Tactical Emblem with Ambient Energy Glow -->
        <div class="text-center relative py-1">
          <div class="midterm-ambient-glow"></div>
          <div class="relative w-12 h-12 mx-auto mb-2 flex items-center justify-center">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-amber-950/30 border border-amber-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] midterm-icon-craft">
              <svg class="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path>
                <path d="M6 6h10"></path>
                <path d="M6 10h10"></path>
                <path d="M6 14h6"></path>
                <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" fill-opacity="0.4"></circle>
              </svg>
            </div>
          </div>

          <div>
            <h3 id="midterm-modal-title" class="text-lg sm:text-xl font-black text-white font-mono tracking-tight uppercase">
              Operations Suspended: Midterm Campaign
            </h3>
            <p class="text-xs text-zinc-300 mt-1.5 leading-relaxed max-w-sm mx-auto">
              Midterms are approaching! To prevent distractions and study pressure, <strong class="text-amber-400">Glazing has stopped validating any action whatsoever until 6 November 2026</strong>.
            </p>
          </div>
        </div>

        <!-- Digital Mission Clock Countdown Box -->
        <div class="my-3 p-3 rounded-xl bg-gradient-to-b from-amber-500/10 via-black/80 to-amber-950/20 border border-amber-500/30 shadow-inner">
          <div class="flex items-center justify-between text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-2 px-0.5">
            <span class="flex items-center gap-1">
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Operations & Scoring Resume In:
            </span>
            <span class="text-zinc-400 font-mono text-[9px]">Target: 06 Nov 2026</span>
          </div>

          <div class="grid grid-cols-4 gap-1.5 text-center">
            <div class="p-2 rounded-lg bg-black/85 border border-amber-500/25 flex flex-col items-center">
              <span id="midterm-cd-days" class="text-xl sm:text-2xl font-black font-mono text-amber-300 tabular-nums leading-tight">--</span>
              <span class="text-[9px] font-mono text-amber-400/70 font-bold uppercase tracking-wider mt-0.5">DAYS</span>
            </div>
            <div class="p-2 rounded-lg bg-black/85 border border-amber-500/25 flex flex-col items-center">
              <span id="midterm-cd-hours" class="text-xl sm:text-2xl font-black font-mono text-amber-300 tabular-nums leading-tight">--</span>
              <span class="text-[9px] font-mono text-amber-400/70 font-bold uppercase tracking-wider mt-0.5">HOURS</span>
            </div>
            <div class="p-2 rounded-lg bg-black/85 border border-amber-500/25 flex flex-col items-center">
              <span id="midterm-cd-mins" class="text-xl sm:text-2xl font-black font-mono text-amber-300 tabular-nums leading-tight">--</span>
              <span class="text-[9px] font-mono text-amber-400/70 font-bold uppercase tracking-wider mt-0.5">MINS</span>
            </div>
            <div class="p-2 rounded-lg bg-black/85 border border-amber-500/25 flex flex-col items-center">
              <span id="midterm-cd-secs" class="text-xl sm:text-2xl font-black font-mono text-amber-400 tabular-nums leading-tight animate-pulse">--</span>
              <span class="text-[9px] font-mono text-amber-400/70 font-bold uppercase tracking-wider mt-0.5">SECS</span>
            </div>
          </div>

          <div class="mt-1.5 text-center text-[10px] font-mono text-zinc-400">
            Re-activation Moment: <span class="text-amber-300 font-semibold">06 November 2026 • 00:00:00 IST</span>
          </div>
        </div>

        <!-- 4-Point Tactical State Matrix -->
        <div class="my-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-left">
          <div class="p-2 rounded-lg bg-zinc-900/60 border border-amber-500/20 flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <div>
              <div class="text-[11px] font-mono font-bold text-amber-300">Streaks & Vaults: FROZEN</div>
              <div class="text-[10px] text-zinc-400 leading-tight">Zero point decay, zero streak drops.</div>
            </div>
          </div>

          <div class="p-2 rounded-lg bg-zinc-900/60 border border-amber-500/20 flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="6" y="4" width="4" height="16" rx="1"/>
              <rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
            <div>
              <div class="text-[11px] font-mono font-bold text-amber-300">Task Logging: PAUSED</div>
              <div class="text-[10px] text-zinc-400 leading-tight">Validation & point credits suspended.</div>
            </div>
          </div>

          <div class="p-2 rounded-lg bg-zinc-900/60 border border-amber-500/20 flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12"/>
            </svg>
            <div>
              <div class="text-[11px] font-mono font-bold text-amber-300">Gym Checkpoints: DEFERRED</div>
              <div class="text-[10px] text-zinc-400 leading-tight">No penalties for missed workout logs.</div>
            </div>
          </div>

          <div class="p-2 rounded-lg bg-zinc-900/60 border border-amber-500/20 flex items-start gap-2">
            <svg class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/>
              <path d="M18 4H6v7a6 6 0 0 0 12 0V4Z"/>
            </svg>
            <div>
              <div class="text-[11px] font-mono font-bold text-amber-300">Party Mandates: ON HOLD</div>
              <div class="text-[10px] text-zinc-400 leading-tight">Sprint rankings resume post-midterms.</div>
            </div>
          </div>
        </div>

        <!-- Action Button -->
        <div class="flex flex-col gap-2 mt-4">
          <button id="midterm-acknowledge-btn" type="button" class="btn-primary btn-tactile group w-full py-2.5 px-4 text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:brightness-105 text-black shadow-lg shadow-amber-950/40 border border-amber-400/90 rounded-xl flex items-center justify-center gap-2 cursor-pointer font-mono tracking-wider active:scale-[0.99] transition-all">
            <span>Acknowledge & Lock In For Studies</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>

        <p class="text-[9px] text-zinc-500 font-mono uppercase tracking-widest mt-2.5">
          Glazing Sovereign Protocol // Stand Down Operative • Master Your Exams
        </p>

      </div>
    </div>
  `;
}

let countdownInterval: any = null;

export function openMidtermModal() {
  const overlay = document.getElementById('midterm-modal-overlay');
  if (overlay) {
    overlay.classList.remove('hidden');
    void overlay.offsetHeight;
    overlay.setAttribute('data-state', 'open');
  }
}

export function closeMidtermModal() {
  const overlay = document.getElementById('midterm-modal-overlay');
  if (overlay) {
    overlay.setAttribute('data-state', 'closing');
    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.removeAttribute('data-state');
    }, 180);
  }
}

export function setupMidtermModalLogic() {
  if (!isMidtermFreezeActive()) {
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }

  const daysEl = document.getElementById('midterm-cd-days');
  const hoursEl = document.getElementById('midterm-cd-hours');
  const minsEl = document.getElementById('midterm-cd-mins');
  const secsEl = document.getElementById('midterm-cd-secs');
  const bannerCountdownEl = document.getElementById('midterm-banner-countdown');

  const updateCountdownDisplay = () => {
    const rem = getMidtermRemaining();

    const dStr = String(rem.days).padStart(2, '0');
    const hStr = String(rem.hours).padStart(2, '0');
    const mStr = String(rem.minutes).padStart(2, '0');
    const sStr = String(rem.seconds).padStart(2, '0');

    if (daysEl) daysEl.textContent = dStr;
    if (hoursEl) hoursEl.textContent = hStr;
    if (minsEl) minsEl.textContent = mStr;
    if (secsEl) secsEl.textContent = sStr;

    if (bannerCountdownEl) {
      bannerCountdownEl.textContent = `${rem.days}d ${hStr}h ${mStr}m ${sStr}s`;
    }

    if (rem.total <= 0) {
      if (countdownInterval) clearInterval(countdownInterval);
      closeMidtermModal();
      const banner = document.getElementById('midterm-sticky-banner');
      if (banner) banner.remove();
    }
  };

  updateCountdownDisplay();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdownDisplay, 1000);

  // Auto-display modal upon login if not dismissed during current session
  const dismissed = sessionStorage.getItem('glazing_midterm_dismissed');
  if (dismissed !== 'true') {
    openMidtermModal();
  }

  const ackBtn = document.getElementById('midterm-acknowledge-btn');
  if (ackBtn) {
    ackBtn.onclick = () => {
      sessionStorage.setItem('glazing_midterm_dismissed', 'true');
      closeMidtermModal();
    };
  }

  const closeBtn = document.getElementById('close-midterm-modal-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      closeMidtermModal();
    };
  }

  const reopenBtn = document.getElementById('midterm-reopen-btn');
  if (reopenBtn) {
    reopenBtn.onclick = () => {
      openMidtermModal();
    };
  }
}
