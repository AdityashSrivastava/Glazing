export function renderLanding(): string {
  return `
    <div class="min-h-screen bg-bg flex flex-col font-sans overflow-x-hidden selection:bg-accent/20 selection:text-accent">
      
      <!-- Sticky Frosted Header -->
      <header class="fixed top-0 z-50 w-full h-[60px] backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/80 border-b border-black/5 dark:border-white/10 dark:border-white/10 flex items-center transition-all duration-300">
        <div class="max-w-[1024px] w-full mx-auto px-6 flex items-center justify-between">
          <div class="flex items-center space-x-8">
            <h1 class="text-xl font-bold tracking-tight text-primary">GLAZING</h1>
            <nav class="hidden md:flex items-center space-x-6">
              <a href="javascript:void(0)" data-feature="leaderboard" class="feature-link text-primary text-[15px] font-medium transition-colors hover:text-accent cursor-pointer">Leaderboard</a>
              <a href="javascript:void(0)" data-feature="goals" class="feature-link text-primary text-[15px] font-medium transition-colors hover:text-accent cursor-pointer">Goals</a>
              <a href="javascript:void(0)" data-feature="bounties" class="feature-link text-primary text-[15px] font-medium transition-colors hover:text-accent cursor-pointer">Bounty Hunt</a>
              <a href="javascript:void(0)" data-feature="analytics" class="feature-link text-primary text-[15px] font-medium transition-colors hover:text-accent cursor-pointer">Analytics</a>
            </nav>
          </div>
          
          <div class="flex items-center space-x-4">
             <button id="dark-mode-toggle" class="text-primary hover:text-accent p-2 rounded-full transition-colors focus:outline-none" title="Toggle Dark Mode">
                 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
             </button>
             <button id="nav-sign-in-btn" class="btn-primary text-[14px] font-semibold py-1.5 px-4 shadow-sm hover:shadow-md">Sign in <span class="ml-1 opacity-70">&rarr;</span></button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <main class="flex-1 w-full relative">
        <!-- Stripe Animated Mesh Background -->
        <div class="absolute inset-0 bg-stripe-mesh z-0 h-[800px] skew-y-[-6deg] origin-top-left -mt-20 border-b border-border/50"></div>
        
        <div class="relative z-10 max-w-[1024px] mx-auto px-6 pt-32 pb-20 md:pt-48 md:pb-32 flex flex-col md:flex-row items-center">
          
          <!-- Hero Copy -->
          <div class="md:w-[55%] pr-8">
            <h1 class="text-[64px] leading-[1.05] font-bold text-primary tracking-[-0.035em] mb-6">
              Gamified accountability through <span class="text-gradient">peer pressure.</span>
            </h1>
            <p class="text-[19px] leading-relaxed text-body mb-8 max-w-lg">
              A highly competitive, private accountability platform designed exclusively for a closed group of 5 individuals to foster maximum productivity through peer pressure and verifiable execution.
            </p>
            <div class="flex items-center space-x-4">
              <button id="hero-start-btn" class="btn-primary text-[15px] font-semibold py-2.5 px-6 shadow-sm hover:shadow-md">Start now <span class="ml-1 opacity-70">&rarr;</span></button>
              <a href="#" class="btn-ghost text-[15px] font-semibold py-2.5 px-6">Explore docs</a>
            </div>
          </div>
          
          <!-- Hero 3D Card Stack (Explaining the project) -->
          <div class="md:w-[45%] mt-16 md:mt-0 relative perspective-1000 hidden md:block">
            <div class="relative w-[500px] h-[400px] transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-[0deg] hover:rotate-x-[0deg] transition-all duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
              
              <!-- Back Card (Task Proof) -->
              <div class="absolute top-12 left-12 w-[380px] h-[260px] bg-surface rounded-xl shadow-md dark:shadow-none border border-black/5 dark:border-white/10 p-5 opacity-90 scale-95 z-0 transform translate-z-[-50px]">
                <div class="flex items-center space-x-2 mb-4 border-b border-border/50 pb-2">
                  <div class="w-3 h-3 rounded-full bg-green-500"></div>
                  <h3 class="text-xs font-bold text-primary">Task Completed</h3>
                </div>
                <div class="space-y-3">
                  <div>
                    <div class="text-[10px] text-muted font-semibold uppercase">Objective</div>
                    <div class="text-sm font-semibold text-primary">Master FastAPI</div>
                  </div>
                  <div class="flex space-x-4">
                    <div>
                       <div class="text-[10px] text-muted font-semibold uppercase">Est. Time</div>
                       <div class="text-xs text-primary font-mono">4.0 hrs</div>
                    </div>
                    <div>
                       <div class="text-[10px] text-muted font-semibold uppercase">Actual Time</div>
                       <div class="text-xs text-green-600 font-mono">3.75 hrs</div>
                    </div>
                  </div>
                  <div>
                     <div class="text-[10px] text-muted font-semibold uppercase mb-1">Proof of Work</div>
                     <div class="w-full h-12 bg-surface border border-dashed border-border rounded flex items-center justify-center text-[10px] text-muted">
                        github.com/commit/1a2b3c
                     </div>
                  </div>
                </div>
              </div>

              <!-- Main Card (Leaderboard) -->
              <div class="absolute top-0 left-0 w-[420px] h-[320px] bg-surface rounded-2xl shadow-xl dark:shadow-none border border-black/5 dark:border-white/10 p-6 z-10 transform translate-z-[20px]">
                <div class="flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                  <div>
                    <h3 class="text-sm font-bold text-primary">Daily Leaderboard</h3>
                    <p class="text-[11px] text-body mt-1">Resets at midnight IST</p>
                  </div>
                  <div class="px-2 py-1 bg-rose-500/10 text-rose-600 text-[10px] font-bold rounded-full animate-pulse">RACING</div>
                </div>
                
                <div class="space-y-4">
                  <!-- Rank 1 -->
                  <div class="flex items-center space-x-3 p-2 bg-accent/5 rounded-lg border border-accent/20">
                    <div class="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">1</div>
                    <div class="flex-1">
                      <div class="text-xs font-bold text-primary">Adityash</div>
                    </div>
                    <div class="text-xs font-mono text-accent font-bold">120 pts</div>
                  </div>
                  
                  <!-- Rank 2 -->
                  <div class="flex items-center space-x-3 p-2 hover:bg-surface rounded-lg transition-colors">
                    <div class="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted text-xs font-bold">2</div>
                    <div class="flex-1">
                      <div class="text-xs font-bold text-primary">Harshit <span class="ml-1 text-[9px] px-1.5 py-0.5 bg-green-500/10 text-green-600 rounded">DEEP FOCUS</span></div>
                    </div>
                    <div class="text-xs font-mono text-muted font-bold">95 pts</div>
                  </div>

                  <!-- Rank 3 -->
                  <div class="flex items-center space-x-3 p-2 hover:bg-surface rounded-lg transition-colors">
                    <div class="w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center text-muted text-xs font-bold">3</div>
                    <div class="flex-1">
                      <div class="text-xs font-bold text-primary">Manas</div>
                    </div>
                    <div class="text-xs font-mono text-muted font-bold">40 pts</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
          
        </div>

        <!-- Brands Section -->
        <div class="max-w-[1024px] mx-auto px-6 py-12 border-t border-black/5 dark:border-white/10 mt-12 relative z-10">
          <p class="text-sm font-semibold text-primary mb-6">Exclusive access granted to</p>
          <div class="flex flex-wrap items-center gap-8 md:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             <div class="text-xl font-bold tracking-tighter text-primary">ADITYASH</div>
             <div class="text-xl font-bold tracking-tighter text-primary">HARSHIT</div>
             <div class="text-xl font-bold tracking-tighter text-primary">MANAS</div>
             <div class="text-xl font-bold tracking-tighter text-primary">SHIVANSH</div>
             <div class="text-xl font-bold tracking-tighter text-primary">PRAVEEN</div>
          </div>
        </div>

        <!-- Product Feature Section -->
        <div class="w-full bg-bg py-24 relative z-10">
          <div class="max-w-[1024px] mx-auto px-6 flex flex-col md:flex-row items-center">
             <div class="md:w-1/2 pr-12">
               <div class="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-6">
                 <svg class="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
               </div>
               <h2 class="text-3xl font-bold text-primary tracking-tight mb-4">A fully integrated suite of operative tools.</h2>
               <p class="text-[17px] text-body leading-relaxed mb-6">
                 We bring together everything that’s required to build websites, manage complex tasks, and rank globally. Glazing’s architecture is designed to reduce latency and friction for elite developers.
               </p>
               <a href="javascript:void(0)" class="text-accent font-semibold text-[15px] hover:text-[#00d4ff] transition-colors flex items-center cursor-default">
                 Explore the platform <span class="ml-1">&rarr;</span>
               </a>
             </div>
             <div class="md:w-1/2 mt-12 md:mt-0 w-full">
               <div class="bg-surface rounded-3xl p-8 border border-border shadow-sm">
                 <div class="flex space-x-2 mb-6">
                   <div class="w-3 h-3 rounded-full bg-rose-400"></div>
                   <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
                   <div class="w-3 h-3 rounded-full bg-green-400"></div>
                 </div>
                 <div class="space-y-4">
                   <div class="h-4 bg-surface rounded w-full shadow-sm"></div>
                   <div class="h-4 bg-surface rounded w-5/6 shadow-sm"></div>
                   <div class="h-4 bg-surface rounded w-4/6 shadow-sm"></div>
                 </div>
                 <div class="mt-8 flex justify-between">
                   <div class="h-10 bg-surface rounded-lg w-1/3 shadow-sm"></div>
                   <div class="h-10 bg-accent rounded-lg w-1/4 shadow-sm"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <!-- Algorithm Section -->
        <div class="w-full bg-[#0a2540] py-24 relative z-10 text-white overflow-hidden">
          <!-- Background glow -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/20 rounded-full blur-[100px] z-0 pointer-events-none"></div>

          <div class="max-w-[1024px] mx-auto px-6 flex flex-col md:flex-row items-center relative z-10">
             <div class="md:w-1/2 pr-12">
               <h2 class="text-3xl font-bold tracking-tight mb-4 text-white">Algorithm-driven accountability.</h2>
               <p class="text-[17px] text-[#adbdcc] leading-relaxed mb-6">
                 Points aren't arbitrary. Glazing calculates exact performance scores using an open algorithm. We reward not just completion, but precision execution. Missing your estimated time costs you the precision bonus.
               </p>
               <a href="javascript:void(0)" class="text-[#00d4ff] font-semibold text-[15px] hover:text-white transition-colors flex items-center cursor-default">
                 View mechanics <span class="ml-1">&rarr;</span>
               </a>
             </div>
             <div class="md:w-1/2 mt-12 md:mt-0 w-full">
               <div class="bg-[#011627] rounded-xl border border-white/10 p-6 font-mono text-[13px] leading-relaxed text-[#d6deeb] shadow-2xl overflow-x-auto">
                 
                 <div class="flex space-x-2 mb-4">
                   <div class="text-[#c792ea]">def</div>
                   <div class="text-[#82aaff]">calculate_execution_score</div><span class="text-[#89ddff]">(</span><span class="text-[#d6deeb]">estimated_hrs, actual_hrs</span><span class="text-[#89ddff]">):</span>
                 </div>
                 
                 <div class="pl-4 flex space-x-2">
                   <div class="text-[#697098] italic"># Base execution multiplier</div>
                 </div>
                 <div class="pl-4 flex space-x-2">
                   <div class="text-[#d6deeb]">score</div>
                   <div class="text-[#89ddff]">=</div>
                   <div class="text-[#d6deeb]">actual_hrs</div>
                   <div class="text-[#89ddff]">*</div>
                   <div class="text-[#f78c6c]">10</div>
                 </div>
                 
                 <div class="pl-4 flex space-x-2 mt-4">
                   <div class="text-[#697098] italic"># 15-minute precision bonus window</div>
                 </div>
                 <div class="pl-4 flex space-x-2">
                   <div class="text-[#c792ea]">if</div>
                   <div class="text-[#82aaff]">abs</div><span class="text-[#89ddff]">(</span><span class="text-[#d6deeb]">estimated_hrs - actual_hrs</span><span class="text-[#89ddff]">)</span>
                   <div class="text-[#89ddff]"><=</div>
                   <div class="text-[#f78c6c]">0.25</div><span class="text-[#89ddff]">:</span>
                 </div>
                 <div class="pl-8 flex space-x-2">
                   <div class="text-[#d6deeb]">score</div>
                   <div class="text-[#89ddff]">+=</div>
                   <div class="text-[#f78c6c]">5</div>
                 </div>
                 
                 <div class="pl-4 flex space-x-2 mt-4">
                   <div class="text-[#697098] italic"># Task completion bounty</div>
                 </div>
                 <div class="pl-4 flex space-x-2">
                   <div class="text-[#d6deeb]">score</div>
                   <div class="text-[#89ddff]">+=</div>
                   <div class="text-[#f78c6c]">5</div>
                 </div>
                 
                 <div class="pl-4 flex space-x-2 mt-4">
                   <div class="text-[#c792ea]">return</div>
                   <div class="text-[#d6deeb]">score</div>
                 </div>

               </div>
             </div>
          </div>
        </div>

      </main>

      <!-- Footer -->
      <footer class="bg-surface border-t border-border py-16">
        <div class="max-w-[1024px] mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 text-[14px]">
          <div class="col-span-2 md:col-span-1">
             <h2 class="text-lg font-bold text-primary mb-4">GLAZING</h2>
             <p class="text-body text-xs mb-4">© 2026 Glazing, Inc.</p>
          </div>
          <div>
            <h4 class="font-bold text-primary mb-4">Products</h4>
            <ul class="space-y-3 text-body font-medium">
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Atlas</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Billing</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Invoicing</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Connect</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-primary mb-4">Developers</h4>
            <ul class="space-y-3 text-body font-medium">
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Documentation</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">API Reference</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">API Status</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">GitHub</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-primary mb-4">Company</h4>
            <ul class="space-y-3 text-body font-medium">
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">About</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Customers</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Enterprise</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Careers</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold text-primary mb-4">Use Cases</h4>
            <ul class="space-y-3 text-body font-medium">
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">SaaS</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Platforms</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Marketplaces</a></li>
              <li><a href="javascript:void(0)" class="hover:text-accent transition-colors cursor-default">Creator Economy</a></li>
            </ul>
          </div>
        </div>
      </footer>

      <!-- Feature Info Modal -->
      <div id="feature-modal" class="fixed inset-0 z-[100] flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div id="feature-modal-backdrop" class="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer"></div>
        <div class="theme-card relative z-10 max-w-[500px] w-full p-8 mx-4 transform scale-95 transition-transform duration-300 ease-out" id="feature-modal-content">
          <button id="close-feature-modal" class="absolute top-4 right-4 text-muted hover:text-primary transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
          <div class="flex items-center space-x-3 mb-4">
            <div id="feature-modal-icon" class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
            </div>
            <h3 id="feature-modal-title" class="text-xl font-bold text-primary"></h3>
          </div>
          <p id="feature-modal-desc" class="text-body text-[15px] leading-relaxed mb-6"></p>
          <button id="close-feature-btn" class="btn-primary w-full py-2 text-[14px]">Understood</button>
        </div>
      </div>
    </div>
  `;
}

