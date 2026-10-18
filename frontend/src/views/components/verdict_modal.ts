import { getPendingVerdicts, acknowledgeVerdict, type VerdictItem } from '../../api';
import { supabase } from '../../supabase';
import { escapeHtml } from '../../utils';

export function renderVerdictModal(): string {
  return `
    <div id="verdict-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="verdict-modal-title" class="winner-modal-backdrop fixed inset-0 bg-black/85 backdrop-blur-md z-[100] hidden flex items-center justify-center p-4">
      
      <div class="winner-modal-surface theme-card w-full max-w-md relative z-10 border border-rose-500/40 shadow-[0_0_50px_rgba(244,63,94,0.25)] bg-[#0d0f12] p-6 md:p-8 rounded-2xl text-center overflow-hidden">
        
        <!-- 30-Second Countdown Hairline Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-black/60">
          <div id="verdict-modal-timer-bar" class="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000 ease-linear" style="width: 100%;"></div>
        </div>

        <button id="close-verdict-popup-btn" type="button" aria-label="Close verdict celebration" class="btn-tactile absolute top-4 right-4 text-muted hover:text-primary transition-colors text-2xl leading-none w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface cursor-pointer">&times;</button>

        <!-- Top Celebratory Badge -->
        <div class="text-center mb-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold uppercase tracking-widest shadow-sm">
            <span class="animate-pulse">⚖️</span>
            <span>MISTERBOMBASTIC VERDICT</span>
            <span class="animate-pulse">⚖️</span>
          </div>
        </div>

        <!-- Biggie Cheese / Mr. Boombastic Spotlight with Aura -->
        <div class="text-center relative py-2">
          <!-- Ambient glowing radial rose aura -->
          <div class="verdict-ambient-glow"></div>

          <div class="inline-block relative">
            <div class="w-20 h-20 md:w-24 md:h-24 mx-auto relative verdict-rat-craft">
              <img 
                src="/bombastic.png" 
                alt="Mr. Boombastic" 
                class="w-full h-full object-contain filter drop-shadow-[0_4px_16px_rgba(244,63,94,0.4)]"
              />
            </div>
            <div class="star-sparkle star-1 text-rose-400">⚖️</div>
            <div class="star-sparkle star-2 text-amber-400">⚡</div>
            <div class="star-sparkle star-3 text-rose-300">🔥</div>
          </div>

          <div class="mt-2.5">
            <h3 id="verdict-modal-title" class="text-2xl md:text-3xl font-black text-primary tracking-tight">
              Sanction Enforced!
            </h3>
            <p id="verdict-modal-subtitle" class="text-xs md:text-sm text-body mt-1 leading-relaxed">
              The One Above All has reviewed squad telemetry and decreed disciplinary action.
            </p>
          </div>
        </div>

        <!-- Stats & Penalty Callout Grid (Matching Gym Modal 2-column layout) -->
        <div class="my-5 grid grid-cols-2 gap-3 text-left">
          <!-- Target Operative -->
          <div class="p-3.5 rounded-xl bg-surface/70 border border-border flex flex-col justify-between">
            <span class="text-[11px] font-mono text-muted font-semibold uppercase tracking-wider">Target Operative</span>
            <div class="flex items-baseline gap-1.5 mt-1 truncate">
              <span id="verdict-operative-name" class="text-xl md:text-2xl font-black text-primary font-mono truncate">Adityash</span>
            </div>
            <span class="text-[10px] text-rose-400 font-mono mt-0.5 font-medium truncate">Disciplinary Target</span>
          </div>

          <!-- Points Deducted -->
          <div class="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col justify-between">
            <span class="text-[11px] font-mono text-rose-400/90 font-semibold uppercase tracking-wider">Vault Deduction</span>
            <div class="flex items-baseline gap-1.5 mt-1">
              <span id="verdict-points-deducted" class="text-2xl font-black text-rose-400 font-mono">-5</span>
              <span class="text-xs font-mono text-rose-300/80 font-bold">PTS</span>
            </div>
            <span class="text-[10px] text-muted font-mono mt-0.5">Docked Immediately</span>
          </div>
        </div>

        <!-- Directive & Enforced Sanction Banner -->
        <div class="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-zinc-950/60 to-rose-950/20 border border-rose-500/30 text-left space-y-1.5 shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
              <span>⚖️</span>
              <span>ENFORCED SANCTION</span>
            </span>
            <span id="verdict-action-badge" class="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Gym Check-in Revoked
            </span>
          </div>
          <div class="text-xs font-semibold text-zinc-200 truncate pt-0.5 flex items-center gap-1.5">
            <span class="text-zinc-500 font-mono text-[10px]">DIRECTIVE:</span>
            <span id="verdict-task-title" class="truncate font-mono">Daily Gym Checkpoint</span>
          </div>
        </div>

        <!-- Overseer Written Reason Callout Box -->
        <div class="mb-5 p-3 rounded-xl bg-surface/50 border border-border/70 text-xs text-zinc-300 font-medium flex items-center justify-center gap-2 text-center italic">
          <span class="text-base select-none shrink-0">📜</span>
          <span id="verdict-reason-text">"Did not attend gym today, selfie was from yesterday"</span>
        </div>

        <!-- Action Button (Tactile Glazing Button) -->
        <div class="flex flex-col gap-2">
          <button id="verdict-accept-btn" type="button" class="btn-primary btn-tactile w-full py-3 text-sm font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-950/50 border border-rose-400/80 rounded-xl flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all">
            <span id="verdict-btn-text">Accept Verdict & Repent</span>
            <span id="verdict-countdown-text" class="px-2 py-0.5 rounded-md bg-black/40 text-[11px] font-mono text-white/90">30s</span>
            <span class="text-xs">⚡</span>
          </button>
        </div>

        <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-3">Recorded on Glazing Ledger // The One Above All Watches</p>

      </div>
    </div>
  `;
}

