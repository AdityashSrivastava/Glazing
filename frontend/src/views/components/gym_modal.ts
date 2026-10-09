import type { GymStatus } from '../../api';

export function renderGymModal(): string {
  return `
    <div id="gym-checkpoint-modal" role="dialog" aria-modal="true" aria-labelledby="gym-modal-title" class="winner-modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4">
      
      <!-- Celebratory Athletic Confetti Engine -->
      <div id="gym-confetti-container" class="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div class="confetti-piece cp1" style="background-color: #10b981;"></div>
        <div class="confetti-piece cp2" style="background-color: #34d399;"></div>
        <div class="confetti-piece cp3" style="background-color: #06b6d4;"></div>
        <div class="confetti-piece cp4" style="background-color: #10b981;"></div>
        <div class="confetti-piece cp5" style="background-color: #fbbf24;"></div>
        <div class="confetti-piece cp6" style="background-color: #34d399;"></div>
        <div class="confetti-piece cp7" style="background-color: #10b981;"></div>
        <div class="confetti-piece cp8" style="background-color: #06b6d4;"></div>
        <div class="confetti-piece cp9" style="background-color: #a7f3d0;"></div>
        <div class="confetti-piece cp10" style="background-color: #10b981;"></div>
        <div class="confetti-piece cp11" style="background-color: #fbbf24;"></div>
        <div class="confetti-piece cp12" style="background-color: #34d399;"></div>
        <div class="confetti-piece cp13" style="background-color: #059669;"></div>
        <div class="confetti-piece cp14" style="background-color: #06b6d4;"></div>
        <div class="confetti-piece cp15" style="background-color: #10b981;"></div>
      </div>

      <div class="winner-modal-surface theme-card w-full max-w-md relative z-10 border border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.25)] bg-[#0d0f12] p-6 md:p-8 rounded-2xl text-center overflow-hidden">
        
        <button id="close-gym-modal-btn" type="button" aria-label="Close gym celebration" class="btn-tactile absolute top-4 right-4 text-muted hover:text-primary transition-colors text-2xl leading-none w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface cursor-pointer">&times;</button>

        <!-- Top Celebratory Badge -->
        <div class="text-center mb-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
            <span class="animate-pulse">⚡</span>
            <span id="gym-modal-badge-label">PHYSICAL CONDITIONING VERIFIED</span>
            <span class="animate-pulse">⚡</span>
          </div>
        </div>

        <!-- Dumbbell & Athletic Energy Aura Spotlight -->
        <div class="text-center relative py-2">
          <!-- Ambient glowing radial emerald aura -->
          <div class="gym-ambient-glow"></div>

          <div class="inline-block relative">
            <div class="text-6xl md:text-7xl select-none gym-bounce-craft">🏋️</div>
            <div class="star-sparkle star-1 text-emerald-400">✨</div>
            <div class="star-sparkle star-2 text-cyan-400">⚡</div>
            <div class="star-sparkle star-3 text-emerald-300">🔥</div>
          </div>

          <div class="mt-2.5">
            <h3 id="gym-modal-title" class="text-2xl md:text-3xl font-black text-primary tracking-tight">
              Conditioning Logged!
            </h3>
            <p id="gym-modal-subtitle" class="text-xs md:text-sm text-body mt-1 leading-relaxed">
              Discipline beats motivation. You showed up and put the work in today.
            </p>
          </div>
        </div>

        <!-- Stats & Reward Callout -->
        <div class="my-5 grid grid-cols-2 gap-3 text-left">
          <!-- Points Credited -->
          <div class="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col justify-between">
            <span class="text-[11px] font-mono text-emerald-400/90 font-semibold uppercase tracking-wider">Vault Credit</span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-2xl font-black text-emerald-400 font-mono">+5</span>
              <span class="text-xs font-mono text-emerald-300/80 font-bold">PTS</span>
            </div>
            <span class="text-[10px] text-muted font-mono mt-0.5">Physical Habit Reward</span>
          </div>

          <!-- Streak Count -->
          <div class="p-3.5 rounded-xl bg-surface/70 border border-border flex flex-col justify-between">
            <span class="text-[11px] font-mono text-muted font-semibold uppercase tracking-wider">Fitness Streak</span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span class="text-sm select-none">🔥</span>
              <span id="gym-modal-streak-count" class="text-2xl font-black text-primary font-mono">1</span>
              <span class="text-xs font-mono text-muted font-bold">DAYS</span>
            </div>
            <span id="gym-modal-streak-note" class="text-[10px] text-emerald-400 font-mono mt-0.5 font-medium truncate">Day 1 completed</span>
          </div>
        </div>

        <!-- Verification Timestamp & Mission Motivation -->
        <div class="mb-6 p-3 rounded-xl bg-surface/40 border border-border/60 text-xs text-muted font-medium flex items-center justify-center gap-2">
          <span class="text-base select-none">🛡️</span>
          <span id="gym-modal-quote">Physical discipline fuels sharp execution across all missions.</span>
        </div>

        <!-- Action Button -->
        <div class="flex flex-col gap-2">
          <button id="gym-modal-confirm-btn" type="button" class="btn-primary btn-tactile w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/20 border border-emerald-400/80 flex items-center justify-center gap-2 cursor-pointer">
            <span>Keep Crushing It ⚡</span>
          </button>
        </div>

      </div>
    </div>
  `;
}

