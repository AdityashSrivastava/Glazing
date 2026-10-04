import { apiFetch, uploadProofFile } from '../../api';

export interface CompleteModalParams {
  taskId: string;
  title: string;
  estHours: number;
  trackedTimerMinutes?: number;
  trackedTimerHours?: number;
  category?: string | null;
  goalTitle?: string | null;
}

export function renderCompleteModal(): string {
  return `
    <div id="complete-task-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200">
      <div class="theme-card w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 shadow-2xl max-h-[92vh] flex flex-col p-4 sm:p-5 overflow-hidden">
        
        <div class="flex justify-between items-center mb-3 pb-3 border-b border-border flex-shrink-0">
          <div>
            <h2 class="text-sm font-bold tracking-wider text-primary uppercase flex items-center gap-2">
              <span>⚡ Finalize Task Execution</span>
            </h2>
            <div class="flex items-center gap-2 mt-0.5">
              <p id="complete-modal-task-title" class="text-xs text-muted truncate max-w-[280px]">Task title</p>
              <span id="complete-modal-domain-tag" class="hidden text-[10px] font-mono px-1.5 py-0.2 rounded border">Domain</span>
            </div>
          </div>
          <button id="close-complete-modal-btn" type="button" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
        </div>

        <form id="complete-task-form" class="flex flex-col flex-1 overflow-hidden min-h-0">
          <input type="hidden" id="complete-task-id" />
          <input type="hidden" id="complete-task-est-hours" />
          <input type="hidden" id="complete-task-category" />
          
          <div class="overflow-y-auto pr-1 space-y-2.5 flex-1 custom-scrollbar">
            
            <div class="p-2 px-3 rounded-lg bg-surface/60 border border-border/80 flex items-center justify-between text-xs">
              <span class="text-muted">Estimated Target:</span>
              <span id="complete-modal-est-display" class="font-mono font-bold text-primary">0.0 hrs</span>
            </div>

            <!-- Pomodoro Timer Tracked Feed Notification -->
            <div id="complete-timer-feed-banner" class="hidden p-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs animate-in fade-in">
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

            <!-- Visual Time Entry HUD (: format) - Sleek & Compact -->
            <div class="p-2.5 rounded-xl bg-surface/60 border border-border/80">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-[11px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <span>⏱️</span> Actual Time Dedicated (HH : MM)
                </label>
                <span id="task-time-display-equiv" class="text-[11px] font-mono font-bold text-accent">1 hr 00 min (1.00h)</span>
              </div>

              <!-- Compact Digital Clock Display with Steppers -->
              <div class="flex items-center justify-center gap-2 p-2 bg-bg/90 rounded-lg border border-border/70 shadow-inner">
                
                <!-- Hours Box -->
                <div class="flex flex-col items-center">
                  <span class="text-[8px] uppercase font-mono text-muted mb-0.5 font-semibold tracking-wider">Hours</span>
                  <div class="flex items-center">
                    <input 
                      type="number" 
                      id="task-time-hours" 
                      min="0" 
                      max="12" 
                      value="1" 
                      class="w-14 h-9 text-center text-lg font-black font-mono bg-surface rounded-md border border-border focus:border-accent text-primary focus:outline-none transition-all shadow-sm"
                    />
                    <div class="flex flex-col ml-1 gap-0.5">
                      <button type="button" id="btn-inc-hour" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">+</button>
                      <button type="button" id="btn-dec-hour" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">-</button>
                    </div>
                  </div>
                </div>

                <!-- Stylized Colon Separator -->
                <div class="text-xl font-black text-accent font-mono pt-2.5 select-none animate-pulse">:</div>

                <!-- Minutes Box -->
                <div class="flex flex-col items-center">
                  <span class="text-[8px] uppercase font-mono text-muted mb-0.5 font-semibold tracking-wider">Minutes</span>
                  <div class="flex items-center">
                    <input 
                      type="number" 
                      id="task-time-minutes" 
                      min="0" 
                      max="59" 
                      value="0" 
                      class="w-14 h-9 text-center text-lg font-black font-mono bg-surface rounded-md border border-border focus:border-accent text-primary focus:outline-none transition-all shadow-sm"
                    />
                    <div class="flex flex-col ml-1 gap-0.5">
                      <button type="button" id="btn-inc-min" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">+</button>
                      <button type="button" id="btn-dec-min" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">-</button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Quick Add & Presets in a Compact Row -->
              <div class="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-border/40 text-[10px] font-mono">
                <span class="text-muted uppercase mr-0.5">Quick:</span>
                <button type="button" class="time-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="15">+15m</button>
                <button type="button" class="time-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="30">+30m</button>
                <button type="button" class="time-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="60">+1h</button>
                <div class="h-2.5 w-[1px] bg-border mx-0.5"></div>
                <button type="button" class="time-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="0" data-m="25">25m</button>
                <button type="button" class="time-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="0" data-m="50">50m</button>
                <button type="button" class="time-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="1" data-m="15">1h 15m</button>
                <button type="button" class="time-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="2" data-m="0">2h</button>
              </div>

              <!-- Synchronized Hidden Input for API payload -->
              <input type="hidden" id="task-actual-hours" name="actual_hours" value="1.0" />
            </div>

            <!-- Proof of Work Multi-Modal Ingestion -->
            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label class="block text-[11px] font-semibold uppercase text-muted tracking-wider">
                  Proof of Work / Verification
                </label>
                <span id="complete-proof-badge" class="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20 font-semibold">
                  +5 pts upon verification
                </span>
              </div>

              <!-- Drag & Drop / Click Upload / Paste Box -->
              <div 
                id="proof-dropzone" 
                class="border border-dashed border-border hover:border-accent/60 bg-surface/40 hover:bg-surface/70 rounded-lg p-2.5 text-center transition-all cursor-pointer relative select-none"
              >
                <input type="file" id="task-proof-file" accept="image/*,.pdf" class="hidden" />
                
                <div id="dropzone-default-content" class="flex flex-col items-center justify-center gap-0.5 py-0.5">
                  <div class="flex items-center gap-2 text-xs font-semibold text-primary">
                    <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span>Click to Upload Screenshot or Drop Image</span>
                  </div>
                  <p class="text-[10px] text-muted font-mono">
                    Or press <kbd class="px-1 py-0.5 rounded bg-surface border border-border text-[9px] text-primary">Ctrl+V</kbd> to paste clipboard screenshot
                  </p>
                </div>

                <!-- Preview container if image uploaded -->
                <div id="proof-preview-container" class="hidden flex items-center justify-between gap-3 text-left">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <img id="proof-preview-img" src="" alt="Proof Preview" class="w-10 h-10 object-cover rounded-md border border-accent/30 shadow-sm" />
                    <div class="min-w-0">
                      <p id="proof-filename" class="text-xs font-semibold text-primary truncate max-w-[220px]">screenshot.png</p>
                      <p class="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                        <span>✓ Secure Cloud Upload Verified</span>
                      </p>
                    </div>
                  </div>
                  <button type="button" id="remove-proof-btn" class="text-xs font-bold text-muted hover:text-red-400 px-2 py-1 rounded hover:bg-surface transition-colors" title="Remove screenshot">✕ Remove</button>
                </div>

                <!-- Uploading spinner -->
                <div id="proof-upload-spinner" class="hidden flex items-center justify-center gap-2 text-xs text-accent font-mono py-1.5">
                  <svg class="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  <span>Uploading evidence to storage...</span>
                </div>
              </div>

              <!-- Direct URL / Text Link input -->
              <div class="relative">
                <input 
                  type="text" 
                  id="task-proof-url" 
                  class="theme-input font-mono text-xs pr-14 py-1.5" 
                  placeholder="Or paste URL (GitHub PR / commit link, LeetCode, Google Doc)" 
                />
                <button 
                  type="button" 
                  id="paste-url-btn" 
                  class="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-border text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  Paste
                </button>
              </div>
            </div>

            <!-- Live Gamification Projected Reward -->
            <div id="projected-reward-box" class="p-2.5 rounded-lg border border-accent/20 bg-accent/[0.04] space-y-1 hidden">
              <div class="flex items-center justify-between text-xs font-semibold text-primary">
                <span>Projected Point Gain:</span>
                <span id="proj-total-pts" class="font-mono font-bold text-accent text-sm">+0 pts</span>
              </div>
              <div class="text-[10px] text-muted space-y-0.5 font-mono">
                <div class="flex justify-between">
                  <span id="proj-base-label">Base Points:</span>
                  <span id="proj-base-pts">0 pts</span>
                </div>
                <div class="flex justify-between" id="proj-proof-row">
                  <span>Proof of Work Bonus:</span>
                  <span id="proj-proof-pts" class="text-emerald-400">+5 pts</span>
                </div>
              </div>
            </div>

          </div>

          <!-- Docked Sticky Submit Footer (Always Visible!) -->
          <div class="pt-3 border-t border-border/70 flex-shrink-0 bg-surface/50">
            <button type="submit" id="submit-complete-btn" class="btn-primary w-full font-mono tracking-wider text-xs uppercase py-2.5 cursor-pointer shadow-md">
              Confirm & Claim Points
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}

export function openCompleteTaskModal(params: CompleteModalParams) {
  const modal = document.getElementById('complete-task-modal');
  const taskIdInput = document.getElementById('complete-task-id') as HTMLInputElement;
  const categoryHidden = document.getElementById('complete-task-category') as HTMLInputElement;
  const titleDisplay = document.getElementById('complete-modal-task-title');
  const domainTag = document.getElementById('complete-modal-domain-tag');
  const estDisplay = document.getElementById('complete-modal-est-display');
  const estHidden = document.getElementById('complete-task-est-hours') as HTMLInputElement;
  const actInput = document.getElementById('task-actual-hours') as HTMLInputElement;
  const timerBanner = document.getElementById('complete-timer-feed-banner');
  const timerText = document.getElementById('complete-timer-feed-text');
  const proofUrlInput = document.getElementById('task-proof-url') as HTMLInputElement;
  const previewContainer = document.getElementById('proof-preview-container');
  const defaultDropzone = document.getElementById('dropzone-default-content');

  if (!modal || !taskIdInput) return;

  taskIdInput.value = params.taskId;
  if (categoryHidden) categoryHidden.value = params.category || '';
  if (titleDisplay) titleDisplay.textContent = params.title;
  if (estDisplay) estDisplay.textContent = `${params.estHours} hrs`;
  if (estHidden) estHidden.value = String(params.estHours);

  // Reset proof upload states
  if (proofUrlInput) proofUrlInput.value = '';
  if (previewContainer) previewContainer.classList.add('hidden');
  if (defaultDropzone) defaultDropzone.classList.remove('hidden');

  // Display domain badge if objective linked
  if (domainTag) {
    if (params.category) {
      domainTag.classList.remove('hidden');
      const cat = params.category;
      let badgeStyle = 'text-primary border-border bg-surface';
      if (cat.toLowerCase().includes('dsa')) {
        badgeStyle = 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';
      } else if (cat.toLowerCase().includes('dev')) {
        badgeStyle = 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      } else if (cat.toLowerCase().includes('college') || cat.toLowerCase().includes('work')) {
        badgeStyle = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      }
      domainTag.className = `text-[10px] font-mono px-1.5 py-0.5 rounded border ${badgeStyle}`;
      domainTag.textContent = cat;
    } else {
      domainTag.classList.add('hidden');
    }
  }

  const timerMins = params.trackedTimerMinutes || 0;
  let initHours = 1;
  let initMins = 0;

  if (timerMins > 0) {
    if (timerBanner) timerBanner.classList.remove('hidden');
    initHours = Math.floor(timerMins / 60);
    initMins = timerMins % 60;
    if (timerText) timerText.textContent = `${initHours}h ${String(initMins).padStart(2, '0')}m (${timerMins} mins timer feed)`;
  } else {
    if (timerBanner) timerBanner.classList.add('hidden');
    const totalEstMins = Math.round((params.estHours || 1.0) * 60);
    initHours = Math.floor(totalEstMins / 60);
    initMins = totalEstMins % 60;
  }

  // Populate digital inputs
  const timeHoursInput = document.getElementById('task-time-hours') as HTMLInputElement;
  const timeMinsInput = document.getElementById('task-time-minutes') as HTMLInputElement;
  const timeEquivDisplay = document.getElementById('task-time-display-equiv');

  if (timeHoursInput) timeHoursInput.value = String(initHours);
  if (timeMinsInput) timeMinsInput.value = String(initMins);

  const decHours = Math.round((initHours + (initMins / 60.0)) * 100) / 100;
  if (actInput) {
    actInput.value = String(Math.max(0.05, decHours));
    actInput.dispatchEvent(new Event('input'));
  }
  if (timeEquivDisplay) {
    timeEquivDisplay.textContent = `${initHours} hr ${String(initMins).padStart(2, '0')} min (${decHours.toFixed(2)}h)`;
  }

  modal.classList.remove('hidden');
}

export function setupCompleteModalLogic(onSuccessCallback?: () => void | Promise<void>) {
  const completeModal = document.getElementById('complete-task-modal') as HTMLDivElement;
  const closeCompleteBtn = document.getElementById('close-complete-modal-btn') as HTMLButtonElement;
  const completeForm = document.getElementById('complete-task-form') as HTMLFormElement;
  const actualHoursInput = document.getElementById('task-actual-hours') as HTMLInputElement;
  const categoryHidden = document.getElementById('complete-task-category') as HTMLInputElement;

  const proofDropzone = document.getElementById('proof-dropzone') as HTMLDivElement;
  const proofFileInput = document.getElementById('task-proof-file') as HTMLInputElement;
  const proofUrlInput = document.getElementById('task-proof-url') as HTMLInputElement;
  const defaultContent = document.getElementById('dropzone-default-content') as HTMLDivElement;
  const previewContainer = document.getElementById('proof-preview-container') as HTMLDivElement;
  const previewImg = document.getElementById('proof-preview-img') as HTMLImageElement;
  const previewFilename = document.getElementById('proof-filename') as HTMLElement;
  const removeProofBtn = document.getElementById('remove-proof-btn') as HTMLButtonElement;
  const uploadSpinner = document.getElementById('proof-upload-spinner') as HTMLDivElement;
  const pasteUrlBtn = document.getElementById('paste-url-btn') as HTMLButtonElement;

  if (!completeModal) return;

  // Close handlers
  if (closeCompleteBtn) {
    closeCompleteBtn.onclick = () => completeModal.classList.add('hidden');
  }
  completeModal.onclick = (e) => {
    if (e.target === completeModal) completeModal.classList.add('hidden');
  };

  // Helper: Live Reward Projection calculation
  const updateProjection = () => {
    const act = parseFloat(actualHoursInput?.value || '0');
    const category = categoryHidden?.value || '';
    const projBox = document.getElementById('projected-reward-box');
    const projTotal = document.getElementById('proj-total-pts');
    const projBase = document.getElementById('proj-base-pts');
    const projBaseLabel = document.getElementById('proj-base-label');
    const projProofPts = document.getElementById('proj-proof-pts');

    if (isNaN(act) || act <= 0) {
      if (projBox) projBox.classList.add('hidden');
      return;
    }

    if (projBox) projBox.classList.remove('hidden');

    // Domain rate mapping: DSA = 15, Development = 12.5, College Work = 10, Base = 5
    let rate = 5.0;
    let domainName = 'Base';
    const catLower = category.toLowerCase();
    if (catLower.includes('dsa')) {
      rate = 15.0;
      domainName = 'DSA';
    } else if (catLower.includes('dev') || catLower.includes('coding') || catLower.includes('career')) {
      rate = 12.5;
      domainName = 'Development';
    } else if (catLower.includes('college') || catLower.includes('studies') || catLower.includes('learning') || catLower.includes('work')) {
      rate = 10.0;
      domainName = 'College Work';
    }

    const base = Math.round(act * rate);
    const hasProof = Boolean(proofUrlInput?.value?.trim());
    const proofBonus = hasProof ? 5 : 0;
    const total = base + proofBonus;

    if (projTotal) projTotal.textContent = `+${total} pts`;
    if (projBaseLabel) projBaseLabel.textContent = `${domainName} (${rate} pts/hr):`;
    if (projBase) projBase.textContent = `${base} pts`;
    if (projProofPts) {
      projProofPts.textContent = hasProof ? '+5 pts (Pending System Analysis)' : '+0 pts (Provide proof to earn +5 pts)';
      projProofPts.className = hasProof ? 'text-emerald-400 font-semibold' : 'text-muted';
    }
  };

  const timeHoursInput = document.getElementById('task-time-hours') as HTMLInputElement;
  const timeMinsInput = document.getElementById('task-time-minutes') as HTMLInputElement;
  const timeEquivDisplay = document.getElementById('task-time-display-equiv');

  const setDigitalTime = (h: number, m: number) => {
    let hours = Math.max(0, Math.min(12, Math.floor(isNaN(h) ? 0 : h)));
    let minutes = Math.max(0, Math.min(59, Math.floor(isNaN(m) ? 0 : m)));
    
    // Minimal safety bound
    if (hours === 0 && minutes < 3) {
      minutes = 5;
    }

    if (timeHoursInput) timeHoursInput.value = String(hours);
    if (timeMinsInput) timeMinsInput.value = String(minutes);

    const totalDec = Math.round((hours + (minutes / 60.0)) * 100) / 100;
    if (actualHoursInput) {
      actualHoursInput.value = String(Math.max(0.05, totalDec));
    }
    if (timeEquivDisplay) {
      timeEquivDisplay.textContent = `${hours} hr ${String(minutes).padStart(2, '0')} min (${totalDec.toFixed(2)}h)`;
    }
    updateProjection();
  };

  if (timeHoursInput) {
    timeHoursInput.addEventListener('input', () => {
      setDigitalTime(parseInt(timeHoursInput.value) || 0, parseInt(timeMinsInput?.value || '0') || 0);
    });
  }

  if (timeMinsInput) {
    timeMinsInput.addEventListener('input', () => {
      let m = parseInt(timeMinsInput.value) || 0;
      let h = parseInt(timeHoursInput?.value || '0') || 0;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
      setDigitalTime(h, m);
    });
  }

  // Stepper buttons
  document.getElementById('btn-inc-hour')?.addEventListener('click', () => {
    const curH = parseInt(timeHoursInput?.value || '0') || 0;
    const curM = parseInt(timeMinsInput?.value || '0') || 0;
    setDigitalTime(curH + 1, curM);
  });

  document.getElementById('btn-dec-hour')?.addEventListener('click', () => {
    const curH = parseInt(timeHoursInput?.value || '0') || 0;
    const curM = parseInt(timeMinsInput?.value || '0') || 0;
    setDigitalTime(Math.max(0, curH - 1), curM);
  });

  document.getElementById('btn-inc-min')?.addEventListener('click', () => {
    const curH = parseInt(timeHoursInput?.value || '0') || 0;
    const curM = parseInt(timeMinsInput?.value || '0') || 0;
    let nextM = curM + 5;
    let nextH = curH;
    if (nextM >= 60) {
      nextH += 1;
      nextM -= 60;
    }
    setDigitalTime(nextH, nextM);
  });

  document.getElementById('btn-dec-min')?.addEventListener('click', () => {
    const curH = parseInt(timeHoursInput?.value || '0') || 0;
    const curM = parseInt(timeMinsInput?.value || '0') || 0;
    let nextM = curM - 5;
    let nextH = curH;
    if (nextM < 0) {
      if (nextH > 0) {
        nextH -= 1;
        nextM += 60;
      } else {
        nextM = 0;
      }
    }
    setDigitalTime(nextH, nextM);
  });

  // Quick Add buttons (+15m, +30m, +1h)
  document.querySelectorAll('.time-quick-add').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const minsToAdd = parseInt((e.currentTarget as HTMLElement).getAttribute('data-mins') || '15') || 15;
      const curH = parseInt(timeHoursInput?.value || '0') || 0;
      const curM = parseInt(timeMinsInput?.value || '0') || 0;
      const totalM = (curH * 60) + curM + minsToAdd;
      setDigitalTime(Math.floor(totalM / 60), totalM % 60);
    });
  });

  // Presets (25m, 50m, 1h 15m, 2h 00m)
  document.querySelectorAll('.time-preset-set').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const h = parseInt((e.currentTarget as HTMLElement).getAttribute('data-h') || '0') || 0;
      const m = parseInt((e.currentTarget as HTMLElement).getAttribute('data-m') || '0') || 0;
      setDigitalTime(h, m);
    });
  });

  if (actualHoursInput) {
    actualHoursInput.oninput = updateProjection;
  }
  if (proofUrlInput) {
    proofUrlInput.oninput = updateProjection;
  }

  // File Upload Helper
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (defaultContent) defaultContent.classList.add('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (uploadSpinner) uploadSpinner.classList.remove('hidden');

    try {
      const res = await uploadProofFile(file);
      if (proofUrlInput) {
        proofUrlInput.value = res.url;
      }
      if (previewImg) previewImg.src = res.url;
      if (previewFilename) previewFilename.textContent = res.filename || file.name;
      if (uploadSpinner) uploadSpinner.classList.add('hidden');
      if (previewContainer) previewContainer.classList.remove('hidden');
      updateProjection();
    } catch (err: any) {
      alert(`Proof upload failed: ${err.message}`);
      if (uploadSpinner) uploadSpinner.classList.add('hidden');
      if (defaultContent) defaultContent.classList.remove('hidden');
    }
  };

  // Dropzone click -> trigger hidden file input
  if (proofDropzone && proofFileInput) {
    proofDropzone.onclick = (e) => {
      if ((e.target as HTMLElement).closest('#remove-proof-btn')) return;
      proofFileInput.click();
    };

    proofFileInput.onchange = async () => {
      if (proofFileInput.files && proofFileInput.files[0]) {
        await handleFileUpload(proofFileInput.files[0]);
      }
    };

    proofDropzone.ondragover = (e) => {
      e.preventDefault();
      proofDropzone.classList.add('border-accent');
    };
    proofDropzone.ondragleave = () => {
      proofDropzone.classList.remove('border-accent');
    };
    proofDropzone.ondrop = async (e) => {
      e.preventDefault();
      proofDropzone.classList.remove('border-accent');
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        await handleFileUpload(e.dataTransfer.files[0]);
      }
    };
  }

  // Remove uploaded proof
  if (removeProofBtn) {
    removeProofBtn.onclick = (e) => {
      e.stopPropagation();
      if (proofUrlInput) proofUrlInput.value = '';
      if (proofFileInput) proofFileInput.value = '';
      if (previewContainer) previewContainer.classList.add('hidden');
      if (defaultContent) defaultContent.classList.remove('hidden');
      updateProjection();
    };
  }

  // Paste URL button
  if (pasteUrlBtn && proofUrlInput) {
    pasteUrlBtn.onclick = async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.readText) {
          const text = await navigator.clipboard.readText();
          if (text) {
            proofUrlInput.value = text.trim();
            updateProjection();
          }
        } else {
          proofUrlInput.focus();
        }
      } catch {
        proofUrlInput.focus();
      }
    };
  }

  // Global clipboard paste handler for modal (Ctrl+V with image)
  window.addEventListener('paste', async (e: ClipboardEvent) => {
    if (completeModal.classList.contains('hidden')) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          await handleFileUpload(file);
          break;
        }
      }
    }
  });

  // Form Submission
  if (completeForm) {
    completeForm.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-complete-btn') as HTMLButtonElement;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'SYSTEM VERIFYING & FINALIZING...';
      }

      const taskId = (document.getElementById('complete-task-id') as HTMLInputElement)?.value;
      const actualHours = parseFloat(actualHoursInput.value);
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
        const res = await apiFetch(`/tasks/${taskId}/complete`, {
          method: 'PATCH',
          body: JSON.stringify({
            actual_hours: actualHours,
            proof_url: proofUrl
          })
        });

        completeModal.classList.add('hidden');
        completeForm.reset();
        if (proofUrlInput) proofUrlInput.value = '';
        if (previewContainer) previewContainer.classList.add('hidden');
        if (defaultContent) defaultContent.classList.remove('hidden');
        const projBox = document.getElementById('projected-reward-box');
        if (projBox) projBox.classList.add('hidden');

        // Dispatch global event for listeners
        window.dispatchEvent(new CustomEvent('task-completed', { detail: { taskId, actualHours, result: res } }));

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
