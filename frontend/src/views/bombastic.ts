import { supabase } from '../supabase';
import {
  getSquadPresence,
  getUnmaskedTasks,
  revokeGymVerdict,
  rejectTaskVerdict,
  rewriteTaskVerdict,
  revertPendingVerdict,
  getVerdictsFeed,
  type OperativePresenceItem,
  type VerdictItem,
} from '../api';
import { escapeHtml, safeUrl } from '../utils';
import { showNotification } from './components/navbar';


export function renderBombastic(): string {
  return `
    <div class="min-h-screen bg-[#070709] text-zinc-100 font-sans selection:bg-rose-500/30 selection:text-white pb-20">
      
      <!-- Top Tactical Overseer Bar -->
      <header class="sticky top-0 z-40 w-full h-[54px] bg-[#0c0a09]/90 border-b border-rose-500/20 backdrop-blur-xl flex items-center shadow-lg shadow-black/40">
        <div class="max-w-[1340px] w-full mx-auto px-4 md:px-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2.5">
              <img src="/bombastic.png" alt="Mr. Boombastic" class="w-7 h-7 rounded-lg object-contain p-0.5 bg-rose-950/30 border border-rose-500/40 shadow-sm" />
              <span class="font-mono font-black text-sm tracking-widest text-rose-500 uppercase">MISTERBOMBASTIC</span>
            </div>
            <span class="hidden sm:inline-block px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[10px] font-bold tracking-wider">
              ONE ABOVE ALL // COVERT COCKPIT
            </span>
          </div>

          <div class="flex items-center space-x-3">
            <div class="hidden md:flex items-center space-x-2 text-[11px] font-mono text-zinc-400">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE SQUAD TELEMETRY</span>
            </div>
            <button
              id="bombastic-refresh-btn"
              class="px-2.5 py-1 rounded-lg border border-white/10 hover:border-rose-500/40 text-zinc-300 hover:text-white text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Refresh Telemetry"
            >
              <svg id="bombastic-refresh-spinner" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              <span>SYNC</span>
            </button>
            <a
              href="#/dashboard"
              id="exit-bombastic-btn"
              class="px-3 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-zinc-300 hover:text-rose-300 border border-white/10 hover:border-rose-500/40 text-xs font-mono font-medium transition-all"
            >
              &larr; Standard View
            </a>
          </div>
        </div>
      </header>

      <!-- Main Cockpit Container -->
      <main class="max-w-[1340px] w-full mx-auto px-4 md:px-6 pt-6 space-y-8">
        
        <!-- Mission Banner -->
        <div class="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-black to-zinc-950 border border-rose-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="text-[11px] font-mono text-rose-400 font-bold uppercase tracking-wider">High Clearance Surveillance</div>
            <h2 class="text-xl md:text-2xl font-black font-mono tracking-tight text-white mt-0.5">
              5 Operatives Surveillance Matrix
            </h2>
            <p class="text-xs text-zinc-400 mt-1">
              Real-time activity radar, unmasked classified directives, and irrevocable audit enforcement authority.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              id="open-quick-gym-revoke-btn"
              class="px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🏋️ Audit Daily Gym</span>
            </button>
          </div>
        </div>

        <!-- 1. Real-Time Squad Presence Radar -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              Live Operative Status Radar (30s Heartbeat)
            </h3>
            <span class="text-[11px] font-mono text-zinc-500" id="presence-last-updated">Updating...</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3" id="presence-grid">
            <div class="p-4 rounded-xl bg-surface/50 border border-border animate-pulse text-xs text-zinc-500 font-mono">
              Loading operative telemetry...
            </div>
          </div>
        </section>

        <!-- 2. Unmasked Directives & Proof Auditing Stream -->
        <section class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 class="text-sm font-mono uppercase tracking-wider text-white font-bold flex items-center gap-2">
                <span>🛡️</span>
                Unmasked Directives & Proof Verification
              </h3>
              <p class="text-[11px] text-zinc-400 font-mono mt-0.5">
                Classified tasks are revealed in cleartext for authenticity verification.
              </p>
            </div>

            <!-- Filter Controls -->
            <div class="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 text-xs font-mono">
              <button type="button" data-filter="all" class="task-filter-btn px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold transition-all">All</button>
              <button type="button" data-filter="classified" class="task-filter-btn px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white transition-all">Classified Only</button>
              <button type="button" data-filter="completed" class="task-filter-btn px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white transition-all">Completed</button>
              <button type="button" data-filter="suspicious" class="task-filter-btn px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white transition-all">Suspicious Proof</button>
            </div>
          </div>

          <!-- Tasks Table Container -->
          <div class="rounded-2xl border border-white/10 bg-black/40 overflow-hidden shadow-2xl">
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-white/10 bg-surface/50 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    <th class="py-3 px-4">Operative</th>
                    <th class="py-3 px-4">Directive Title</th>
                    <th class="py-3 px-4">Domain</th>
                    <th class="py-3 px-4">Logged / Est</th>
                    <th class="py-3 px-4">Score</th>
                    <th class="py-3 px-4">Proof of Work</th>
                    <th class="py-3 px-4 text-right">Audit Verdict</th>
                  </tr>
                </thead>
                <tbody id="unmasked-tasks-tbody" class="divide-y divide-white/5 font-mono">
                  <tr>
                    <td colspan="7" class="py-8 text-center text-zinc-500">
                      Decrypting task stream...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 3. Recent Verdicts Log -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-2">
              <span>⚖️</span>
              Recent Misterbombastic Judgments Ledger
            </h3>
          </div>

          <div class="rounded-xl border border-white/10 bg-black/30 p-4 divide-y divide-white/5" id="verdicts-history-list">
            <p class="text-xs text-zinc-500 font-mono">Loading judgments...</p>
          </div>
        </section>

      </main>

      <!-- Audit Verdict Action Modal -->
      <div id="audit-action-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
        <div class="w-full max-w-lg bg-[#0e0a0b] border border-rose-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(244,63,94,0.12)] space-y-5 text-left relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center p-1.5 shadow-inner shrink-0">
                <img src="/bombastic.png" alt="Mr. Boombastic" class="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.3)]" />
              </div>
              <div>
                <div class="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold mb-0.5 flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  One Above All Authority
                </div>
                <h3 class="text-base font-extrabold text-white font-mono uppercase tracking-tight">Issue Overseer Verdict</h3>
              </div>
            </div>
            <button type="button" id="close-audit-modal-btn" class="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-white/5 hover:border-white/15 text-sm">✕</button>
          </div>

          <!-- Target Info -->
          <div class="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-xs font-mono space-y-2">
            <div class="text-zinc-400 flex justify-between items-center">
              <span class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Target Operative</span>
              <span class="text-rose-400 font-bold font-mono px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 shadow-sm" id="audit-target-name">...</span>
            </div>
            <div class="text-zinc-200 text-xs truncate font-medium flex items-center gap-1.5 pt-0.5">
              <span class="text-zinc-500 text-[10px] uppercase tracking-wider font-mono">Target Task:</span>
              <span class="truncate font-semibold text-zinc-200" id="audit-target-task">...</span>
            </div>
          </div>

          <form id="audit-verdict-form" novalidate class="space-y-4">
            <input type="hidden" id="audit-task-id" />
            <input type="hidden" id="audit-user-id" />

            <div>
              <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">Verdict Action</label>
              <select id="audit-action-type" class="w-full bg-[#140e10] border border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 text-white font-mono text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all cursor-pointer">
                <option value="REJECT_TASK">❌ Void Task & Deduct All Points (Fake Task)</option>
                <option value="REWRITE_TASK">✍️ Rewrite Title & Dock Actual Hours</option>
                <option value="REVERT_PENDING">🔄 Revert Completed Task Back to Pending</option>
                <option value="REVOKE_GYM">🏋️ Revoke Daily Gym Checkpoint (-5 pts)</option>
              </select>
            </div>

            <!-- Rewrite Fields (shown only for REWRITE_TASK) -->
            <div id="rewrite-fields" class="space-y-3 hidden p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div>
                <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">New Audited Title</label>
                <input type="text" id="audit-new-title" class="w-full bg-[#140e10] border border-white/10 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none" placeholder="Audited task title..." />
              </div>
              <div>
                <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1">Adjusted Actual Hours</label>
                <input type="number" id="audit-new-hours" class="w-full bg-[#140e10] border border-white/10 text-white font-mono text-xs rounded-xl px-3 py-2 outline-none" placeholder="1.0" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5 font-semibold">Overseer Verdict Reason (Mandatory)</label>
              <textarea
                id="audit-reason"
                rows="3"
                class="w-full bg-[#140e10] border border-white/10 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 text-white font-sans text-xs rounded-xl p-3 outline-none transition-all placeholder:text-zinc-600 leading-relaxed resize-none"
                placeholder="Explain the verdict reason (displayed on operative popup & squad activity feed)..."
              ></textarea>
              <div class="flex flex-wrap gap-1.5 pt-2">
                <button type="button" class="quick-audit-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/30 text-[10px] font-mono text-zinc-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95" data-reason="Fabricated / fraudulent task proof">❌ Fake proof</button>
                <button type="button" class="quick-audit-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/30 text-[10px] font-mono text-zinc-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95" data-reason="Actual hours severely exaggerated beyond scope">✍️ Exaggerated hours</button>
                <button type="button" class="quick-audit-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/30 text-[10px] font-mono text-zinc-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95" data-reason="Incomplete deliverable, reverted for genuine redo">🔄 Redo required</button>
                <button type="button" class="quick-audit-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/15 border border-white/5 hover:border-rose-500/30 text-[10px] font-mono text-zinc-400 hover:text-rose-300 transition-all cursor-pointer active:scale-95" data-reason="Disqualified under squad discipline protocol">⚖️ Protocol breach</button>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                type="button"
                id="cancel-audit-btn"
                class="px-4 py-2.5 text-xs font-mono font-medium text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                id="submit-verdict-btn"
                class="px-5 py-2.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/50 flex items-center gap-2 active:scale-95"
              >
                <span>Execute Verdict</span>
              </button>
            </div>
          </form>

        </div>
      </div>

      <!-- Quick Gym Revoke Modal -->
      <div id="quick-gym-modal" class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md hidden flex items-center justify-center p-4">
        <div class="w-full max-w-md bg-[#0e0a0b] border border-amber-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.12)] space-y-5 text-left relative overflow-hidden">
          <div class="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center p-1 shadow-inner">
                <img src="/bombastic.png" alt="Mr. Boombastic" class="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]" />
              </div>
              <div>
                <div class="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">Authoritative Sanction</div>
                <h3 class="text-base font-bold text-white font-mono uppercase tracking-tight">Revoke Gym Check-in</h3>
              </div>
            </div>
            <button type="button" id="close-quick-gym-btn" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">✕</button>
          </div>

          <form id="quick-gym-form" novalidate class="space-y-4">
            <div>
              <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Target Operative</label>
              <select id="quick-gym-user-select" class="w-full bg-[#140e10] border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-white font-mono text-xs rounded-xl px-3.5 py-2.5 outline-none transition-all cursor-pointer">
                <option value="3bc1639a-148d-42c3-9dc2-ba6d84547ba1">Adityash (adityash@glazing.com)</option>
                <option value="cd06e10c-cb1e-4ac4-a8e4-c1dcca5df973">Manas (manas@glazing.com)</option>
                <option value="d97c27ee-0548-4a4f-b485-79f974fb6bd1">Shivansh (shivansh@glazing.com)</option>
                <option value="4b4bb28a-7938-468b-b6dd-e7159c96b515">Praveen (praveen@glazing.com)</option>
                <option value="18baa0cd-2063-4aca-93f8-73cdf97cdd95">Harshit (harshit@glazing.com)</option>
              </select>
            </div>

            <div>
              <label class="block text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Reason for Revocation</label>
              <textarea id="quick-gym-reason" required rows="2" class="w-full bg-[#140e10] border border-white/10 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 text-white font-sans text-xs rounded-xl p-3 outline-none transition-all placeholder:text-zinc-600 leading-relaxed resize-none" placeholder="e.g. Did not attend gym today, selfie was from yesterday"></textarea>
              <div class="flex flex-wrap gap-1.5 pt-1.5">
                <button type="button" class="quick-gym-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-all cursor-pointer" data-reason="Did not attend gym today">❌ Did not attend</button>
                <button type="button" class="quick-gym-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-all cursor-pointer" data-reason="Fake or recycled selfie proof uploaded">📸 Fake proof</button>
                <button type="button" class="quick-gym-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-all cursor-pointer" data-reason="Checked in without genuine workout">🚫 Zero workout</button>
                <button type="button" class="quick-gym-chip px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/15 border border-white/5 hover:border-amber-500/30 text-[10px] font-mono text-zinc-400 hover:text-amber-300 transition-all cursor-pointer" data-reason="Retroactive or fraudulent timestamp">⏰ False timestamp</button>
              </div>
            </div>

            <div class="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button type="button" id="cancel-quick-gym-btn" class="px-4 py-2.5 text-xs font-mono font-medium text-zinc-400 hover:text-white border border-white/10 hover:bg-white/5 rounded-xl transition-all cursor-pointer active:scale-95">Cancel</button>
              <button type="button" id="submit-quick-gym-btn" class="px-5 py-2.5 text-xs font-mono font-bold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-lg shadow-amber-950/50 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
                <span>Revoke (-5 pts)</span>
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  `;
}

