import { getPendingVerdicts, acknowledgeVerdict, type VerdictItem } from '../../api';
import { supabase } from '../../supabase';
import { escapeHtml } from '../../utils';

export function renderVerdictModal(): string {
  return `
    <div id="verdict-modal-overlay" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
      <div class="theme-card max-w-[490px] w-full p-6 md:p-8 space-y-5 bg-[#0c0a09] border border-rose-500/40 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.25)] relative overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Glowing Top Bar & 30s Countdown Progress Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600"></div>
        <div class="absolute top-1 left-0 right-0 h-0.5 bg-black/60">
          <div id="verdict-modal-timer-bar" class="h-full bg-rose-500 transition-all duration-1000 ease-linear" style="width: 100%;"></div>
        </div>

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3.5">
            <div class="relative shrink-0">
              <img 
                src="/bombastic.png" 
                alt="Mr. Boombastic" 
                class="w-14 h-14 rounded-2xl object-contain p-1 border-2 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-rose-950/20"
              />
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-600 border border-black flex items-center justify-center text-[10px] shadow" title="One Above All Authority">
                ⚖️
              </div>
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Official Verdict
              </div>
              <h3 class="text-lg font-extrabold tracking-tight text-white font-mono uppercase">MISTERBOMBASTIC VERDICT</h3>
            </div>
          </div>
          <button type="button" id="close-verdict-popup-btn" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5 hover:border-white/15 text-sm" title="Dismiss">✕</button>
        </div>

        <!-- Penalized Operative Section -->
        <div class="p-3.5 rounded-2xl bg-black/70 border border-rose-500/30 flex items-center justify-between">
          <div>
            <div class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Penalized Operative</div>
            <div class="text-base font-black font-mono text-white flex items-center gap-2 mt-0.5" id="verdict-operative-name">
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              <span>...</span>
            </div>
          </div>
          <div class="text-right">
            <div class="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Sanction Authority</div>
            <div class="text-xs font-mono font-bold text-rose-400" id="verdict-sanction-badge">OVERSEER SANCTION</div>
          </div>
        </div>

        <!-- Judged Action & Directive Title -->
        <div class="bg-rose-950/30 border border-rose-500/20 p-3.5 rounded-2xl space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-rose-300 font-mono text-[11px] uppercase tracking-wider font-semibold">Judged Action</span>
            <span id="verdict-action-badge" class="font-bold text-rose-400 font-mono">...</span>
          </div>
          <div class="text-zinc-200 text-xs font-semibold pt-0.5" id="verdict-task-title">
            ...
          </div>
        </div>

        <!-- Penalty Points Display -->
        <div class="p-4 rounded-2xl bg-black/60 border border-white/5 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Points Deducted</div>
            <div class="text-2xl font-black font-mono text-rose-500 tracking-tight" id="verdict-points-deducted">-0 PTS</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">Status</div>
            <div class="text-xs font-mono font-bold text-amber-400">IRREVOCABLE</div>
          </div>
        </div>

        <!-- Overseer's Reason -->
        <div>
          <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">Overseer's Written Reason</label>
          <div class="p-3.5 rounded-2xl bg-surface/80 border border-border text-zinc-200 text-xs leading-relaxed italic" id="verdict-reason-text">
            "..."
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            id="verdict-accept-btn"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider font-mono shadow-lg shadow-rose-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span id="verdict-btn-text">Accept Verdict & Repent</span>
            <span id="verdict-countdown-text" class="px-2 py-0.5 rounded-md bg-black/40 text-[10px] font-mono text-white/90">30s</span>
            <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>
        </div>

        <div class="text-center">
          <p class="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Recorded on Glazing Ledger // The One Above All Watches</p>
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
    'REVOKE_GYM': '🏋️ GYM CHECK-IN REVOKED',
    'REJECT_TASK': '❌ TASK DECLARED FAKE & VOIDED',
    'REWRITE_TASK': '✍️ TASK AUDITED & HOURS DOCKED',
    'REVERT_PENDING': '🔄 FORCED REVERT TO PENDING'
  };

  if (opNameEl) {
    opNameEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span><span>${escapeHtml(v.target_user_name || 'Operative')}</span>`;
  }

  actionBadge.textContent = actionLabels[v.action_type] || v.action_type;
  taskTitleEl.textContent = v.task_title || 'Assigned Directive';
  ptsDeductedEl.textContent = v.points_deducted > 0 ? `-${v.points_deducted} PTS` : 'VOIDED (0 PTS)';
  reasonEl.textContent = `"${escapeHtml(v.reason)}"`;

  if (btnTextEl) {
    btnTextEl.textContent = isTarget ? 'Accept Verdict & Repent' : 'Witnessed & Acknowledged';
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
      if (acceptBtn) acceptBtn.textContent = 'Acknowledging...';
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
