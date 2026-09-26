import { apiFetch } from '../../api';

export interface CompleteModalParams {
  taskId: string;
  title: string;
  estHours: number;
  trackedTimerMinutes?: number;
  trackedTimerHours?: number;
}

export function renderCompleteModal(): string {
  return `
    <div id="complete-task-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
      <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 shadow-2xl">
        
        <div class="flex justify-between items-center mb-5 pb-4 border-b border-border">
          <div>
            <h2 class="text-sm font-bold tracking-wider text-primary uppercase flex items-center gap-2">
              <span>⚡ Finalize Task Execution</span>
            </h2>
            <p id="complete-modal-task-title" class="text-xs text-muted truncate max-w-[280px] mt-0.5">Task title</p>
          </div>
          <button id="close-complete-modal-btn" type="button" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
        </div>

        <form id="complete-task-form" class="space-y-4">
          <input type="hidden" id="complete-task-id" />
          <input type="hidden" id="complete-task-est-hours" />
          
          <div class="p-3 rounded-lg bg-surface/60 border border-border/80 flex items-center justify-between text-xs">
            <span class="text-muted">Estimated Target:</span>
            <span id="complete-modal-est-display" class="font-mono font-bold text-primary">0.0 hrs</span>
          </div>

          <!-- Pomodoro Timer Tracked Feed Notification -->
          <div id="complete-timer-feed-banner" class="hidden p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs animate-in fade-in">
            <div class="flex items-center gap-2 text-blue-400">
              <span class="text-sm">⏱️</span>
              <div>
                <div class="font-bold flex items-center gap-1.5">
                  <span>Pomo Timer Feed:</span>
                  <span id="complete-timer-feed-text" class="font-mono text-blue-300 font-semibold">0 mins (0.0h)</span>
                </div>
                <p class="text-[10px] text-muted">Auto-fed into hours worked. You can also adjust or input custom hours below.</p>
              </div>
            </div>
            <span class="text-[9px] font-mono uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold border border-blue-500/40">Auto-filled</span>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-[11px] font-semibold uppercase text-muted tracking-wider">
                Actual Hours Dedicated
              </label>
              <span class="text-[10px] text-accent font-mono font-medium">Editable</span>
            </div>
            <input 
              type="number" 
              id="task-actual-hours" 
              required 
              min="0.1" 
              max="12" 
              step="0.1" 
              class="theme-input font-mono text-sm" 
              placeholder="e.g. 1.0" 
            />
            <p id="task-actual-hours-hint" class="text-[10px] text-muted mt-1">Accept the timer duration or enter custom hours worked (0.1h - 12.0h).</p>
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase text-muted tracking-wider mb-1.5">
              Proof of Work / Verification Link (Optional)
            </label>
            <input 
              type="url" 
              id="task-proof-url" 
              class="theme-input font-mono text-xs" 
              placeholder="e.g. GitHub PR / commit link, screenshot, or demo URL" 
            />
            <p class="text-[10px] text-muted mt-1">Provide verifiable proof for squad peer accountability.</p>
          </div>

          <!-- Live Gamification Projected Reward -->
          <div id="projected-reward-box" class="p-3.5 rounded-lg border border-accent/20 bg-accent/[0.04] space-y-1.5 hidden">
            <div class="flex items-center justify-between text-xs font-semibold text-primary">
              <span>Projected Point Gain:</span>
              <span id="proj-total-pts" class="font-mono font-bold text-accent text-sm">+0 pts</span>
            </div>
            <div class="text-[10px] text-muted space-y-0.5 font-mono">
              <div class="flex justify-between">
                <span>Base (10 pts/hr):</span>
                <span id="proj-base-pts">0 pts</span>
              </div>
              <div class="flex justify-between">
                <span>Completion Bonus:</span>
                <span class="text-emerald-400">+5 pts</span>
              </div>
              <div id="proj-sniper-row" class="flex justify-between text-amber-400 hidden">
                <span id="proj-sniper-label">🎯 Sniper Bonus:</span>
                <span id="proj-sniper-pts">+5 pts</span>
              </div>
            </div>
          </div>

          <button type="submit" id="submit-complete-btn" class="btn-primary w-full mt-2 font-mono tracking-wider text-xs uppercase py-2.5">
            Confirm & Claim Points
          </button>
        </form>

      </div>
    </div>
  `;
}