let allUnmaskedTasks: any[] = [];
let squadOperatives: OperativePresenceItem[] = [];
let currentFilter: 'all' | 'classified' | 'completed' | 'suspicious' = 'all';

export function setupBombasticLogic(navigateFn: (route: string) => void) {
  const presenceGrid = document.getElementById('presence-grid');
  const tasksTbody = document.getElementById('unmasked-tasks-tbody');
  const verdictsList = document.getElementById('verdicts-history-list');
  const refreshBtn = document.getElementById('bombastic-refresh-btn');
  const refreshSpinner = document.getElementById('bombastic-refresh-spinner');
  const lastUpdatedEl = document.getElementById('presence-last-updated');

  const auditModal = document.getElementById('audit-action-modal') as HTMLDivElement;
  const closeAuditBtn = document.getElementById('close-audit-modal-btn');
  const cancelAuditBtn = document.getElementById('cancel-audit-btn');
  const auditForm = document.getElementById('audit-verdict-form') as HTMLFormElement;
  const auditActionSelect = document.getElementById('audit-action-type') as HTMLSelectElement;
  const rewriteFields = document.getElementById('rewrite-fields') as HTMLDivElement;

  const exitBtn = document.getElementById('exit-bombastic-btn');
  if (exitBtn) {
    exitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateFn('dashboard');
    });
  }


  const quickGymBtn = document.getElementById('open-quick-gym-revoke-btn');
  const quickGymModal = document.getElementById('quick-gym-modal') as HTMLDivElement;
  const closeQuickGymBtn = document.getElementById('close-quick-gym-btn');
  const cancelQuickGymBtn = document.getElementById('cancel-quick-gym-btn');
  const quickGymForm = document.getElementById('quick-gym-form') as HTMLFormElement;
  const quickGymUserSelect = document.getElementById('quick-gym-user-select') as HTMLSelectElement;

  // Toggle rewrite fields on action change
  if (auditActionSelect && rewriteFields) {
    auditActionSelect.addEventListener('change', () => {
      if (auditActionSelect.value === 'REWRITE_TASK') {
        rewriteFields.classList.remove('hidden');
      } else {
        rewriteFields.classList.add('hidden');
      }
    });
  }

  // Load telemetry
  async function loadAllOverseerTelemetry() {
    try {
      if (refreshSpinner) refreshSpinner.classList.add('animate-spin');

      const [presenceRes, tasksRes, verdictsRes] = await Promise.allSettled([
        getSquadPresence(),
        getUnmaskedTasks(),
        getVerdictsFeed()
      ]);

      if (presenceRes.status === 'fulfilled') {
        squadOperatives = presenceRes.value || [];
        renderPresenceGrid(squadOperatives);
        if (quickGymUserSelect && squadOperatives.length > 0) {
          quickGymUserSelect.innerHTML = squadOperatives.map(op => `
            <option value="${op.user_id}">${escapeHtml(op.display_name)} (${op.email})</option>
          `).join('');
        }
      } else {
        console.error("Presence load failed:", presenceRes.reason);
        if (presenceGrid) {
          const is404 = presenceRes.reason?.message?.includes('404') || presenceRes.reason?.message?.includes('Not Found');
          presenceGrid.innerHTML = `
            <div class="col-span-1 sm:col-span-2 lg:col-span-5 p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs font-mono text-center space-y-1">
              <div>⚠️ Telemetry link disrupted: ${escapeHtml(presenceRes.reason?.message || 'Server error')}</div>
              ${is404 ? '<div class="text-[11px] text-zinc-400">Backend on Render needs redeployment: Go to dashboard.render.com &rarr; Manual Deploy &rarr; Deploy latest commit.</div>' : ''}
            </div>
          `;
        }
      }

      if (tasksRes.status === 'fulfilled') {
        allUnmaskedTasks = tasksRes.value || [];
        renderTasksTable();
      } else {
        console.error("Tasks load failed:", tasksRes.reason);
        if (tasksTbody) {
          const is404 = tasksRes.reason?.message?.includes('404') || tasksRes.reason?.message?.includes('Not Found');
          tasksTbody.innerHTML = `
            <tr>
              <td colspan="7" class="py-8 text-center text-rose-400 font-mono text-xs">
                <div>⚠️ Failed to decrypt task stream: ${escapeHtml(tasksRes.reason?.message || 'Server error')}</div>
                ${is404 ? '<div class="text-[11px] text-zinc-400 mt-1">Backend on Render needs redeployment: Go to dashboard.render.com &rarr; Manual Deploy &rarr; Deploy latest commit.</div>' : ''}
              </td>
            </tr>
          `;
        }
      }

      if (verdictsRes.status === 'fulfilled') {
        renderVerdictsLedger(verdictsRes.value || []);
      } else {
        console.error("Verdicts load failed:", verdictsRes.reason);
        if (verdictsList) {
          verdictsList.innerHTML = `<p class="text-xs text-rose-400 font-mono">⚠️ Failed to load judgments ledger: ${escapeHtml(verdictsRes.reason?.message || 'Server error')}</p>`;
        }
      }

      if (lastUpdatedEl) {
        lastUpdatedEl.textContent = `Updated: ${new Date().toLocaleTimeString('en-IN', { hour12: false })}`;
      }
    } catch (err: any) {
      console.error("Overseer load error:", err);
      showNotification(`Overseer fetch error: ${err.message}`, 'error');
    } finally {
      if (refreshSpinner) refreshSpinner.classList.remove('animate-spin');
      if (refreshBtn) refreshBtn.classList.remove('animate-spin');
    }
  }

  function renderPresenceGrid(operatives: OperativePresenceItem[]) {
    if (!presenceGrid) return;

    if (operatives.length === 0) {
      presenceGrid.innerHTML = `<div class="col-span-5 text-center text-xs font-mono text-zinc-500 py-4">No operatives detected.</div>`;
      return;
    }

    presenceGrid.innerHTML = operatives.map(op => {
      const isOnline = op.is_online;
      let badgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      let dotClass = 'bg-zinc-600';

      if (op.status_label === 'IN FOCUS') {
        badgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
        dotClass = 'bg-amber-500 animate-pulse';
      } else if (isOnline) {
        badgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
        dotClass = 'bg-emerald-500 animate-ping';
      }

      return `
        <div class="p-3.5 rounded-xl bg-black/60 border ${isOnline ? 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'border-white/5'} space-y-2.5 relative group hover:border-white/20 transition-all">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div class="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono font-bold text-xs flex items-center justify-center">
                ${op.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span class="text-xs font-bold text-white block leading-tight">${escapeHtml(op.display_name)}</span>
                <span class="text-[10px] font-mono text-zinc-500">${escapeHtml(op.current_route || 'idle')}</span>
              </div>
            </div>
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold ${badgeClass}">
              <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
              <span>${op.status_label}</span>
            </div>
          </div>

          <div class="text-[11px] font-mono space-y-1 pt-1 border-t border-white/5">
            <div class="flex justify-between text-zinc-500">
              <span>LAST SEEN:</span>
              <span class="text-zinc-300">${escapeHtml(op.last_seen_relative)}</span>
            </div>
            ${op.active_task_title ? `
              <div class="text-amber-400 text-[10px] font-semibold truncate" title="${escapeHtml(op.active_task_title)}">
                ⚡ ${escapeHtml(op.active_task_title)}
              </div>
            ` : `
              <div class="text-zinc-600 text-[10px]">No active focus session</div>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function renderTasksTable() {
    if (!tasksTbody) return;

    let filtered = [...allUnmaskedTasks];
    if (currentFilter === 'classified') {
      filtered = filtered.filter(t => t.is_private);
    } else if (currentFilter === 'completed') {
      filtered = filtered.filter(t => t.status === 'COMPLETED');
    } else if (currentFilter === 'suspicious') {
      filtered = filtered.filter(t => t.status === 'COMPLETED' && t.proof_url && !t.is_proof_verified);
    }

    if (filtered.length === 0) {
      tasksTbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-zinc-500 font-mono text-xs">
            No directives match the active filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tasksTbody.innerHTML = filtered.map(t => {
      const isClassified = t.is_private;
      const isCompleted = t.status === 'COMPLETED';
      const isRejected = t.status === 'ABANDONED' || t.status === 'REJECTED_BY_OVERSEER' || (typeof t.title === 'string' && (t.title.startsWith('❌ REVOKED') || t.title.startsWith('❌ VOIDED')));

      let statusBadge = `<span class="text-zinc-400">${t.status}</span>`;
      if (isCompleted) {
        statusBadge = `<span class="text-emerald-400 font-bold">+${t.points_earned} PTS</span>`;
      } else if (isRejected) {
        statusBadge = `<span class="text-rose-500 font-bold">VOIDED</span>`;
      } else if (t.status === 'IN_PROGRESS') {
        statusBadge = `<span class="text-amber-400 font-bold animate-pulse">RUNNING</span>`;
      }

      // Proof cell rendering
      let proofHtml = `<span class="text-zinc-600">—</span>`;
      if (t.proof_url) {
        const isImage = /\.(png|jpg|jpeg|webp|gif)/i.test(t.proof_url) || t.proof_url.includes('proof_uploads');
        const verifBadge = t.is_proof_verified
          ? `<span class="text-[10px] text-emerald-400 font-bold" title="${escapeHtml(t.proof_feedback || 'Verified')}">✓ Auto-Verified</span>`
          : `<span class="text-[10px] text-rose-400 font-bold animate-pulse" title="${escapeHtml(t.proof_feedback || 'Suspicious proof link')}">⚠️ Suspect</span>`;

        if (isImage) {
          proofHtml = `
            <div class="flex items-center gap-1.5">
              <a href="${escapeHtml(safeUrl(t.proof_url))}" target="_blank" rel="noopener noreferrer" class="group relative block w-7 h-7 rounded border border-white/10 overflow-hidden hover:scale-110 transition-transform">
                <img src="${escapeHtml(safeUrl(t.proof_url))}" class="w-full h-full object-cover" alt="Proof" />
              </a>
              ${verifBadge}
            </div>
          `;
        } else {
          proofHtml = `
            <div class="flex items-center gap-1.5 max-w-[160px] truncate">
              <a href="${escapeHtml(safeUrl(t.proof_url))}" target="_blank" rel="noopener noreferrer" class="text-cyan-400 hover:underline truncate" title="${escapeHtml(t.proof_url)}">
                🔗 Link
              </a>
              ${verifBadge}
            </div>
          `;
        }
      }

      return `
        <tr class="hover:bg-white/[0.02] transition-colors ${isRejected ? 'opacity-50 line-through' : ''}">
          <td class="py-3 px-4 font-semibold text-zinc-300">
            ${escapeHtml(t.user_name || 'Operative')}
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-1.5 max-w-[320px]">
              ${isClassified ? `
                <span class="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-bold uppercase tracking-wider shrink-0" title="Classified Directive Unmasked">
                  🔒 UNMASKED
                </span>
              ` : ''}
              <span class="text-white truncate font-medium" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-zinc-400">
            ${escapeHtml(t.category || 'General')}
          </td>
          <td class="py-3 px-4 text-zinc-300">
            ${t.actual_hours !== null && t.actual_hours !== undefined ? `${t.actual_hours}h` : '—'} / ${t.estimated_hours}h
          </td>
          <td class="py-3 px-4">
            ${statusBadge}
          </td>
          <td class="py-3 px-4">
            ${proofHtml}
          </td>
          <td class="py-3 px-4 text-right">
            ${!isRejected ? `
              <button
                type="button"
                data-task-id="${escapeHtml(t.id)}"
                data-user-id="${escapeHtml(t.user_id)}"
                data-user-name="${escapeHtml(t.user_name || 'Operative')}"
                data-task-title="${escapeHtml(t.title)}"
                data-actual-hours="${t.actual_hours || t.estimated_hours || 1}"
                class="audit-trigger-btn px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-white text-[11px] font-mono font-bold transition-all cursor-pointer"
              >
                ⚖️ Audit
              </button>
            ` : `
              <span class="text-zinc-600 text-[10px]">Voided</span>
            `}
          </td>
        </tr>
      `;
    }).join('');

    // Attach audit trigger listeners
    document.querySelectorAll('.audit-trigger-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tid = btn.getAttribute('data-task-id') || '';
        const uid = btn.getAttribute('data-user-id') || '';
        const uname = btn.getAttribute('data-user-name') || '';
        const title = btn.getAttribute('data-task-title') || '';
        const hours = btn.getAttribute('data-actual-hours') || '1';

        openAuditModal(tid, uid, uname, title, hours);
      });
    });
  }

  function renderVerdictsLedger(verdicts: VerdictItem[]) {
    if (!verdictsList) return;

    if (verdicts.length === 0) {
      verdictsList.innerHTML = `<p class="text-xs text-zinc-500 font-mono">No verdicts recorded yet. All operatives are currently within compliance.</p>`;
      return;
    }

    verdictsList.innerHTML = verdicts.map(v => {
      const actionLabels: Record<string, string> = {
        'REVOKE_GYM': '🏋️ Revoked Daily Gym',
        'REJECT_TASK': '❌ Voided Fake Task',
        'REWRITE_TASK': '✍️ Rewrote Task Hours',
        'REVERT_PENDING': '🔄 Reverted to Pending'
      };

      return `
        <div class="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
          <div class="space-y-0.5">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-rose-400">${escapeHtml(v.target_user_name || 'Operative')}</span>
              <span class="text-zinc-600">•</span>
              <span class="text-zinc-300 font-semibold">${actionLabels[v.action_type] || v.action_type}</span>
              <span class="px-1.5 py-0.2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold">
                -${v.points_deducted} PTS
              </span>
            </div>
            <div class="text-zinc-400 italic text-[11px]">
              "${escapeHtml(v.reason)}"
            </div>
          </div>
          <div class="text-[10px] text-zinc-500 shrink-0">
            ${new Date(v.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      `;
    }).join('');
  }

  // Open audit modal
  function openAuditModal(taskId: string, userId: string, userName: string, taskTitle: string, actualHours: string) {
    if (!auditModal) return;
    (document.getElementById('audit-task-id') as HTMLInputElement).value = taskId;
    (document.getElementById('audit-user-id') as HTMLInputElement).value = userId;
    (document.getElementById('audit-target-name') as HTMLElement).textContent = userName;
    (document.getElementById('audit-target-task') as HTMLElement).textContent = taskTitle;
    (document.getElementById('audit-new-title') as HTMLInputElement).value = taskTitle;
    (document.getElementById('audit-new-hours') as HTMLInputElement).value = actualHours;
    (document.getElementById('audit-reason') as HTMLTextAreaElement).value = '';

    auditModal.classList.remove('hidden');
  }

  // Modal event bindings
  if (closeAuditBtn) closeAuditBtn.addEventListener('click', () => auditModal.classList.add('hidden'));
  if (cancelAuditBtn) cancelAuditBtn.addEventListener('click', () => auditModal.classList.add('hidden'));

  const executeVerdictHandler = async () => {
    const submitBtn = document.getElementById('submit-verdict-btn') as HTMLButtonElement;
    const reasonInput = document.getElementById('audit-reason') as HTMLTextAreaElement;
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      showNotification('Verdict Reason Required: Please specify the reason for this sanction.', 'error');
      if (reasonInput) {
        reasonInput.focus();
        reasonInput.classList.add('border-rose-500', 'ring-1', 'ring-rose-500');
        setTimeout(() => reasonInput.classList.remove('border-rose-500', 'ring-1', 'ring-rose-500'), 2500);
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span><span>Enforcing...</span>`;
    }

    const taskId = (document.getElementById('audit-task-id') as HTMLInputElement).value;
    const userId = (document.getElementById('audit-user-id') as HTMLInputElement).value;
    const actionType = auditActionSelect.value;

    try {
      let verdict: VerdictItem;
      if (actionType === 'REVOKE_GYM') {
        verdict = await revokeGymVerdict(userId, reason);
      } else if (actionType === 'REJECT_TASK') {
        verdict = await rejectTaskVerdict(taskId, reason);
      } else if (actionType === 'REWRITE_TASK') {
        const newTitle = (document.getElementById('audit-new-title') as HTMLInputElement).value || 'Audited Task';
        const newHours = parseFloat((document.getElementById('audit-new-hours') as HTMLInputElement).value) || 1.0;
        verdict = await rewriteTaskVerdict(taskId, newTitle, newHours, reason);
      } else {
        verdict = await revertPendingVerdict(taskId, reason);
      }

      auditModal.classList.add('hidden');
      showNotification(`⚖️ Verdict executed: -${verdict.points_deducted} pts docked from ${verdict.target_user_name || 'Operative'}!`);

      // Broadcast verdict to all connected operatives via Supabase Realtime
      try {
        supabase.channel('squad-verdicts').send({
          type: 'broadcast',
          event: 'verdict-issued',
          payload: verdict
        });
      } catch {}

      await loadAllOverseerTelemetry();
    } catch (err: any) {
      console.error("Verdict execution error:", err);
      showNotification(`Verdict execution failed: ${err.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Execute Verdict</span>`;
      }
    }
  };

  const submitVerdictBtn = document.getElementById('submit-verdict-btn');
  if (submitVerdictBtn) {
    submitVerdictBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeVerdictHandler();
    });
  }

  if (auditForm) {
    auditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeVerdictHandler();
    });
  }

  // Quick Gym Modal Bindings
  if (quickGymBtn && quickGymModal) {
    quickGymBtn.addEventListener('click', () => {
      if (squadOperatives && squadOperatives.length > 0 && quickGymUserSelect) {
        quickGymUserSelect.innerHTML = squadOperatives.map(op => `
          <option value="${op.user_id}">${escapeHtml(op.display_name)} (${op.email})</option>
        `).join('');
      }
      quickGymModal.classList.remove('hidden');
    });
  }
  if (closeQuickGymBtn) closeQuickGymBtn.addEventListener('click', () => quickGymModal.classList.add('hidden'));
  if (cancelQuickGymBtn) cancelQuickGymBtn.addEventListener('click', () => quickGymModal.classList.add('hidden'));

  const executeQuickGymHandler = async () => {
    const submitBtn = document.getElementById('submit-quick-gym-btn') as HTMLButtonElement;
    const reasonInput = document.getElementById('quick-gym-reason') as HTMLTextAreaElement;
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!reason) {
      showNotification('Revocation Reason Required: Please specify why gym check-in is invalid.', 'error');
      if (reasonInput) {
        reasonInput.focus();
        reasonInput.classList.add('border-amber-500', 'ring-1', 'ring-amber-500');
        setTimeout(() => reasonInput.classList.remove('border-amber-500', 'ring-1', 'ring-amber-500'), 2500);
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin mr-1"></span><span>Revoking...</span>`;
    }

    const targetUid = quickGymUserSelect.value;

    try {
      const v = await revokeGymVerdict(targetUid, reason);
      quickGymModal.classList.add('hidden');
      if (quickGymForm) (quickGymForm as HTMLFormElement).reset();
      showNotification(`🏋️ Gym Check-in Revoked: -${v.points_deducted} pts docked!`);

      try {
        supabase.channel('squad-verdicts').send({
          type: 'broadcast',
          event: 'verdict-issued',
          payload: v
        });
      } catch {}

      await loadAllOverseerTelemetry();

    } catch (err: any) {
      console.error("Gym revoke error:", err);
      showNotification(`Gym revocation failed: ${err.message}`, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Revoke (-5 pts)</span>`;
      }
    }
  };

  const submitQuickGymBtn = document.getElementById('submit-quick-gym-btn');
  if (submitQuickGymBtn) {
    submitQuickGymBtn.addEventListener('click', (e) => {
      e.preventDefault();
      executeQuickGymHandler();
    });
  }

  if (quickGymForm) {
    quickGymForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeQuickGymHandler();
    });
  }

  // Filter buttons logic
  document.querySelectorAll('.task-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.task-filter-btn').forEach(b => {
        b.className = 'task-filter-btn px-2.5 py-1 rounded-lg text-zinc-400 hover:text-white transition-all';
      });
      btn.className = 'task-filter-btn px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold transition-all';
      currentFilter = (btn.getAttribute('data-filter') as any) || 'all';
      renderTasksTable();
    });
  });

  if (refreshBtn) refreshBtn.addEventListener('click', loadAllOverseerTelemetry);

  // Live Presence Sync Listener (Supabase Realtime)
  const handlePresenceSync = (e: any) => {
    const state = e.detail || {};
    const onlineUserIds = new Set(Object.keys(state));
    if (squadOperatives && squadOperatives.length > 0) {
      let changed = false;
      squadOperatives.forEach(op => {
        if (onlineUserIds.has(op.user_id) && !op.is_online) {
          op.is_online = true;
          op.status_label = 'ACTIVE';
          op.last_seen_relative = 'Online now';
          changed = true;
        }
      });
      if (changed) renderPresenceGrid(squadOperatives);
    }
  };
  // Quick reason chips click logic
  document.querySelectorAll('.quick-audit-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const reasonText = chip.getAttribute('data-reason') || '';
      const reasonInput = document.getElementById('audit-reason') as HTMLTextAreaElement;
      if (reasonInput) {
        reasonInput.value = reasonText;
        reasonInput.focus();
      }
    });
  });

  document.querySelectorAll('.quick-gym-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const reasonText = chip.getAttribute('data-reason') || '';
      const reasonInput = document.getElementById('quick-gym-reason') as HTMLTextAreaElement;
      if (reasonInput) {
        reasonInput.value = reasonText;
        reasonInput.focus();
      }
    });
  });

  // Trigger initial telemetry sync immediately on cockpit mount
  loadAllOverseerTelemetry();

  // Polling every 20s while cockpit is open
  const interval = setInterval(loadAllOverseerTelemetry, 20000);
  window.addEventListener('hashchange', () => {
    clearInterval(interval);
    window.removeEventListener('presence-sync', handlePresenceSync);
  }, { once: true });
}

