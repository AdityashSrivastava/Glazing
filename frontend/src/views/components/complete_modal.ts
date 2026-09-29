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
    <div id="complete-task-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
      <div class="theme-card w-full max-w-lg relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 shadow-2xl">
        
        <div class="flex justify-between items-center mb-5 pb-4 border-b border-border">
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

        <form id="complete-task-form" class="space-y-4">
          <input type="hidden" id="complete-task-id" />
          <input type="hidden" id="complete-task-est-hours" />
          <input type="hidden" id="complete-task-category" />
          
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
              class="border border-dashed border-border hover:border-accent/60 bg-surface/40 hover:bg-surface/70 rounded-lg p-3 text-center transition-all cursor-pointer relative select-none"
            >
              <input type="file" id="task-proof-file" accept="image/*,.pdf" class="hidden" />
              
              <div id="dropzone-default-content" class="flex flex-col items-center justify-center gap-1 py-1">
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
                  <img id="proof-preview-img" src="" alt="Proof Preview" class="w-12 h-12 object-cover rounded-md border border-accent/30 shadow-sm" />
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
              <div id="proof-upload-spinner" class="hidden flex items-center justify-center gap-2 text-xs text-accent font-mono py-2">
                <svg class="animate-spin h-4 w-4 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                <span>Uploading evidence to storage...</span>
              </div>
            </div>

            <!-- Direct URL / Text Link input -->
            <div class="relative">
              <input 
                type="text" 
                id="task-proof-url" 
                class="theme-input font-mono text-xs pr-14" 
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

            <p class="text-[10px] text-muted leading-relaxed font-mono">
              The system analyses your proof and verifies that it is authentically related to the task to award the +5 pts verification bonus.
            </p>
          </div>

          <!-- Live Gamification Projected Reward -->
          <div id="projected-reward-box" class="p-3.5 rounded-lg border border-accent/20 bg-accent/[0.04] space-y-1.5 hidden">
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

          <button type="submit" id="submit-complete-btn" class="btn-primary w-full mt-2 font-mono tracking-wider text-xs uppercase py-2.5 cursor-pointer">
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
