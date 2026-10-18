import { getPendingVerdicts, acknowledgeVerdict, type VerdictItem } from '../../api';
import { escapeHtml } from '../../utils';


export function renderVerdictModal(): string {
  return `
    <div id="verdict-modal-overlay" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-md hidden flex items-center justify-center p-4">
      <div class="theme-card max-w-[480px] w-full p-6 md:p-8 space-y-6 bg-[#0c0a09] border border-rose-500/40 rounded-2xl shadow-[0_0_50px_rgba(244,63,94,0.25)] relative overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Glowing Top Bar -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-red-600"></div>

        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center text-xl font-bold font-mono shadow-inner">
              ⚖️
            </div>
            <div>
              <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono font-bold tracking-widest uppercase mb-1">
                <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                Official Verdict
              </div>
              <h3 class="text-lg font-extrabold tracking-tight text-white font-mono">MISTERBOMBASTIC VERDICT</h3>
            </div>
          </div>
        </div>

        <div class="bg-rose-950/30 border border-rose-500/20 p-3.5 rounded-xl space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="text-rose-300 font-mono text-[11px] uppercase tracking-wider">Judged Action</span>
            <span id="verdict-action-badge" class="font-bold text-rose-400 font-mono">...</span>
          </div>
          <div class="text-zinc-300 text-[13px] font-semibold" id="verdict-task-title">
            ...
          </div>
        </div>

        <!-- Penalty Points Display -->
        <div class="p-4 rounded-xl bg-black/60 border border-white/5 flex items-center justify-between">
          <div>
            <div class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Points Deducted</div>
            <div class="text-2xl font-black font-mono text-rose-500 tracking-tight" id="verdict-points-deducted">-0 PTS</div>
          </div>
          <div class="text-right">
            <div class="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">Status</div>
            <div class="text-xs font-mono font-bold text-amber-400">IRREVOCABLE</div>
          </div>
        </div>

        <!-- Overseer's Reason -->
        <div>
          <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Overseer's Written Reason</label>
          <div class="p-3.5 rounded-xl bg-surface/80 border border-border text-zinc-200 text-xs leading-relaxed italic" id="verdict-reason-text">
            "..."
          </div>
        </div>

        <div class="pt-2">
          <button
            type="button"
            id="verdict-accept-btn"
            class="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-xs uppercase tracking-wider font-mono shadow-lg shadow-rose-900/30 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Accept Verdict & Repent</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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

function displayCurrentVerdict() {
  if (currentVerdictIndex >= activePendingVerdicts.length) {
    const overlay = document.getElementById('verdict-modal-overlay');
    if (overlay) overlay.classList.add('hidden');
    return;
  }

  const v = activePendingVerdicts[currentVerdictIndex];
  const overlay = document.getElementById('verdict-modal-overlay');
  const actionBadge = document.getElementById('verdict-action-badge');
  const taskTitleEl = document.getElementById('verdict-task-title');
  const ptsDeductedEl = document.getElementById('verdict-points-deducted');
  const reasonEl = document.getElementById('verdict-reason-text');
  const acceptBtn = document.getElementById('verdict-accept-btn');

  if (!overlay || !actionBadge || !taskTitleEl || !ptsDeductedEl || !reasonEl || !acceptBtn) return;

  const actionLabels: Record<string, string> = {
    'REVOKE_GYM': '🏋️ GYM CHECK-IN REVOKED',
    'REJECT_TASK': '❌ TASK DECLARED FAKE & VOIDED',
    'REWRITE_TASK': '✍️ TASK AUDITED & HOURS DOCKED',
    'REVERT_PENDING': '🔄 FORCED REVERT TO PENDING'
  };

  actionBadge.textContent = actionLabels[v.action_type] || v.action_type;
  taskTitleEl.textContent = v.task_title || 'Unspecified Task';
  ptsDeductedEl.textContent = `-${v.points_deducted} PTS`;
  reasonEl.textContent = `"${escapeHtml(v.reason)}"`;

  overlay.classList.remove('hidden');

  // One-time listener for accept button
  acceptBtn.onclick = async () => {
    acceptBtn.textContent = 'Acknowledging...';
    try {
      await acknowledgeVerdict(v.id);
      currentVerdictIndex++;
      displayCurrentVerdict();
    } catch (e) {
      currentVerdictIndex++;
      displayCurrentVerdict();
    } finally {
      acceptBtn.textContent = 'Accept Verdict & Repent';
    }
  };
}