let activePendingVerdicts: VerdictItem[] = [];
let currentVerdictIndex = 0;
let verdictCountdownInterval: any = null;

export async function checkAndShowPendingVerdicts() {
  try {
    const verdicts = await getPendingVerdicts();
    if (!verdicts || verdicts.length === 0) return;

    activePendingVerdicts = verdicts;
    currentVerdictIndex = 0;
    displayCurrentVerdict();
  } catch (err) {
    console.error("Failed to check pending verdicts:", err);
  }
}

async function displayCurrentVerdict() {
  if (verdictCountdownInterval) {
    clearInterval(verdictCountdownInterval);
    verdictCountdownInterval = null;
  }

  if (currentVerdictIndex >= activePendingVerdicts.length) {
    const overlay = document.getElementById('verdict-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    return;
  }

  const v = activePendingVerdicts[currentVerdictIndex];
  const overlay = document.getElementById('verdict-modal-overlay');
  const opNameEl = document.getElementById('verdict-operative-name');
  const actionBadge = document.getElementById('verdict-action-badge');
  const taskTitleEl = document.getElementById('verdict-task-title');
  const ptsDeductedEl = document.getElementById('verdict-points-deducted');
  const reasonEl = document.getElementById('verdict-reason-text');
  const acceptBtn = document.getElementById('verdict-accept-btn');
  const btnTextEl = document.getElementById('verdict-btn-text');
  const countdownEl = document.getElementById('verdict-countdown-text');
  const timerBarEl = document.getElementById('verdict-modal-timer-bar');
  const closeBtn = document.getElementById('close-verdict-popup-btn');

  if (!overlay || !actionBadge || !taskTitleEl || !ptsDeductedEl || !reasonEl || !acceptBtn) return;

  const { data: { session } } = await supabase.auth.getSession();
  const currentUid = session?.user?.id;
  const isTarget = currentUid === v.target_user_id;

  const actionLabels: Record<string, string> = {
    'REVOKE_GYM': '🏋️ GYM CHECK-IN REVOKED',
    'REJECT_TASK': '❌ TASK DECLARED FAKE & VOIDED',
    'REWRITE_TASK': '✍️ TASK AUDITED & HOURS DOCKED',
    'REVERT_PENDING': '🔄 FORCED REVERT TO PENDING'
  };

  if (opNameEl) {
    opNameEl.textContent = v.target_user_name || 'Operative';
  }

  actionBadge.textContent = actionLabels[v.action_type] || v.action_type;
  taskTitleEl.textContent = v.task_title || 'Assigned Directive';
  ptsDeductedEl.textContent = v.points_deducted > 0 ? `-${v.points_deducted}` : '0';
  reasonEl.textContent = `"${escapeHtml(v.reason)}"`;

  if (btnTextEl) {
    btnTextEl.textContent = isTarget ? 'Accept Verdict & Repent' : 'Witnessed & Understood';
  }

  overlay.classList.remove('hidden');

  let timeLeft = 30;
  if (countdownEl) countdownEl.textContent = `${timeLeft}s`;
  if (timerBarEl) timerBarEl.style.width = '100%';

  const handleAcknowledge = async () => {
    if (verdictCountdownInterval) {
      clearInterval(verdictCountdownInterval);
      verdictCountdownInterval = null;
    }

    try {
      if (btnTextEl) btnTextEl.textContent = 'Acknowledging...';
      await acknowledgeVerdict(v.id);
    } catch {
    } finally {
      window.dispatchEvent(new CustomEvent('verdict-received', { detail: v }));
      currentVerdictIndex++;
      displayCurrentVerdict();
    }
  };

  acceptBtn.onclick = handleAcknowledge;
  if (closeBtn) closeBtn.onclick = handleAcknowledge;

  verdictCountdownInterval = setInterval(() => {
    timeLeft--;
    if (countdownEl) countdownEl.textContent = `${timeLeft}s`;
    if (timerBarEl) timerBarEl.style.width = `${Math.max(0, (timeLeft / 30) * 100)}%`;
    if (timeLeft <= 0) {
      handleAcknowledge();
    }
  }, 1000);
}