export function openCompleteTaskModal(params: CompleteModalParams) {
  const modal = document.getElementById('complete-task-modal');
  const taskIdInput = document.getElementById('complete-task-id') as HTMLInputElement;
  const titleDisplay = document.getElementById('complete-modal-task-title');
  const estDisplay = document.getElementById('complete-modal-est-display');
  const estHidden = document.getElementById('complete-task-est-hours') as HTMLInputElement;
  const actInput = document.getElementById('task-actual-hours') as HTMLInputElement;
  const timerBanner = document.getElementById('complete-timer-feed-banner');
  const timerText = document.getElementById('complete-timer-feed-text');

  if (!modal || !taskIdInput) return;

  taskIdInput.value = params.taskId;
  if (titleDisplay) titleDisplay.textContent = params.title;
  if (estDisplay) estDisplay.textContent = `${params.estHours} hrs`;
  if (estHidden) estHidden.value = String(params.estHours);

  const timerMins = params.trackedTimerMinutes || 0;
  const timerHours = params.trackedTimerHours || (timerMins > 0 ? Math.round((timerMins / 60) * 10) / 10 : 0);

  if (timerMins > 0 || timerHours > 0) {
    if (timerBanner) timerBanner.classList.remove('hidden');
    if (timerText) timerText.textContent = `${timerMins} mins (~${timerHours} hrs)`;
    if (actInput) {
      actInput.value = String(Math.max(0.1, timerHours));
    }
  } else {
    if (timerBanner) timerBanner.classList.add('hidden');
    if (actInput) {
      actInput.value = String(params.estHours || 1.0);
    }
  }

  if (actInput) {
    actInput.dispatchEvent(new Event('input'));
  }

  modal.classList.remove('hidden');
}

export function setupCompleteModalLogic(onSuccessCallback?: () => void | Promise<void>) {
  const completeModal = document.getElementById('complete-task-modal') as HTMLDivElement;
  const closeCompleteBtn = document.getElementById('close-complete-modal-btn') as HTMLButtonElement;
  const completeForm = document.getElementById('complete-task-form') as HTMLFormElement;
  const actualHoursInput = document.getElementById('task-actual-hours') as HTMLInputElement;
  const estHoursHidden = document.getElementById('complete-task-est-hours') as HTMLInputElement;

  if (!completeModal) return;

  // Close handlers
  if (closeCompleteBtn) {
    closeCompleteBtn.onclick = () => completeModal.classList.add('hidden');
  }
  completeModal.onclick = (e) => {
    if (e.target === completeModal) completeModal.classList.add('hidden');
  };

  // Live Reward Projection calculation
  if (actualHoursInput && estHoursHidden) {
    actualHoursInput.oninput = () => {
      const act = parseFloat(actualHoursInput.value);
      const est = parseFloat(estHoursHidden.value) || 0;
      const projBox = document.getElementById('projected-reward-box');
      const projTotal = document.getElementById('proj-total-pts');
      const projBase = document.getElementById('proj-base-pts');
      const projSniperRow = document.getElementById('proj-sniper-row');
      const projSniperPts = document.getElementById('proj-sniper-pts');
      const projSniperLabel = document.getElementById('proj-sniper-label');

      if (isNaN(act) || act <= 0) {
        if (projBox) projBox.classList.add('hidden');
        return;
      }

      if (projBox) projBox.classList.remove('hidden');

      const base = Math.floor(act * 10);
      let sniper = 0;
      let sniperText = '';

      if (est >= 0.5) {
        const diff = Math.abs(est - act);
        if (diff <= 0.25) {
          sniper = 5;
          sniperText = '🎯 Precision Sniper (±0.25h):';
        } else if (diff <= 0.5) {
          sniper = 2;
          sniperText = '🎯 Close Sniper (±0.5h):';
        }
      }

      const total = base + 5 + sniper;

      if (projTotal) projTotal.textContent = `+${total} pts`;
      if (projBase) projBase.textContent = `${base} pts`;

      if (projSniperRow && projSniperPts && projSniperLabel) {
        if (sniper > 0) {
          projSniperRow.classList.remove('hidden');
          projSniperLabel.textContent = sniperText;
          projSniperPts.textContent = `+${sniper} pts`;
        } else {
          projSniperRow.classList.add('hidden');
        }
      }
    };
  }

  // Form Submission
  if (completeForm) {
    completeForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-complete-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'FINALIZING...';
      }

      const taskId = (document.getElementById('complete-task-id') as HTMLInputElement)?.value;
      const actualHours = parseFloat(actualHoursInput.value);
      const proofUrlInput = document.getElementById('task-proof-url') as HTMLInputElement;
      const proofUrl = proofUrlInput?.value?.trim() || null;

      if (!taskId) {
        alert('Missing task ID.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Claim Points';
        }
        return;
      }

      try {
        await apiFetch(`/tasks/${taskId}/complete`, {
          method: 'PATCH',
          body: JSON.stringify({
            actual_hours: actualHours,
            proof_url: proofUrl
          })
        });

        completeModal.classList.add('hidden');
        completeForm.reset();
        if (proofUrlInput) proofUrlInput.value = '';
        const projBox = document.getElementById('projected-reward-box');
        if (projBox) projBox.classList.add('hidden');

        // Dispatch global event for listeners
        window.dispatchEvent(new CustomEvent('task-completed', { detail: { taskId, actualHours } }));

        if (onSuccessCallback) {
          await onSuccessCallback();
        }
      } catch (err: any) {
        alert(`Error completing task: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Confirm & Claim Points';
        }
      }
    };
  }
}
