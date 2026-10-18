import { getPendingVerdicts, acknowledgeVerdict, type VerdictItem } from '../../api';
import { supabase } from '../../supabase';
import { escapeHtml } from '../../utils';

export function renderVerdictModal(): string {
  return `
    <div id="verdict-modal-overlay" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="max-w-[460px] w-full bg-[#09090b] border border-zinc-800 rounded-2xl shadow-2xl shadow-black relative overflow-hidden text-left animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Hairline Progress Indicator -->
        <div class="w-full h-[2px] bg-zinc-800/80">
          <div id="verdict-modal-timer-bar" class="h-full bg-rose-500 transition-all duration-1000 ease-linear" style="width: 100%;"></div>
        </div>

        <div class="p-6 space-y-5">
          <!-- Header: Entity & Dismissal -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-1 flex items-center justify-center shrink-0">
                <img 
                  src="/bombastic.png" 
                  alt="Mr. Boombastic" 
                  class="w-full h-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
              </div>
              <div>
                <h3 class="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                  <span>Misterbombastic Verdict</span>
                </h3>
                <p class="text-xs text-zinc-400">Official Disciplinary Sanction</p>
              </div>
            </div>
            <button 
              type="button" 
              id="close-verdict-popup-btn" 
              class="w-7 h-7 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors cursor-pointer text-xs" 
              title="Dismiss"
            >✕</button>
          </div>

          <!-- Structured Ledger Specification (Unified, no nested cards) -->
          <div class="border-y border-zinc-800/80 py-3.5 space-y-3">
            <!-- Row 1: Operative & Status -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">Operative</span>
              <div class="flex items-center gap-1.5 font-medium text-zinc-200" id="verdict-operative-name">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                <span>...</span>
              </div>
            </div>

            <!-- Row 2: Sanction / Judged Action -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">Judged Action</span>
              <span id="verdict-action-badge" class="px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-950/60 text-rose-300 border border-rose-900/50">
                ...
              </span>
            </div>

            <!-- Row 3: Directive / Task Title -->
            <div class="flex items-start justify-between gap-3 text-xs">
              <span class="text-zinc-400 shrink-0">Directive</span>
              <span id="verdict-task-title" class="font-medium text-zinc-200 text-right truncate max-w-[260px]">
                ...
              </span>
            </div>

            <!-- Row 4: Penalty Points -->
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">Points Deducted</span>
              <span id="verdict-points-deducted" class="font-semibold text-rose-400 font-mono tracking-tight text-sm">
                -0 PTS
              </span>
            </div>
          </div>

          <!-- Finding / Rationale -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">Overseer Finding</span>
            <div class="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/60" id="verdict-reason-text">
              "..."
            </div>
          </div>

          <!-- Decisive Action Button -->
          <div class="pt-1">
            <button
              type="button"
              id="verdict-accept-btn"
              class="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs tracking-wide transition-all active:scale-[0.99] flex items-center justify-between cursor-pointer"
            >
              <span id="verdict-btn-text">Accept Verdict & Repent</span>
              <span id="verdict-countdown-text" class="text-[11px] text-white/80 font-mono">30s</span>
            </button>
          </div>

          <div class="text-center pt-0.5">
            <p class="text-[10px] text-zinc-400 tracking-wider font-mono">Glazing Ledger // Verified Executive Sanction</p>
          </div>
        </div>
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
    'REVOKE_GYM': 'Gym Check-in Revoked',
    'REJECT_TASK': 'Task Voided (Disqualified)',
    'REWRITE_TASK': 'Hours Recalibrated & Docked',
    'REVERT_PENDING': 'Reverted to Pending'
  };

  if (opNameEl) {
    opNameEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span><span>${escapeHtml(v.target_user_name || 'Operative')}</span>`;
  }

  actionBadge.textContent = actionLabels[v.action_type] || v.action_type;
  taskTitleEl.textContent = v.task_title || 'Assigned Directive';
  ptsDeductedEl.textContent = v.points_deducted > 0 ? `-${v.points_deducted} PTS` : 'VOIDED (0 PTS)';
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