export function setupLandingLogic(navigateFn: (route: string) => void) {
  const signInBtn = document.getElementById('nav-sign-in-btn');
  const darkToggle = document.getElementById('dark-mode-toggle');
  
  if (darkToggle) {
      darkToggle.addEventListener('click', () => {
          document.documentElement.classList.toggle('dark');
          const isDark = document.documentElement.classList.contains('dark');
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
      });
  }
  const startBtn = document.getElementById('hero-start-btn');

  if (signInBtn) {
    signInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateFn('login');
    });
  }

  if (startBtn) {
    startBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateFn('login');
    });
  }

  // Feature Modal Logic
  const featureLinks = document.querySelectorAll('.feature-link');
  const modal = document.getElementById('feature-modal');
  const backdrop = document.getElementById('feature-modal-backdrop');
  const closeBtn = document.getElementById('close-feature-modal');
  const closeBtn2 = document.getElementById('close-feature-btn');
  const modalContent = document.getElementById('feature-modal-content');
  
  const modalTitle = document.getElementById('feature-modal-title');
  const modalDesc = document.getElementById('feature-modal-desc');
  const modalIcon = document.getElementById('feature-modal-icon');

  const featureData: Record<string, { title: string, desc: string, icon: string }> = {
    'leaderboard': {
      title: 'Daily Leaderboard',
      desc: 'The core of our gamified system. The leaderboard tracks your daily execution points and resets strictly at midnight IST. Points are awarded based on hours logged, with bonuses for precision execution and task completion.',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>'
    },
    'goals': {
      title: 'Macro Goals',
      desc: 'Group your daily grind under long-term objectives. Whether it\'s mastering a new tech stack or hitting the gym, Goals act as the overarching domains to keep your daily tasks aligned with your macro ambitions.',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    },
    'bounties': {
      title: 'Bounty Hunt (P2P Stakes)',
      desc: 'Put your money where your mouth is. Stake your own earned points to place a bounty on a friend\'s task. If they finish it by midnight, they take your points. If they fail, you win. Weaponized peer pressure.',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    },
    'analytics': {
      title: 'Analytics & Radar',
      desc: 'Track your historical performance across different domains (DSA, Development, College Studies, Gym, Life). Analyze your radar charts, view your task completion rates, and monitor your bounty win-rates over the entire season.',
      icon: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>'
    }
  };

  const closeModal = () => {
    if (!modal || !modalContent) return;
    modal.classList.remove('opacity-100');
    modalContent.classList.remove('scale-100');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300);
  };

  const openModal = (featureKey: string) => {
    if (!modal || !modalContent || !modalTitle || !modalDesc || !modalIcon) return;
    const data = featureData[featureKey];
    if (!data) return;

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.desc;
    modalIcon.innerHTML = data.icon;

    modal.classList.remove('hidden');
    // small delay to allow display block to apply before animating opacity
    setTimeout(() => {
      modal.classList.add('opacity-100');
      modalContent.classList.add('scale-100');
    }, 10);
  };

  featureLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const featureKey = (e.currentTarget as HTMLElement).getAttribute('data-feature');
      if (featureKey) openModal(featureKey);
    });
  });

  if (backdrop) backdrop.addEventListener('click', closeModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (closeBtn2) closeBtn2.addEventListener('click', closeModal);
}