export function openGymModal(status: GymStatus) {
  const modal = document.getElementById('gym-checkpoint-modal');
  if (!modal) return;

  const streakCount = document.getElementById('gym-modal-streak-count');
  const streakNote = document.getElementById('gym-modal-streak-note');
  const quoteEl = document.getElementById('gym-modal-quote');
  const titleEl = document.getElementById('gym-modal-title');
  const subtitleEl = document.getElementById('gym-modal-subtitle');

  const streak = status.streak_days || 1;
  if (streakCount) streakCount.textContent = `${streak}`;

  if (streak <= 1) {
    if (streakNote) streakNote.textContent = 'Day 1 started';
    if (titleEl) titleEl.textContent = 'Workout Checked!';
    if (subtitleEl) subtitleEl.textContent = 'The hardest step is showing up. Physical conditioning verified for today.';
    if (quoteEl) quoteEl.textContent = 'Every long streak starts with Day 1. Momentum has begun.';
  } else if (streak < 7) {
    if (streakNote) streakNote.textContent = `${streak} days in a row`;
    if (titleEl) titleEl.textContent = `${streak}-Day Streak Active!`;
    if (subtitleEl) subtitleEl.textContent = `High-level consistency. You have checked in for ${streak} consecutive days.`;
    if (quoteEl) quoteEl.textContent = 'Consistency compounds. Discipline is showing up every single day.';
  } else {
    if (streakNote) streakNote.textContent = 'Elite consistency 🔥';
    if (titleEl) titleEl.textContent = `${streak}-Day Beast Mode!`;
    if (subtitleEl) subtitleEl.textContent = `Unstoppable physical conditioning. Over a full week of non-stop discipline!`;
    if (quoteEl) quoteEl.textContent = 'Elite physical discipline fuels elite focus. The squad salutes your grind.';
  }

  // Smooth physics-based entrance via requestAnimationFrame
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.setAttribute('data-state', 'open');
  });
}

export function setupGymModalLogic() {
  const modal = document.getElementById('gym-checkpoint-modal');
  const closeBtn = document.getElementById('close-gym-modal-btn');
  const confirmBtn = document.getElementById('gym-modal-confirm-btn');

  let isClosing = false;
  const closeModal = () => {
    if (!modal || isClosing || modal.classList.contains('hidden')) return;
    isClosing = true;
    modal.setAttribute('data-state', 'closing');

    // 160ms exit timing matching motion-craft cubic-bezier(0.4, 0, 1, 1)
    setTimeout(() => {
      modal.classList.add('hidden');
      modal.removeAttribute('data-state');
      isClosing = false;
    }, 160);
  };

  if (closeBtn) closeBtn.onclick = closeModal;
  if (confirmBtn) confirmBtn.onclick = closeModal;

  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };
  }

  // Accessible Escape keyboard listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });
}
