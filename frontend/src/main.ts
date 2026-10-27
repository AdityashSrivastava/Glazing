import './style.css';
import { supabase } from './supabase';
import { warmupBackend, sendHeartbeat } from './api';
import { renderLogin, setupLoginLogic } from './views/login';
import { renderDashboard, setupDashboardLogic } from './views/dashboard';
import { renderLeaderboard, setupLeaderboardLogic } from './views/leaderboard';
import { renderGoals, setupGoalsLogic } from './views/goals';
import { renderAnalytics, setupAnalyticsLogic } from './views/analytics';
import { renderBounties, setupBountiesLogic } from './views/bounties';
import { renderTimer, setupTimerLogic } from './views/timer';
import { renderLanding, setupLandingLogic } from './views/landing';
import { renderBombastic, setupBombasticLogic } from './views/bombastic';
import { renderVerdictModal, checkAndShowPendingVerdicts } from './views/components/verdict_modal';
import { renderMidtermBanner, renderMidtermModal, setupMidtermModalLogic } from './views/components/midterm_modal';

// Warm up backend instance immediately in the background
warmupBackend();

const app = document.getElementById('app');

const VALID_AUTH_ROUTES = ['dashboard', 'leaderboard', 'goals', 'timer', 'analytics', 'bounties', 'bombastic'];

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

// -------------------------------------------------------------
// Realtime Channels: WebSocket Presence & Instant Verdict Sync
// -------------------------------------------------------------
let presenceChannel: ReturnType<typeof supabase.channel> | null = null;
let verdictsChannel: ReturnType<typeof supabase.channel> | null = null;
let currentTrackingUserId: string | null = null;

function syncRealtimeChannels(user: any) {
  if (!user || currentTrackingUserId === user.id) return;
  currentTrackingUserId = user.id;

  if (presenceChannel) presenceChannel.unsubscribe();
  if (verdictsChannel) verdictsChannel.unsubscribe();

  // 1. Live Presence Channel (Instant WebSockets)
  presenceChannel = supabase.channel('squad-presence', {
    config: { presence: { key: user.id } }
  });

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel?.presenceState() || {};
      window.dispatchEvent(new CustomEvent('presence-sync', { detail: state }));
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel?.track({
          user_id: user.id,
          email: user.email,
          current_route: currentRoute,
          online_at: new Date().toISOString()
        });
      }
    });

  // 2. Instant Verdict Broadcast Channel
  verdictsChannel = supabase.channel('squad-verdicts');
  verdictsChannel
    .on('broadcast', { event: 'verdict-issued' }, (event) => {
      checkAndShowPendingVerdicts();
      window.dispatchEvent(new CustomEvent('verdict-received', { detail: event.payload }));
    })
    .subscribe();
}

async function renderApp() {
  if (!app) return;

  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const userEmail = (session.user.email || '').toLowerCase();

    // Guard covert route: ONLY adityash can access bombastic
    if (currentRoute === 'bombastic') {
      if (userEmail !== 'adityash@glazing.com') {
        currentRoute = 'dashboard';
        window.location.hash = '#/dashboard';
      }
    } else if (!VALID_AUTH_ROUTES.includes(currentRoute)) {
      currentRoute = 'dashboard';
      window.location.hash = '#/dashboard';
    }

    // Initialize & update live realtime tracking
    if (session.user) {
      syncRealtimeChannels(session.user);
      if (presenceChannel) {
        presenceChannel.track({
          user_id: session.user.id,
          email: session.user.email,
          current_route: currentRoute,
          online_at: new Date().toISOString()
        }).catch(() => {});
      }
    }

    // Send backend heartbeat telemetry
    sendHeartbeat(currentRoute);

    let viewHtml = '';
    if (currentRoute === 'bombastic') {
      viewHtml = renderBombastic();
    } else if (currentRoute === 'leaderboard') {
      viewHtml = renderLeaderboard();
    } else if (currentRoute === 'goals') {
      viewHtml = renderGoals();
    } else if (currentRoute === 'timer') {
      viewHtml = renderTimer();
    } else if (currentRoute === 'analytics') {
      viewHtml = renderAnalytics();
    } else if (currentRoute === 'bounties') {
      viewHtml = renderBounties();
    } else {
      viewHtml = renderDashboard();
    }

    app.innerHTML = renderMidtermBanner() + viewHtml + renderVerdictModal() + renderMidtermModal();

    if (currentRoute === 'bombastic') {
      setupBombasticLogic(navigate);
    } else if (currentRoute === 'leaderboard') {
      setupLeaderboardLogic(navigate);
      checkAndShowPendingVerdicts();
    } else if (currentRoute === 'goals') {
      setupGoalsLogic(navigate);
      checkAndShowPendingVerdicts();
    } else if (currentRoute === 'timer') {
      setupTimerLogic(navigate);
      checkAndShowPendingVerdicts();
    } else if (currentRoute === 'analytics') {
      setupAnalyticsLogic(navigate);
      checkAndShowPendingVerdicts();
    } else if (currentRoute === 'bounties') {
      setupBountiesLogic(navigate);
      checkAndShowPendingVerdicts();
    } else {
      setupDashboardLogic(navigate);
      checkAndShowPendingVerdicts();
    }

    setupMidtermModalLogic();
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

// Global Keyboard Shortcut: Ctrl + Shift + B (Secret Gate to Misterbombastic)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'B' || e.key === 'b')) {
    e.preventDefault();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email?.toLowerCase() === 'adityash@glazing.com') {
        navigate('bombastic');
      }
    });
  }
});

// Tab Visibility Sync: Re-ping presence and check verdicts when user returns to tab
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        sendHeartbeat(currentRoute);
        checkAndShowPendingVerdicts();
        presenceChannel?.track({
          user_id: session.user.id,
          email: session.user.email,
          current_route: currentRoute,
          online_at: new Date().toISOString()
        }).catch(() => {});
      }
    });
  }
});

// Periodic Heartbeat & Verdict Check (Every 30 seconds)
setInterval(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      sendHeartbeat(currentRoute);
      checkAndShowPendingVerdicts();
    }
  });
}, 30000);

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
    currentTrackingUserId = null;
    currentRoute = 'landing';
    window.location.hash = '#/landing';
  } else if (session && !VALID_AUTH_ROUTES.includes(currentRoute)) {
    currentRoute = 'dashboard';
    window.location.hash = '#/dashboard';
  }
  renderApp();
});
