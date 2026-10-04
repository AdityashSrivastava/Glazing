export function renderCreateTaskModal(): string {
  return `
    <div id="create-task-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200">
      <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-accent/40 shadow-2xl max-h-[92vh] flex flex-col p-4 sm:p-5 overflow-hidden">
        
        <div class="flex justify-between items-center mb-3 pb-3 border-b border-border flex-shrink-0">
          <div>
            <h2 class="text-sm font-bold tracking-wider text-primary uppercase flex items-center gap-2">
              <span>🚀 Initialize New Task</span>
            </h2>
            <p class="text-xs text-muted mt-0.5">Deploy a new operative objective to the squad feed.</p>
          </div>
          <button id="close-modal-btn" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
        </div>

        <form id="create-task-form" class="flex flex-col flex-1 overflow-hidden min-h-0">
          <div class="overflow-y-auto pr-1 space-y-3 flex-1 custom-scrollbar">
            <div>
              <label class="block text-[11px] font-semibold uppercase mb-1 text-muted tracking-wider">Task Title</label>
              <input type="text" id="task-title" required class="theme-input font-medium py-2 text-xs" placeholder="e.g. Implement PaveSentry Model Inference" />
            </div>

            <!-- Visual Time Entry HUD (: format) - Sleek & Compact -->
            <div class="p-2.5 rounded-xl bg-surface/60 border border-border/80">
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-[11px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <span>⏱️</span> Estimated Target (HH : MM)
                </label>
                <span id="create-task-time-equiv" class="text-[11px] font-mono font-bold text-accent">1 hr 00 min (1.00h)</span>
              </div>

              <!-- Compact Digital Clock Display with Steppers -->
              <div class="flex items-center justify-center gap-2 p-2 bg-bg/90 rounded-lg border border-border/70 shadow-inner">
                
                <!-- Hours Box -->
                <div class="flex flex-col items-center">
                  <span class="text-[8px] uppercase font-mono text-muted mb-0.5 font-semibold tracking-wider">Hours</span>
                  <div class="flex items-center">
                    <input 
                      type="number" 
                      id="create-task-hours" 
                      min="0" 
                      max="12" 
                      value="1" 
                      class="w-14 h-9 text-center text-lg font-black font-mono bg-surface rounded-md border border-border focus:border-accent text-primary focus:outline-none transition-all shadow-sm"
                    />
                    <div class="flex flex-col ml-1 gap-0.5">
                      <button type="button" id="create-btn-inc-hour" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">+</button>
                      <button type="button" id="create-btn-dec-hour" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">-</button>
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
                      id="create-task-minutes" 
                      min="0" 
                      max="59" 
                      value="0" 
                      class="w-14 h-9 text-center text-lg font-black font-mono bg-surface rounded-md border border-border focus:border-accent text-primary focus:outline-none transition-all shadow-sm"
                    />
                    <div class="flex flex-col ml-1 gap-0.5">
                      <button type="button" id="create-btn-inc-min" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">+</button>
                      <button type="button" id="create-btn-dec-min" class="w-4 h-4 flex items-center justify-center rounded bg-surface hover:bg-border text-muted hover:text-primary text-[10px] font-bold transition-colors cursor-pointer">-</button>
                    </div>
                  </div>
                </div>

              </div>

              <!-- Quick Add & Presets in a Compact Row -->
              <div class="flex flex-wrap items-center gap-1 mt-1.5 pt-1.5 border-t border-border/40 text-[10px] font-mono">
                <span class="text-muted uppercase mr-0.5">Quick:</span>
                <button type="button" class="create-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="15">+15m</button>
                <button type="button" class="create-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="30">+30m</button>
                <button type="button" class="create-quick-add px-1.5 py-0.5 rounded bg-surface hover:bg-accent/15 hover:text-accent border border-border text-muted transition-colors cursor-pointer" data-mins="60">+1h</button>
                <div class="h-2.5 w-[1px] bg-border mx-0.5"></div>
                <button type="button" class="create-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="0" data-m="25">25m</button>
                <button type="button" class="create-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="0" data-m="50">50m</button>
                <button type="button" class="create-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="1" data-m="30">1h 30m</button>
                <button type="button" class="create-preset-set px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20 font-semibold hover:bg-accent/20 transition-colors cursor-pointer" data-h="2" data-m="0">2h</button>
              </div>

              <!-- Synchronized Hidden Input for API payload -->
              <input type="hidden" id="task-est" name="estimated_hours" value="1.0" required />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase mb-1 text-muted tracking-wider">Link Squad Objective (Sets Domain Rate)</label>
              <select id="task-goal-id" class="theme-input font-medium py-2 text-xs">
                <option value="">-- NO LINKED OBJECTIVE (Base: 5 pts/hr) --</option>
              </select>
              <p class="text-[10px] text-muted mt-1 font-mono">Rates: DSA (15 pts/h) • Dev (12.5 pts/h) • College (10 pts/h) • Base (5 pts/h)</p>
            </div>

            <div class="flex items-center space-x-2.5 pt-1">
              <input type="checkbox" id="task-private" class="rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-surface w-4 h-4 cursor-pointer" />
              <label class="text-[11px] uppercase text-muted tracking-wider cursor-pointer select-none" for="task-private">Mark as Classified (Redacted from peers)</label>
            </div>
          </div>

          <!-- Docked Sticky Submit Footer (Always Visible!) -->
          <div class="pt-3 border-t border-border/70 flex-shrink-0 bg-surface/50">
            <button type="submit" id="submit-task-btn" class="btn-primary w-full font-mono tracking-wider text-xs uppercase py-2.5 shadow-md">
              Deploy Task to Field
            </button>
          </div>
        </form>

      </div>
    </div>
  `;
}
