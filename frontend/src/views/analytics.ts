import { apiFetch } from '../api';
import Chart from 'chart.js/auto';
import { renderNavbar, setupNavbarLogic } from './components/navbar';

export function renderAnalytics(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col">
      ${renderNavbar('analytics')}

      <!-- Main Content -->
      <main class="flex-1 w-full max-w-[1240px] mx-auto p-6 md:p-10 space-y-8">
        
        <!-- Header Banner -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-mono uppercase tracking-wider mb-2.5">
              <span class="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
              <span>Operative Telemetry // Matrix v2.0</span>
            </div>
            <h2 class="text-3xl md:text-4xl font-bold text-primary tracking-tight">Skill Matrix Radar</h2>
            <p class="text-body text-sm mt-1">Multi-domain competency tracking and objective mastery distribution.</p>
          </div>

          <!-- Top Stats Pill Cards -->
          <div class="flex items-center gap-3">
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] font-mono text-muted uppercase tracking-wider">Total Points Logged</div>
              <div id="kpi-total-points" class="text-xl font-bold text-accent font-mono mt-0.5">--</div>
            </div>
            <div class="px-5 py-3 rounded-2xl bg-surface border border-border text-left shadow-sm">
              <div class="text-[10px] font-mono text-muted uppercase tracking-wider">Primary Discipline</div>
              <div id="kpi-top-domain" class="text-xl font-bold text-primary font-mono mt-0.5">--</div>
            </div>
          </div>
        </div>

        <!-- 2-Column Bento Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <!-- Left Column: Radar Chart Box (7 cols) -->
          <div class="lg:col-span-7 theme-card p-6 md:p-8 flex flex-col justify-between relative overflow-hidden">
            <div class="flex items-center justify-between pb-4 mb-4 border-b border-border/70">
              <div class="flex items-center gap-2.5">
                <span class="w-2.5 h-2.5 rounded-full bg-accent inline-block"></span>
                <h3 class="text-xs font-semibold uppercase tracking-wider text-primary">Domain Spectrum Radar</h3>
              </div>
              <span class="text-[10px] font-mono text-muted uppercase px-2 py-0.5 rounded bg-surface border border-border">
                Live Calibration
              </span>
            </div>

            <!-- Loading State -->
            <div id="radar-loading" class="data-text text-muted animate-pulse flex flex-col items-center justify-center py-28 text-center">
              <div class="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3"></div>
              <span>Calibrating radar matrix...</span>
            </div>

            <!-- Error State -->
            <div id="radar-error" class="hidden data-text text-rose-500 py-24 text-center"></div>

            <!-- Perfectly Constrained Radar Canvas Container -->
            <div id="radar-canvas-container" class="relative w-full max-w-[360px] aspect-square mx-auto flex items-center justify-center my-2 hidden">
              <canvas id="radarChart"></canvas>
            </div>

            <!-- Zero State Banner (if no points at all) -->
            <div id="radar-empty-note" class="hidden text-center py-2 text-xs font-mono text-muted bg-surface/50 border border-border/50 rounded-xl mt-3 p-3">
              Baseline radar displayed. Finalize tasks under linked objectives to expand your polygon.
            </div>

            <div class="flex items-center justify-between text-[11px] text-muted font-mono pt-4 mt-2 border-t border-border/60">
              <span>AXIS: 5 CORE DOMAINS</span>
              <span>SCALE: LINEAR PT AGGREGATION</span>
            </div>
          </div>

          <!-- Right Column: Domain Proficiency Breakdown (5 cols) -->
          <div class="lg:col-span-5 space-y-5">
            <div class="theme-card p-6 md:p-7">
              <div class="flex items-center justify-between pb-4 mb-5 border-b border-border/70">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-primary flex items-center gap-2">
                  <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Domain Competency Metrics
                </h3>
                <span class="text-[10px] font-mono text-muted">Tier Status</span>
              </div>

              <!-- List of Domains with Progress Bars -->
              <div id="domains-breakdown-list" class="space-y-4">
                <div class="text-xs text-muted data-text animate-pulse">Loading competency breakdown...</div>
              </div>
            </div>

            <!-- Tactical Directive Card -->
            <div class="theme-card p-5 border-l-4 border-l-accent bg-accent/[0.03] space-y-2">
              <div class="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                <svg class="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Operative Intel</span>
              </div>
              <p id="tactical-directive-msg" class="text-[12px] text-body leading-relaxed">
                Skill balance increases your versatility. When you complete tasks with high sniper accuracy or claim peer bounties, points automatically amplify your domain rank.
              </p>
            </div>
          </div>

        </div>

      </main>
    </div>
  `;
}

export function setupAnalyticsLogic(navigateFn: (route: string) => void) {
  setupNavbarLogic(navigateFn);
  fetchAndRenderRadar();
}

const DOMAIN_CONFIG: Record<string, { color: string; bg: string; code: string }> = {
  'CODING': { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', code: 'COD' },
  'FITNESS': { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', code: 'FIT' },
  'LEARNING': { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', code: 'LRN' },
  'CAREER': { color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', code: 'CAR' },
  'LIFE': { color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)', code: 'LIF' },
};

function getTier(points: number): { label: string; badgeClass: string } {
  if (points >= 150) return { label: 'Tier IV: Apex', badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30' };
  if (points >= 75)  return { label: 'Tier III: Specialist', badgeClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
  if (points >= 25)  return { label: 'Tier II: Adept', badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  if (points > 0)    return { label: 'Tier I: Apprentice', badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  return { label: 'Unranked', badgeClass: 'text-muted bg-surface border-border' };
}

async function fetchAndRenderRadar() {
  const loading = document.getElementById('radar-loading');
  const errorDiv = document.getElementById('radar-error');
  const canvasContainer = document.getElementById('radar-canvas-container');
  const canvas = document.getElementById('radarChart') as HTMLCanvasElement;
  const breakdownContainer = document.getElementById('domains-breakdown-list');
  const emptyNote = document.getElementById('radar-empty-note');
  const kpiTotal = document.getElementById('kpi-total-points');
  const kpiTop = document.getElementById('kpi-top-domain');
  const directiveMsg = document.getElementById('tactical-directive-msg');

  try {
    const data = await apiFetch('/analytics/radar');

    let rawList: { domain: string; total_points: number }[] = [];

    if (Array.isArray(data)) {
      rawList = data.map((item: any) => ({
        domain: String(item.domain || item.label || 'Unknown').toUpperCase(),
        total_points: Number(item.total_points ?? item.points ?? 0)
      }));
    } else if (data && typeof data === 'object' && Array.isArray(data.labels)) {
      rawList = data.labels.map((l: string, i: number) => ({
        domain: String(l).toUpperCase(),
        total_points: Number(data.data?.[i] ?? 0)
      }));
    }

    // Standardize 5 default domains if missing
    const standardDomains = ['CODING', 'FITNESS', 'LEARNING', 'CAREER', 'LIFE'];
    const domainMap = new Map<string, number>();
    standardDomains.forEach(d => domainMap.set(d, 0));
    rawList.forEach(item => domainMap.set(item.domain, item.total_points));

    const labels = Array.from(domainMap.keys());
    const points = Array.from(domainMap.values());
    const totalPoints = points.reduce((acc, val) => acc + val, 0);

    // Update KPI badges
    if (kpiTotal) kpiTotal.textContent = `${totalPoints} pts`;

    let topDomain = 'None';
    let maxPoints = -1;
    labels.forEach((label, idx) => {
      if (points[idx] > maxPoints && points[idx] > 0) {
        maxPoints = points[idx];
        topDomain = `${label.charAt(0) + label.slice(1).toLowerCase()} (${points[idx]} pts)`;
      }
    });
    if (kpiTop) kpiTop.textContent = topDomain === 'None' ? 'Unranked' : topDomain;

    // Tactical directive message
    if (directiveMsg) {
      if (totalPoints === 0) {
        directiveMsg.textContent = "Your telemetry matrix is waiting for task logs. Create an objective under Goals and mark tasks complete to populate your radar.";
      } else if (maxPoints > totalPoints * 0.7) {
        directiveMsg.textContent = `High concentration detected in ${topDomain.split(' ')[0]}. Diversify your objectives into untamed domains to create a well-rounded operational profile.`;
      } else {
        directiveMsg.textContent = `Balanced operative profile detected across active domains. Maintain consistent execution to push all domains toward Apex tier.`;
      }
    }

    // Render Domains Breakdown List
    if (breakdownContainer) {
      breakdownContainer.innerHTML = labels.map((label, idx) => {
        const pts = points[idx];
        const percent = totalPoints > 0 ? Math.round((pts / totalPoints) * 100) : 0;
        const config = DOMAIN_CONFIG[label] || { color: '#635bff', bg: 'rgba(99,91,255,0.15)', code: label.slice(0, 3) };
        const tier = getTier(pts);

        return `
          <div class="group p-3 rounded-xl hover:bg-surface/80 transition-colors border border-transparent hover:border-border/60">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold" style="background-color: ${config.bg}; color: ${config.color};">
                  ${config.code}
                </span>
                <span class="text-sm font-semibold text-primary tracking-tight">${label.charAt(0) + label.slice(1).toLowerCase()}</span>
                <span class="px-2 py-0.5 rounded text-[9px] font-mono border ${tier.badgeClass}">
                  ${tier.label}
                </span>
              </div>
              <div class="text-right">
                <span class="text-xs font-mono font-bold text-primary">${pts}</span>
                <span class="text-[10px] font-mono text-muted">pts</span>
                <span class="text-[10px] font-mono text-muted ml-1">(${percent}%)</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/40">
              <div class="h-full rounded-full transition-all duration-700 ease-out" 
                   style="width: ${Math.max(percent, pts > 0 ? 6 : 0)}%; background-color: ${config.color};">
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (loading) loading.classList.add('hidden');
    if (canvasContainer) canvasContainer.classList.remove('hidden');

    const allZero = points.every(p => p === 0);
    if (allZero && emptyNote) {
      emptyNote.classList.remove('hidden');
    } else if (emptyNote) {
      emptyNote.classList.add('hidden');
    }

    // Chart.js Radar Render
    const chartStatus = Chart.getChart(canvas);
    if (chartStatus) {
      chartStatus.destroy();
    }

    const accentVar = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#635bff';
    const borderVar = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255, 255, 255, 0.12)';
    const textPrimaryVar = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#f8fafc';

    // When all points are 0, supply slight baseline values for the visual aesthetic outline
    const displayData = allZero ? [5, 5, 5, 5, 5] : points;

    new Chart(canvas, {
      type: 'radar',
      data: {
        labels: labels.map(l => l.charAt(0) + l.slice(1).toLowerCase()),
        datasets: [{
          label: 'Domain Points',
          data: displayData,
          backgroundColor: allZero 
            ? 'rgba(99, 91, 255, 0.05)' 
            : 'color-mix(in srgb, var(--accent) 22%, transparent)',
          borderColor: allZero ? 'rgba(99, 91, 255, 0.3)' : accentVar,
          borderWidth: allZero ? 1.5 : 2.5,
          pointBackgroundColor: allZero ? 'rgba(99, 91, 255, 0.4)' : accentVar,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 1.5,
          pointRadius: allZero ? 2 : 4.5,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: textPrimaryVar,
          pointHoverBorderColor: accentVar,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 900,
          easing: 'easeOutQuart'
        },
        scales: {
          r: {
            min: 0,
            angleLines: {
              color: borderVar,
              lineWidth: 1
            },
            grid: {
              color: borderVar,
              lineWidth: 1
            },
            pointLabels: {
              color: '#94a3b8',
              font: {
                family: "'SF Mono', 'JetBrains Mono', monospace",
                size: 11,
                weight: 'bold'
              },
              padding: 10
            },
            ticks: {
              display: false,
              backdropColor: 'transparent',
              stepSize: Math.max(10, Math.ceil(Math.max(...points, 10) / 4))
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: !allZero,
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleFont: {
              family: "'SF Mono', 'JetBrains Mono', monospace",
              size: 12
            },
            bodyFont: {
              family: "'SF Mono', 'JetBrains Mono', monospace",
              size: 11
            },
            padding: 10,
            borderColor: accentVar,
            borderWidth: 1,
            callbacks: {
              label: (ctx) => ` Competency: ${ctx.parsed.r} pts`
            }
          }
        }
      }
    });

  } catch (err: any) {
    if (loading) loading.classList.add('hidden');
    if (errorDiv) {
      errorDiv.textContent = `[ TELEMETRY ERROR ] ${err.message}`;
      errorDiv.classList.remove('hidden');
    }
  }
}
