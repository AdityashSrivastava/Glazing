export function renderCreateTaskModal(): string {
  return `
    <div id="create-task-modal" class="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4 transition-opacity duration-200">
      <div class="theme-card w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200 border-accent/40">
        
        <div class="flex justify-between items-center mb-6 pb-4 border-b border-border">
          <div>
            <h2 class="text-sm font-bold tracking-wider text-primary uppercase flex items-center gap-2">
              <span>🚀 Initialize New Task</span>
            </h2>
            <p class="text-xs text-muted mt-0.5">Deploy a new operative objective to the squad feed.</p>
          </div>
          <button id="close-modal-btn" class="text-muted hover:text-primary transition-colors text-lg leading-none">&times;</button>
        </div>

        <form id="create-task-form" class="space-y-4">
          <div>
            <label class="block text-[11px] font-semibold uppercase mb-1.5 text-muted tracking-wider">Task Title</label>
            <input type="text" id="task-title" required class="theme-input font-medium" placeholder="e.g. Implement PaveSentry Model Inference" />
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase mb-1.5 text-muted tracking-wider">Estimated Hours</label>
            <input type="number" id="task-est" required min="0.1" max="12" step="0.1" class="theme-input font-mono" placeholder="2.5" />
            <p class="text-[10px] text-muted mt-1">Estimated duration for squad scheduling and active execution.</p>
          </div>

          <div>
            <label class="block text-[11px] font-semibold uppercase mb-1.5 text-muted tracking-wider">Link Squad Objective (Sets Domain Rate)</label>
            <select id="task-goal-id" class="theme-input font-medium">
              <option value="">-- NO LINKED OBJECTIVE (Base: 5 pts/hr) --</option>
            </select>
            <p class="text-[10px] text-muted mt-1">Domain Rates: DSA (15 pts/h) • Development (12.5 pts/h) • College Work (10 pts/h) • Base (5 pts/h)</p>
          </div>

          <div class="flex items-center space-x-3 pt-2">
            <input type="checkbox" id="task-private" class="rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-surface w-4 h-4 cursor-pointer" />
            <label class="text-[11px] uppercase text-muted tracking-wider cursor-pointer select-none" for="task-private">Mark as Classified (Redacted from peers)</label>
          </div>

          <button type="submit" id="submit-task-btn" class="btn-primary w-full mt-4 font-mono tracking-wider text-xs uppercase py-2.5">
            Deploy Task to Field
          </button>
        </form>

      </div>
    </div>
  `;
}
