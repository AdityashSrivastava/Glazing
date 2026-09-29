import { supabase } from './supabase';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/$/, '');

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

