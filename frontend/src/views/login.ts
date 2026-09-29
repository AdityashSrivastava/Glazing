import { supabase } from '../supabase';
import { setOperativePassword } from '../api';

const SQUAD_OPERATIVES = [
  { name: 'Adityash', email: 'adityash@glazing.com', initial: 'A' },
  { name: 'Manas', email: 'manas@glazing.com', initial: 'M' },
  { name: 'Shivansh', email: 'shivansh@glazing.com', initial: 'S' },
  { name: 'Praveen', email: 'praveen@glazing.com', initial: 'P' },
  { name: 'Harshit', email: 'harshit@glazing.com', initial: 'H' },
];

export function renderLogin(): string {
  return `
    <div class="min-h-screen flex items-center justify-center p-4 bg-stripe-mesh relative">
      <!-- Minimalist Header -->
      <div class="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div class="text-xl font-bold tracking-tight text-primary">GLAZING</div>
        <div class="flex items-center space-x-3">
          <button id="dark-mode-toggle" class="text-primary hover:text-accent p-2 rounded-full transition-colors focus:outline-none" title="Toggle Dark Mode">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
          </button>
          <a href="#" id="back-to-home" class="text-[13px] font-medium text-body hover:text-primary transition-colors flex items-center px-3 py-1.5 rounded-full hover:bg-surface/50">
            <span class="mr-1">&larr;</span> Back to home
          </a>
        </div>
      </div>
      
      <div class="theme-card max-w-[440px] w-full p-6 md:p-8 space-y-6 relative overflow-hidden shadow-2xl dark:shadow-none border-black/5 dark:border-white/10 bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-md">
        <div class="text-left">
          <h2 id="login-title" class="text-2xl font-bold tracking-tight text-primary">
            Sign in to terminal
          </h2>
          <p id="login-subtitle" class="mt-1.5 text-[13px] text-body">
            Select your operative profile or enter credentials to proceed.
          </p>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="grid grid-cols-2 gap-1 bg-surface p-1 rounded-xl border border-border text-xs font-medium">
          <button type="button" id="tab-signin" class="py-2 rounded-lg bg-white dark:bg-zinc-800 text-primary font-semibold shadow-sm transition-all">
            Sign In
          </button>
          <button type="button" id="tab-setpwd" class="py-2 rounded-lg text-body hover:text-primary transition-all">
            Set Password
          </button>
        </div>

        <!-- Operative Quick Selector -->
        <div>
          <label class="block text-[11px] font-mono uppercase tracking-wider text-muted mb-2">Select Operative</label>
          <div class="grid grid-cols-5 gap-2">
            ${SQUAD_OPERATIVES.map(op => `
              <button
                type="button"
                data-email="${op.email}"
                class="op-selector flex flex-col items-center p-2 rounded-xl border border-border hover:border-accent hover:bg-accent/5 transition-all text-center group"
                title="${op.name} (${op.email})"
              >
                <div class="w-8 h-8 rounded-full bg-accent/15 border border-accent/30 text-accent font-bold text-xs flex items-center justify-center group-hover:scale-105 transition-transform">
                  ${op.initial}
                </div>
                <span class="text-[11px] font-medium text-body group-hover:text-primary truncate max-w-full mt-1.5">${op.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Feedback Alerts -->
        <div id="login-error" class="hidden bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500 rounded-xl data-text text-center transition-all">
        </div>
        <div id="login-success" class="hidden bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-500 rounded-xl data-text text-center transition-all">
        </div>
        
        <!-- Form Container -->
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block text-[13px] font-semibold mb-1 text-primary">Operative Email</label>
            <input
              type="email"
              id="email-input"
              required
              class="theme-input font-sans text-[14px] h-10 px-3 text-primary w-full"
              placeholder="operative@glazing.com"
            />
          </div>

          <!-- Current Password (Shown only in Set Password mode) -->
          <div id="current-pwd-container" class="hidden">
            <div class="flex justify-between items-center mb-1">
              <label class="text-[13px] font-semibold text-primary">Current Password</label>
              <span class="text-[11px] text-muted font-mono">Default: password123</span>
            </div>
            <div class="relative">
              <input
                type="password"
                id="current-password-input"
                class="theme-input font-sans text-[14px] h-10 pl-3 pr-10 text-primary w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-current-password-btn"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1 focus:outline-none transition-colors"
                title="Show / Hide Password"
                aria-label="Toggle password visibility"
              >
                <svg id="current-eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-muted mt-1">Required to verify existing operative identity.</p>
          </div>

          <!-- Password Field with View Toggle -->
          <div>
            <div class="flex justify-between items-center mb-1">
              <label id="pwd-label" class="text-[13px] font-semibold text-primary">Password</label>
            </div>
            <div class="relative">
              <input
                type="password"
                id="password-input"
                required
                class="theme-input font-sans text-[14px] h-10 pl-3 pr-10 text-primary w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-password-btn"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1 focus:outline-none transition-colors"
                title="Show / Hide Password"
                aria-label="Toggle password visibility"
              >
                <svg id="eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Confirm Password (Shown only in Set Password mode) -->
          <div id="confirm-pwd-container" class="hidden">
            <label class="block text-[13px] font-semibold mb-1 text-primary">Confirm New Password</label>
            <div class="relative">
              <input
                type="password"
                id="confirm-password-input"
                class="theme-input font-sans text-[14px] h-10 pl-3 pr-10 text-primary w-full"
                placeholder="••••••••"
              />
              <button
                type="button"
                id="toggle-confirm-password-btn"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-1 focus:outline-none transition-colors"
                title="Show / Hide Password"
                aria-label="Toggle password visibility"
              >
                <svg id="confirm-eye-icon" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-muted mt-1">Must be at least 6 characters.</p>
          </div>

          <button
            type="submit"
            id="submit-btn"
            class="btn-primary w-full flex justify-center py-2.5 mt-4 text-[14px] font-semibold rounded-xl transition-all"
          >
            Sign in
          </button>
          
          <div class="text-center pt-1">
            <button
              type="button"
              id="switch-mode-link"
              class="text-xs text-accent hover:underline font-medium transition-colors"
            >
              First time here? Set your operative password &rarr;
            </button>
          </div>

          <div class="text-center pt-2 border-t border-border">
            <p class="text-[11px] text-muted font-mono">Closed-loop access // 5 Operatives Only</p>
          </div>
        </form>
      </div>
    </div>
  `;
}

const EYE_OPEN_SVG = `
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
`;

const EYE_CLOSED_SVG = `
  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
`;

export function setupLoginLogic(navigateFn: (route: string) => void) {
  let isSetPasswordMode = false;

  const form = document.getElementById('login-form') as HTMLFormElement;
  const emailInput = document.getElementById('email-input') as HTMLInputElement;
  const currentPasswordInput = document.getElementById('current-password-input') as HTMLInputElement;
  const currentContainer = document.getElementById('current-pwd-container') as HTMLDivElement;
  const passwordInput = document.getElementById('password-input') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('confirm-password-input') as HTMLInputElement;
  const confirmContainer = document.getElementById('confirm-pwd-container') as HTMLDivElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const errorDiv = document.getElementById('login-error') as HTMLDivElement;
  const successDiv = document.getElementById('login-success') as HTMLDivElement;
  const backToHome = document.getElementById('back-to-home') as HTMLAnchorElement;
  const darkToggle = document.getElementById('dark-mode-toggle');
  
  const tabSignin = document.getElementById('tab-signin') as HTMLButtonElement;
  const tabSetpwd = document.getElementById('tab-setpwd') as HTMLButtonElement;
  const switchModeLink = document.getElementById('switch-mode-link') as HTMLButtonElement;
  
  const titleEl = document.getElementById('login-title') as HTMLElement;
  const subtitleEl = document.getElementById('login-subtitle') as HTMLElement;
  const pwdLabel = document.getElementById('pwd-label') as HTMLElement;

  const toggleCurrentPasswordBtn = document.getElementById('toggle-current-password-btn') as HTMLButtonElement;
  const currentEyeIcon = document.getElementById('current-eye-icon') as unknown as SVGElement;

  const togglePasswordBtn = document.getElementById('toggle-password-btn') as HTMLButtonElement;
  const eyeIcon = document.getElementById('eye-icon') as unknown as SVGElement;

  const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password-btn') as HTMLButtonElement;
  const confirmEyeIcon = document.getElementById('confirm-eye-icon') as unknown as SVGElement;

  // Show/Hide password toggle logic
  function setupEyeToggle(button: HTMLButtonElement, input: HTMLInputElement, icon: SVGElement) {
    if (!button || !input || !icon) return;
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      icon.innerHTML = isPassword ? EYE_CLOSED_SVG : EYE_OPEN_SVG;
    });
  }

  setupEyeToggle(toggleCurrentPasswordBtn, currentPasswordInput, currentEyeIcon);
  setupEyeToggle(togglePasswordBtn, passwordInput, eyeIcon);
  setupEyeToggle(toggleConfirmPasswordBtn, confirmPasswordInput, confirmEyeIcon);

  // Switch between Sign-in and Set-Password modes
  function setMode(setPwd: boolean) {
    isSetPasswordMode = setPwd;
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    if (isSetPasswordMode) {
      tabSetpwd.className = 'py-2 rounded-lg bg-white dark:bg-zinc-800 text-primary font-semibold shadow-sm transition-all';
      tabSignin.className = 'py-2 rounded-lg text-body hover:text-primary transition-all';
      titleEl.textContent = 'Set Operative Password';
      subtitleEl.textContent = 'Configure your personal password for secure terminal access.';
      pwdLabel.textContent = 'New Password';
      currentContainer.classList.remove('hidden');
      confirmContainer.classList.remove('hidden');
      confirmPasswordInput.required = true;
      submitBtn.textContent = 'Lock In Password & Enter';
      switchModeLink.textContent = 'Already set your password? Sign in here →';
    } else {
      tabSignin.className = 'py-2 rounded-lg bg-white dark:bg-zinc-800 text-primary font-semibold shadow-sm transition-all';
      tabSetpwd.className = 'py-2 rounded-lg text-body hover:text-primary transition-all';
      titleEl.textContent = 'Sign in to terminal';
      subtitleEl.textContent = 'Select your operative profile or enter credentials to proceed.';
      pwdLabel.textContent = 'Password';
      currentContainer.classList.add('hidden');
      confirmContainer.classList.add('hidden');
      confirmPasswordInput.required = false;
      if (currentPasswordInput) currentPasswordInput.value = '';
      submitBtn.textContent = 'Sign in';
      switchModeLink.textContent = 'First time here? Set your operative password →';
    }
  }

  if (tabSignin) tabSignin.addEventListener('click', () => setMode(false));
  if (tabSetpwd) tabSetpwd.addEventListener('click', () => setMode(true));
  if (switchModeLink) switchModeLink.addEventListener('click', () => setMode(!isSetPasswordMode));

  // Operative avatar quick selector
  const opSelectors = document.querySelectorAll('.op-selector');
  opSelectors.forEach(btn => {
    btn.addEventListener('click', () => {
      const email = btn.getAttribute('data-email');
      if (email && emailInput) {
        emailInput.value = email;
        passwordInput.focus();
        // Visual indicator on active operative button
        opSelectors.forEach(b => b.classList.remove('border-accent', 'bg-accent/10'));
        btn.classList.add('border-accent', 'bg-accent/10');
      }
    });
  });

  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const isDark = document.documentElement.classList.contains('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // Back to home
  if (backToHome) {
    backToHome.addEventListener('click', (e) => {
      e.preventDefault();
      navigateFn('landing');
    });
  }

  if (!form) return;

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!email) {
      errorDiv.textContent = 'Please enter or select an operative email.';
      errorDiv.classList.remove('hidden');
      return;
    }

    if (password.length < 6) {
      errorDiv.textContent = 'Password must be at least 6 characters long.';
      errorDiv.classList.remove('hidden');
      return;
    }

    submitBtn.disabled = true;

    if (isSetPasswordMode) {
      const confirmPwd = confirmPasswordInput.value;
      if (password !== confirmPwd) {
        errorDiv.textContent = 'Passwords do not match. Please verify.';
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        return;
      }

      submitBtn.textContent = 'Saving to database...';

      try {
        const currentPassword = currentPasswordInput ? currentPasswordInput.value.trim() : '';
        // 1. Authoritatively update/create password in Supabase via backend API
        await setOperativePassword(email, password, currentPassword || undefined);
        
        successDiv.textContent = 'Password saved! Authenticating terminal...';
        successDiv.classList.remove('hidden');

        // 2. Immediately sign in the operative with their newly chosen password
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInErr) {
          throw signInErr;
        }
        // Success triggers auth change event in main.ts
      } catch (err: any) {
        errorDiv.textContent = `Error: ${err.message || 'Failed to set password'}`;
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lock In Password & Enter';
      }
    } else {
      // Regular Sign-In Mode
      submitBtn.textContent = 'Authenticating...';

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        errorDiv.textContent = `Authentication failed: ${error.message}`;
        errorDiv.classList.remove('hidden');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
      }
    }
  });
}
