import { supabase } from './supabase';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

let isWarmingUp = false;

export function warmupBackend() {
  if (isWarmingUp) return;
  isWarmingUp = true;
  // Non-blocking ping to wake up sleeping backend instances (e.g., Render free tier)
  fetch(`${API_BASE_URL}/health`, { method: 'GET', keepalive: true }).catch(() => {
    // Retry once in 2 seconds if first ping failed
    setTimeout(() => {
      fetch(`${API_BASE_URL}/health`, { method: 'GET' }).catch(() => {});
    }, 2000);
  });
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 1. Get the current Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session. Cannot communicate with backend.');
  }

  // 2. Prepare the headers, automatically injecting the JWT
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // 3. Execute the fetch to FastAPI
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Request Failed: ${response.status}`);
  }

  return response.json();
}

export async function getTaskTelemetry() {
  return apiFetch('/tasks/telemetry');
}

export async function setOperativePassword(email: string, password: string, currentPassword?: string) {
  const response = await fetch(`${API_BASE_URL}/users/set-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      email, 
      password,
      current_password: currentPassword ? currentPassword : undefined
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update password (${response.status})`);
  }

  return response.json();
}

export async function updateMyPassword(password: string) {
  return apiFetch('/users/me/password', {
    method: 'POST',
    body: JSON.stringify({ password })
  });
}

export async function uploadProofFile(file: File): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch('/tasks/upload-proof', {
    method: 'POST',
    body: formData
  });
}

export interface GymStatus {
  checked_today: boolean;
  checked_at?: string | null;
  streak_days: number;
  points_awarded: number;
}

export async function getGymStatus(): Promise<GymStatus> {
  return apiFetch('/gym/status');
}

export async function checkinGym(): Promise<GymStatus> {
  return apiFetch('/gym/checkin', {
    method: 'POST'
  });
}

export interface WeeklyRankItem {
  rank: number;
  id: string;
  display_name: string;
  avatar_url?: string | null;
  points: number;
  tasks_completed: number;
  hours_logged: number;
  party_duty: boolean;
  status_label: string;
  is_me: boolean;
}

export interface WeekSummary {
  week_id: string;
  week_label: string;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  winner?: WeeklyRankItem | null;
  rankings: WeeklyRankItem[];
  party_sponsors: string[];
  party_resolved?: boolean;
  party_resolved_at?: string | null;
  party_resolved_by?: string | null;
}

export interface WeeklyAchieversResponse {
  current_week_id: string;
  current_week_label: string;
  is_sunday_night: boolean;
  seconds_until_midnight_ist: number;
  latest_completed_week?: WeekSummary | null;
  past_weeks: WeekSummary[];
  current_week_preview?: WeekSummary | null;
}

export async function getWeeklyAchievers(): Promise<WeeklyAchieversResponse> {
  return apiFetch('/users/weekly-achievers');
}

export interface ResolvePartyResponse {
  message: string;
  week_id: string;
  party_resolved: boolean;
  resolved_by: string;
  resolved_at: string;
}

export async function resolveWeeklyParty(weekId: string): Promise<ResolvePartyResponse> {
  return apiFetch(`/users/weekly-achievers/${weekId}/resolve-party`, {
    method: 'POST'
  });
}


