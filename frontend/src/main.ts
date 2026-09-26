import './style.css';
import { supabase } from './supabase';
import { renderLogin, setupLoginLogic } from './views/login';
import { renderDashboard, setupDashboardLogic } from './views/dashboard';
import { renderLeaderboard, setupLeaderboardLogic } from './views/leaderboard';
import { renderGoals, setupGoalsLogic } from './views/goals';
import { renderAnalytics, setupAnalyticsLogic } from './views/analytics';
import { renderBounties, setupBountiesLogic } from './views/bounties';
import { renderTimer, setupTimerLogic } from './views/timer';
import { renderLanding, setupLandingLogic } from './views/landing';

const app = document.getElementById('app');

const VALID_AUTH_ROUTES = ['dashboard', 'leaderboard', 'goals', 'timer', 'analytics', 'bounties'];

function getRouteFromHash(): string {
  const raw = window.location.hash.replace(/^#\/?/, '').trim().toLowerCase();
  return raw;
}

let currentRoute = getRouteFromHash() || 'landing';

// Initialize Theme
if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export function navigate(route: string) {
  currentRoute = route;
  window.location.hash = `#/${route}`;
  renderApp();
}

async function renderApp() {
  if (!app) return;

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    // If authenticated user is on an unauth route (landing/login), forward to dashboard
    if (!VALID_AUTH_ROUTES.includes(currentRoute)) {
      currentRoute = 'dashboard';
      window.location.hash = '#/dashboard';
    }

    if (currentRoute === 'leaderboard') {
      app.innerHTML = renderLeaderboard();
      setupLeaderboardLogic(navigate);
    } else if (currentRoute === 'goals') {
      app.innerHTML = renderGoals();
      setupGoalsLogic(navigate);
    } else if (currentRoute === 'timer') {
      app.innerHTML = renderTimer();
      setupTimerLogic(navigate);
    } else if (currentRoute === 'analytics') {
      app.innerHTML = renderAnalytics();
      setupAnalyticsLogic(navigate);
    } else if (currentRoute === 'bounties') {
      app.innerHTML = renderBounties();
      setupBountiesLogic(navigate);
    } else {
      app.innerHTML = renderDashboard();
      setupDashboardLogic(navigate);
    }
  } else {
    // Unauthenticated user
    if (currentRoute !== 'login') {
      currentRoute = 'landing';
    }

    if (currentRoute === 'login') {
      app.innerHTML = renderLogin();
      setupLoginLogic(navigate);
    } else {
      app.innerHTML = renderLanding();
      setupLandingLogic(navigate);
    }
  }
}

// Listen for browser forward/back or hash changes
window.addEventListener('hashchange', () => {
  const hashRoute = getRouteFromHash();
  if (hashRoute && hashRoute !== currentRoute) {
    currentRoute = hashRoute;
    renderApp();
  }
});

// Initial render
renderApp();

// Listen for auth changes (Login, Logout, Token Expiry)
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session && currentRoute !== 'login') {
    currentRoute = 'landing';
    window.location.hash = '#/landing';
  } else if (session && !VALID_AUTH_ROUTES.includes(currentRoute)) {
    currentRoute = 'dashboard';
    window.location.hash = '#/dashboard';
  }
  renderApp();
});
