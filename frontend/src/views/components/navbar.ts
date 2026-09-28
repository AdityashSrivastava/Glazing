import { supabase } from '../../supabase';
import { apiFetch, updateMyPassword } from '../../api';
import { renderCreateTaskModal } from './modal';
import { escapeHtml } from '../../utils';

export function renderChangePasswordModal(): string {
  return `
    <div id="change-pwd-modal" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4">
      <div class="theme-card max-w-[400px] w-full p-6 space-y-5 bg-white dark:bg-[#18181b] border border-border rounded-2xl shadow-2xl relative">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
            </div>
            <div>
              <h3 class="text-base font-bold text-primary">Change Password</h3>
              <p class="text-xs text-body">Update your operative terminal credentials</p>
            </div>
          </div>
          <button type="button" id="close-change-pwd-btn" class="text-body hover:text-primary p-1 rounded-lg hover:bg-surface transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div id="change-pwd-error" class="hidden bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-500 rounded-xl text-center"></div>

        <form id="change-pwd-form" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold mb-1 text-primary">New Password</label>
            <div class="relative">
              <input
                type="password"
                id="modal-new-pwd"
                required
                class="theme-input font-sans text-[13px] h-9 pl-3 pr-10 text-primary w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-modal-new-pwd-btn"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1 focus:outline-none transition-colors"
                title="Show / Hide Password"
                aria-label="Toggle password visibility"
              >
                <svg id="modal-eye-icon-1" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-muted mt-1">Minimum 6 characters.</p>
          </div>

          <div>
            <label class="block text-xs font-semibold mb-1 text-primary">Confirm New Password</label>
            <div class="relative">
              <input
                type="password"
                id="modal-confirm-pwd"
                required
                class="theme-input font-sans text-[13px] h-9 pl-3 pr-10 text-primary w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-modal-confirm-pwd-btn"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1 focus:outline-none transition-colors"
                title="Show / Hide Password"
                aria-label="Toggle password visibility"
              >
                <svg id="modal-eye-icon-2" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              id="cancel-change-pwd-btn"
              class="px-3 py-2 text-xs font-medium text-body hover:text-primary border border-border rounded-xl hover:bg-surface transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-change-pwd-btn"
              class="btn-primary text-xs font-semibold px-4 py-2 rounded-xl transition-all"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderNavbar(activeTab: 'dashboard' | 'leaderboard' | 'goals' | 'analytics' | 'bounties' | 'timer'): string {
  return `
    <header class="sticky top-0 z-40 w-full h-[48px] backdrop-blur-xl bg-white/80 dark:bg-[#09090b]/80 border-b border-black/5 dark:border-white/10 flex items-center">
      <div class="max-w-[1240px] w-full mx-auto px-4 md:px-6 flex items-center justify-between">
        <div class="flex items-center space-x-6 md:space-x-8">
          <div class="flex items-center space-x-2 cursor-pointer" id="nav-brand">
            <h1 class="text-base font-bold tracking-tight text-primary">GLAZING</h1>
          </div>
          
          <nav class="hidden md:flex items-center space-x-5">
            <a href="#" id="nav-dashboard" class="${activeTab === 'dashboard' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Activity Feed</a>
            <a href="#" id="nav-leaderboard" class="${activeTab === 'leaderboard' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Leaderboard</a>
            <a href="#" id="nav-goals" class="${activeTab === 'goals' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Goals</a>
            <a href="#" id="nav-timer" class="${activeTab === 'timer' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Pomodoro</a>
            <a href="#" id="nav-analytics" class="${activeTab === 'analytics' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Analytics</a>
            <a href="#" id="nav-bounties" class="${activeTab === 'bounties' ? 'text-primary font-semibold' : 'text-body hover:text-primary'} text-[13px] transition-colors">Bounties</a>
          </nav>
        </div>
        
        <div class="flex items-center space-x-3">
           <!-- Theme Toggle Button -->
           <button id="dark-mode-toggle" class="p-1.5 rounded-md hover:bg-surface border border-border text-body hover:text-primary transition-colors focus:outline-none" title="Toggle Theme">
             <svg class="w-4 h-4 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
             <svg class="w-4 h-4 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
           </button>

           <!-- Global Initialize Task Button (Available across all authenticated views) -->
           <button id="open-modal-btn" class="btn-primary text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer">
             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path>
             </svg>
             <span class="hidden sm:inline">Initialize Task</span>
             <span class="sm:hidden">Task</span>
           </button>
           
           <!-- Profile Dropdown -->
           <div class="relative">
              <button id="profile-dropdown-btn" class="flex items-center space-x-2 text-body hover:text-primary transition-colors focus:outline-none py-1 px-1.5 rounded-lg hover:bg-surface">
                <div class="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 text-accent flex items-center justify-center overflow-hidden">
                  <span id="profile-initial" class="text-xs font-bold font-mono">U</span>
                </div>
                <span id="profile-name" class="text-[13px] font-medium text-primary max-w-[120px] truncate hidden sm:inline">User</span>
                <svg class="w-3.5 h-3.5 opacity-60 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              
              <div id="profile-dropdown-menu" class="hidden absolute right-0 mt-2 w-52 bg-white dark:bg-[#18181b] border border-border rounded-xl shadow-lg z-50 py-1.5 origin-top-right">
                <div class="px-4 py-2.5 border-b border-border">
                   <p class="text-[10px] text-body uppercase font-mono tracking-wider">Signed in as</p>
                   <p id="profile-email" class="text-xs text-primary font-semibold truncate mt-0.5">...</p>
                </div>
                <a href="#" id="menu-dashboard" class="block px-4 py-2 text-[13px] text-body hover:text-primary hover:bg-surface transition-colors">Activity Feed</a>
                <a href="#" id="menu-leaderboard" class="block px-4 py-2 text-[13px] text-body hover:text-primary hover:bg-surface transition-colors">Leaderboard</a>
                <a href="#" id="menu-goals" class="block px-4 py-2 text-[13px] text-body hover:text-primary hover:bg-surface transition-colors">Objectives & Goals</a>
                <a href="#" id="menu-timer" class="block px-4 py-2 text-[13px] text-body hover:text-primary hover:bg-surface transition-colors">Pomodoro Timer</a>
                <div class="border-t border-border my-1"></div>
                <button type="button" id="menu-change-pwd" class="w-full text-left block px-4 py-2 text-[13px] text-primary hover:bg-surface transition-colors flex items-center gap-2">
                  <svg class="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                  <span>Change Password</span>
                </button>
                <button id="logout-btn" class="w-full text-left block px-4 py-2 text-[13px] text-rose-500 hover:bg-rose-500/10 transition-colors font-medium">Sign Out</button>
              </div>
           </div>
        </div>
      </div>
    </header>

    <!-- Global Modals Mounted with Navbar -->
    ${renderCreateTaskModal()}
    ${renderChangePasswordModal()}
  `;
}


export function showNotification(message: string, type: 'success' | 'error' = 'success') {
  let toastContainer = document.getElementById('global-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'global-toast-container';
    toastContainer.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const bg = type === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500';
  toast.className = `p-3 px-4 rounded-xl shadow-xl font-mono text-xs flex items-center gap-2 transform translate-y-3 opacity-0 transition-all duration-300 pointer-events-auto border ${bg}`;
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);
  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-3', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

export function setupNavbarLogic(navigateFn: (route: string) => void) {
  // Navigation Routing
  const routes = ['dashboard', 'leaderboard', 'goals', 'timer', 'analytics', 'bounties'];
  
  const brand = document.getElementById('nav-brand');
  if (brand) brand.addEventListener('click', () => navigateFn('dashboard'));

  routes.forEach(r => {
    const navLink = document.getElementById(`nav-${r}`);
    if (navLink) {
      navLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateFn(r);
      });
    }

    const menuLink = document.getElementById(`menu-${r}`);
    if (menuLink) {
      menuLink.addEventListener('click', (e) => {
        e.preventDefault();
        navigateFn(r);
      });
    }
  });

  // Dark Mode Toggle
  const darkToggle = document.getElementById('dark-mode-toggle');
  if (darkToggle) {
    darkToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // Profile Dropdown Toggle
  const profileDropdownBtn = document.getElementById('profile-dropdown-btn');
  const profileDropdownMenu = document.getElementById('profile-dropdown-menu');
  if (profileDropdownBtn && profileDropdownMenu) {
    profileDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      if (!profileDropdownMenu.classList.contains('hidden')) {
        profileDropdownMenu.classList.add('hidden');
      }
    });
  }

  // Populate User Profile & Initial
  const nameEl = document.getElementById('profile-name');
  const initialEl = document.getElementById('profile-initial');
  const emailEl = document.getElementById('profile-email');

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      const email = session.user.email || '';
      if (emailEl) emailEl.textContent = email;

      const fallbackName = email.split('@')[0] || 'User';
      const fallbackInitial = fallbackName.charAt(0).toUpperCase();

      if (nameEl && (!nameEl.textContent || nameEl.textContent === 'Loading...' || nameEl.textContent === 'User')) {
        nameEl.textContent = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
      }
      if (initialEl && (!initialEl.textContent || initialEl.textContent === 'U')) {
        initialEl.textContent = fallbackInitial;
      }
    }
  });

  apiFetch('/users/me')
    .then((user: any) => {
      if (user && user.display_name) {
        if (nameEl) nameEl.textContent = user.display_name;
        if (initialEl) initialEl.textContent = user.display_name.charAt(0).toUpperCase();
      }
    })
    .catch((err) => {
      console.error("Profile fetch error:", err);
    });

  // Logout handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      navigateFn('login');
    });
  }

  // --- Global Task Initialization Modal Logic ---
  const modal = document.getElementById('create-task-modal') as HTMLDivElement;
  const openModalBtn = document.getElementById('open-modal-btn') as HTMLButtonElement;
  const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;
  const createTaskForm = document.getElementById('create-task-form') as HTMLFormElement;

  const populateGoalDropdown = async () => {
    const select = document.getElementById('task-goal-id') as HTMLSelectElement;
    if (select) {
      try {
        const goals = await apiFetch('/goals');
        select.innerHTML = '<option value="">-- NO LINKED OBJECTIVE --</option>' + 
          goals.map((g: any) => {
            const privBadge = g.is_private ? '[🔒 Classified] ' : '';
            return `<option value="${escapeHtml(g.id)}">🎯 ${privBadge}${escapeHtml(g.title)}</option>`;
          }).join('');
      } catch (e) {
        console.error("Failed to load goals into task modal:", e);
      }
    }
  };

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', async () => {
      modal.classList.remove('hidden');
      await populateGoalDropdown();
    });
  }

  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  if (createTaskForm) {
    createTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submit-task-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'DEPLOYING...';

      const title = (document.getElementById('task-title') as HTMLInputElement).value;
      const estHours = parseFloat((document.getElementById('task-est') as HTMLInputElement).value);
      const isPrivate = (document.getElementById('task-private') as HTMLInputElement).checked;
      const goalId = (document.getElementById('task-goal-id') as HTMLSelectElement).value;

      try {
        const createdTask = await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title: title,
            estimated_hours: estHours,
            is_private: isPrivate,
            goal_id: goalId || null
          })
        });

        if (modal) modal.classList.add('hidden');
        createTaskForm.reset();
        showNotification(`🚀 Task "${title}" deployed to field!`);

        // Notify page views that a task was created
        window.dispatchEvent(new CustomEvent('task-created', { detail: createdTask }));
      } catch (err: any) {
        showNotification(`Failed to initialize task: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Deploy Task to Field';
      }
    });
  }

  // Change Password Modal Logic
  const changePwdModal = document.getElementById('change-pwd-modal') as HTMLDivElement;
  const menuChangePwd = document.getElementById('menu-change-pwd') as HTMLButtonElement;
  const closeChangePwdBtn = document.getElementById('close-change-pwd-btn') as HTMLButtonElement;
  const cancelChangePwdBtn = document.getElementById('cancel-change-pwd-btn') as HTMLButtonElement;
  const changePwdForm = document.getElementById('change-pwd-form') as HTMLFormElement;
  const changePwdError = document.getElementById('change-pwd-error') as HTMLDivElement;

  const modalNewPwd = document.getElementById('modal-new-pwd') as HTMLInputElement;
  const modalConfirmPwd = document.getElementById('modal-confirm-pwd') as HTMLInputElement;
  const toggleModalNewPwdBtn = document.getElementById('toggle-modal-new-pwd-btn') as HTMLButtonElement;
  const toggleModalConfirmPwdBtn = document.getElementById('toggle-modal-confirm-pwd-btn') as HTMLButtonElement;
  const modalEyeIcon1 = document.getElementById('modal-eye-icon-1') as unknown as SVGElement;
  const modalEyeIcon2 = document.getElementById('modal-eye-icon-2') as unknown as SVGElement;

  const EYE_OPEN = `
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  `;
  const EYE_CLOSED = `
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
  `;

  function setupEyeToggle(button: HTMLButtonElement, input: HTMLInputElement, icon: SVGElement) {
    if (!button || !input || !icon) return;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.innerHTML = isPassword ? EYE_CLOSED : EYE_OPEN;
    });
  }

  setupEyeToggle(toggleModalNewPwdBtn, modalNewPwd, modalEyeIcon1);
  setupEyeToggle(toggleModalConfirmPwdBtn, modalConfirmPwd, modalEyeIcon2);

  if (menuChangePwd && changePwdModal) {
    menuChangePwd.addEventListener('click', () => {
      profileDropdownMenu?.classList.add('hidden');
      changePwdModal.classList.remove('hidden');
      changePwdError?.classList.add('hidden');
      changePwdForm?.reset();
    });
  }

  const hideChangePwdModal = () => {
    if (changePwdModal) changePwdModal.classList.add('hidden');
  };

  if (closeChangePwdBtn) closeChangePwdBtn.addEventListener('click', hideChangePwdModal);
  if (cancelChangePwdBtn) cancelChangePwdBtn.addEventListener('click', hideChangePwdModal);
  if (changePwdModal) {
    changePwdModal.addEventListener('click', (e) => {
      if (e.target === changePwdModal) hideChangePwdModal();
    });
  }

  if (changePwdForm) {
    changePwdForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pwd = modalNewPwd.value;
      const confirm = modalConfirmPwd.value;

      if (pwd.length < 6) {
        changePwdError.textContent = 'Password must be at least 6 characters.';
        changePwdError.classList.remove('hidden');
        return;
      }

      if (pwd !== confirm) {
        changePwdError.textContent = 'Passwords do not match.';
        changePwdError.classList.remove('hidden');
        return;
      }

      const submitBtn = document.getElementById('submit-change-pwd-btn') as HTMLButtonElement;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Updating...';

      try {
        await updateMyPassword(pwd);
        hideChangePwdModal();
        showNotification('🔒 Password successfully updated in database!');
      } catch (err: any) {
        changePwdError.textContent = `Error: ${err.message || 'Failed to update'}`;
        changePwdError.classList.remove('hidden');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Password';
      }
    });
  }
}

