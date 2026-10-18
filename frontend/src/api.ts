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
    let msg = `API Request Failed: ${response.status}`;
    if (typeof errorData.detail === 'string') {
      msg = errorData.detail;
    } else if (Array.isArray(errorData.detail)) {
      msg = errorData.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
    } else if (errorData.detail && typeof errorData.detail === 'object') {
      msg = JSON.stringify(errorData.detail);
    }
    throw new Error(msg);
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

// -----------------------------------------------------------------
// COVERT OVERSEER (MISTERBOMBASTIC) & PRESENCE TELEMETRY APIS
// -----------------------------------------------------------------

export interface OperativePresenceItem {
  user_id: string;
  display_name: string;
  email: string;
  is_online: boolean;
  current_route: string;
  last_heartbeat?: string | null;
  last_seen_relative: string;
  active_task_title?: string | null;
  active_timer_mode?: string | null;
  active_timer_seconds?: number | null;
  status_label: 'ACTIVE' | 'IN FOCUS' | 'IDLE' | 'OFFLINE';
}

export interface VerdictItem {
  id: string;
  target_user_id: string;
  target_user_name?: string | null;
  task_id?: string | null;
  task_title?: string | null;
  action_type: 'REVOKE_GYM' | 'REJECT_TASK' | 'REWRITE_TASK' | 'REVERT_PENDING';
  reason: string;
  points_deducted: number;
  old_values?: any;
  new_values?: any;
  acknowledged: boolean;
  created_at: string;
}

export async function sendHeartbeat(currentRoute: string): Promise<void> {
  try {
    await apiFetch('/presence/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ current_route: currentRoute })
    });
  } catch (err) {
    // Non-blocking background heartbeat
  }
}

export async function getSquadPresence(): Promise<OperativePresenceItem[]> {
  try {
    return await apiFetch('/admin/presence');
  } catch (err: any) {
    console.warn("Backend /admin/presence unavailable, falling back to direct Supabase read:", err);
    try {
      const [{ data: presenceData }, { data: usersData }] = await Promise.all([
        supabase.from('operative_presence').select('*'),
        supabase.from('users').select('id, display_name')
      ]);

      if (usersData && usersData.length > 0) {
        const pMap = new Map((presenceData || []).map((p: any) => [p.user_id, p]));
        const now = Date.now();
        return usersData.map((u: any) => {
          const p = pMap.get(u.id);
          const lastHb = p?.last_heartbeat ? new Date(p.last_heartbeat).getTime() : 0;
          const diffSec = lastHb > 0 ? (now - lastHb) / 1000 : 999999;
          const isOnline = diffSec <= 65;
          return {
            user_id: u.id,
            display_name: u.display_name,
            email: `${u.display_name.toLowerCase()}@glazing.com`,
            is_online: isOnline,
            current_route: p?.current_route || 'dashboard',
            last_heartbeat: p?.last_heartbeat || null,
            last_seen_relative: isOnline ? 'Online now' : (lastHb > 0 ? `${Math.floor(diffSec / 60)}m ago` : 'Offline'),
            active_task_title: null,
            active_timer_mode: null,
            status_label: isOnline ? 'ACTIVE' : 'OFFLINE'
          };
        });
      }
    } catch (e) {
      console.error("Direct Supabase presence fallback failed:", e);
    }
    throw err;
  }
}

export async function getUnmaskedTasks(): Promise<any[]> {
  try {
    return await apiFetch('/admin/tasks');
  } catch (err: any) {
    console.warn("Backend /admin/tasks unavailable, falling back to direct Supabase read:", err);
    try {
      const [{ data: tasksData }, { data: usersData }, { data: goalsData }] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('users').select('id, display_name'),
        supabase.from('goals').select('id, title, category')
      ]);

      if (tasksData) {
        const userMap = new Map((usersData || []).map((u: any) => [u.id, u.display_name]));
        const goalMap = new Map((goalsData || []).map((g: any) => [g.id, g]));

        return tasksData.map((t: any) => {
          const goal = t.goal_id ? goalMap.get(t.goal_id) : null;
          return {
            ...t,
            user_name: userMap.get(t.user_id) || 'Operative',
            goal_title: goal?.title || null,
            category: goal?.category || 'General',
            is_proof_verified: Boolean(t.proof_url),
            proof_feedback: t.proof_url ? 'Proof uploaded' : null
          };
        });
      }
    } catch (e) {
      console.error("Direct Supabase tasks fallback failed:", e);
    }
    throw err;
  }
}

export async function revokeGymVerdict(targetUserId: string, reason: string): Promise<VerdictItem> {
  try {
    return await apiFetch('/admin/verdict/revoke-gym', {
      method: 'POST',
      body: JSON.stringify({ target_user_id: targetUserId, reason })
    });
  } catch (err: any) {
    console.warn("FastAPI revoke-gym failed, executing direct Supabase fallback:", err);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: gymTasks } = await supabase.from('tasks')
        .select('*')
        .eq('user_id', targetUserId)
        .ilike('title', '%gym%')
        .order('created_at', { ascending: false })
        .limit(5);

      const gymTask = (gymTasks || []).find((t: any) => t.created_at && t.created_at.startsWith(todayStr)) || (gymTasks && gymTasks[0]);
      let taskIdStr: string | null = null;
      let ptsDeducted = 5;

      if (gymTask) {
        taskIdStr = gymTask.id;
        ptsDeducted = Number(gymTask.points_earned) || 5;
        await supabase.from('tasks').update({
          status: 'EXPIRED',
          points_earned: 0,
          title: `❌ REVOKED: ${gymTask.title}`
        }).eq('id', taskIdStr);
      }

      const { data: u } = await supabase.from('users').select('total_lifetime_points, display_name').eq('id', targetUserId).single();
      if (u) {
        const newTotal = Math.max(0, (u.total_lifetime_points || 0) - ptsDeducted);
        await supabase.from('users').update({ total_lifetime_points: newTotal }).eq('id', targetUserId);
      }

      const verdict: VerdictItem = {
        id: crypto.randomUUID(),
        target_user_id: targetUserId,
        target_user_name: u?.display_name || 'Operative',
        task_id: taskIdStr,
        task_title: 'Daily Gym Checkpoint',
        action_type: 'REVOKE_GYM',
        reason: reason.trim(),
        points_deducted: ptsDeducted,
        old_values: { status: 'COMPLETED', points: ptsDeducted },
        new_values: { status: 'EXPIRED', points: 0 },
        acknowledged: false,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('verdicts').insert({
          id: verdict.id,
          target_user_id: verdict.target_user_id,
          task_id: verdict.task_id,
          action_type: verdict.action_type,
          reason: verdict.reason,
          points_deducted: verdict.points_deducted,
          old_values: verdict.old_values,
          new_values: verdict.new_values,
          acknowledged: false
        });
      } catch (insertErr) {
        console.warn("Supabase verdict insert warning:", insertErr);
      }

      return verdict;
    } catch (fallbackErr: any) {
      console.error("Direct fallback failed:", fallbackErr);
      throw err;
    }
  }
}

export async function rejectTaskVerdict(taskId: string, reason: string): Promise<VerdictItem> {
  try {
    return await apiFetch('/admin/verdict/reject-task', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, reason })
    });
  } catch (err: any) {
    console.warn("FastAPI reject-task failed, executing direct Supabase fallback:", err);
    try {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task) throw new Error("Target task not found.");

      const targetUid = task.user_id;
      const pointsToDeduct = Number(task.points_earned) || 0;

      await supabase.from('tasks').update({
        status: 'EXPIRED',
        points_earned: 0,
        title: `❌ VOIDED: ${task.title}`
      }).eq('id', taskId);

      if (pointsToDeduct > 0) {
        const { data: u } = await supabase.from('users').select('total_lifetime_points').eq('id', targetUid).single();
        if (u) {
          const newTotal = Math.max(0, (u.total_lifetime_points || 0) - pointsToDeduct);
          await supabase.from('users').update({ total_lifetime_points: newTotal }).eq('id', targetUid);
        }
      }

      const { data: uData } = await supabase.from('users').select('display_name').eq('id', targetUid).single();
      const verdict: VerdictItem = {
        id: crypto.randomUUID(),
        target_user_id: targetUid,
        target_user_name: uData?.display_name || 'Operative',
        task_id: taskId,
        task_title: task.title,
        action_type: 'REJECT_TASK',
        reason: reason.trim(),
        points_deducted: pointsToDeduct,
        old_values: { status: task.status, points: pointsToDeduct },
        new_values: { status: 'EXPIRED', points: 0 },
        acknowledged: false,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('verdicts').insert({
          id: verdict.id,
          target_user_id: verdict.target_user_id,
          task_id: verdict.task_id,
          action_type: verdict.action_type,
          reason: verdict.reason,
          points_deducted: verdict.points_deducted,
          old_values: verdict.old_values,
          new_values: verdict.new_values,
          acknowledged: false
        });
      } catch (insertErr) {
        console.warn("Supabase verdict insert warning:", insertErr);
      }

      return verdict;
    } catch (fallbackErr: any) {
      console.error("Direct fallback failed:", fallbackErr);
      throw err;
    }
  }
}

export async function rewriteTaskVerdict(taskId: string, newTitle: string, newActualHours: number, reason: string): Promise<VerdictItem> {
  try {
    return await apiFetch('/admin/verdict/rewrite-task', {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        new_title: newTitle,
        new_actual_hours: newActualHours,
        reason
      })
    });
  } catch (err: any) {
    console.warn("FastAPI rewrite-task failed, executing direct Supabase fallback:", err);
    try {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task) throw new Error("Target task not found.");

      const oldPoints = Number(task.points_earned) || 0;
      const hours = Number(newActualHours) || 1.0;
      let newPoints = Math.round(hours * 7);
      if (task.status === 'COMPLETED') newPoints += 5;
      const pointDelta = Math.max(0, oldPoints - newPoints);

      await supabase.from('tasks').update({
        title: newTitle.trim(),
        actual_hours: hours,
        points_earned: newPoints
      }).eq('id', taskId);

      if (pointDelta > 0) {
        const { data: u } = await supabase.from('users').select('total_lifetime_points').eq('id', task.user_id).single();
        if (u) {
          const newTotal = Math.max(0, (u.total_lifetime_points || 0) - pointDelta);
          await supabase.from('users').update({ total_lifetime_points: newTotal }).eq('id', task.user_id);
        }
      }

      const { data: uData } = await supabase.from('users').select('display_name').eq('id', task.user_id).single();
      const verdict: VerdictItem = {
        id: crypto.randomUUID(),
        target_user_id: task.user_id,
        target_user_name: uData?.display_name || 'Operative',
        task_id: taskId,
        task_title: newTitle.trim(),
        action_type: 'REWRITE_TASK',
        reason: reason.trim(),
        points_deducted: pointDelta,
        old_values: { title: task.title, hours: task.actual_hours, points: oldPoints },
        new_values: { title: newTitle.trim(), hours, points: newPoints },
        acknowledged: false,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('verdicts').insert({
          id: verdict.id,
          target_user_id: verdict.target_user_id,
          task_id: verdict.task_id,
          action_type: verdict.action_type,
          reason: verdict.reason,
          points_deducted: verdict.points_deducted,
          old_values: verdict.old_values,
          new_values: verdict.new_values,
          acknowledged: false
        });
      } catch (insertErr) {
        console.warn("Supabase verdict insert warning:", insertErr);
      }

      return verdict;
    } catch (fallbackErr: any) {
      console.error("Direct fallback failed:", fallbackErr);
      throw err;
    }
  }
}

export async function revertPendingVerdict(taskId: string, reason: string): Promise<VerdictItem> {
  try {
    return await apiFetch('/admin/verdict/revert-pending', {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId, reason })
    });
  } catch (err: any) {
    console.warn("FastAPI revert-pending failed, executing direct Supabase fallback:", err);
    try {
      const { data: task } = await supabase.from('tasks').select('*').eq('id', taskId).single();
      if (!task) throw new Error("Target task not found.");

      const pointsToDeduct = Number(task.points_earned) || 0;
      await supabase.from('tasks').update({
        status: 'PENDING',
        points_earned: 0,
        completed_at: null,
        proof_url: null
      }).eq('id', taskId);

      if (pointsToDeduct > 0) {
        const { data: u } = await supabase.from('users').select('total_lifetime_points').eq('id', task.user_id).single();
        if (u) {
          const newTotal = Math.max(0, (u.total_lifetime_points || 0) - pointsToDeduct);
          await supabase.from('users').update({ total_lifetime_points: newTotal }).eq('id', task.user_id);
        }
      }

      const { data: uData } = await supabase.from('users').select('display_name').eq('id', task.user_id).single();
      const verdict: VerdictItem = {
        id: crypto.randomUUID(),
        target_user_id: task.user_id,
        target_user_name: uData?.display_name || 'Operative',
        task_id: taskId,
        task_title: task.title,
        action_type: 'REVERT_PENDING',
        reason: reason.trim(),
        points_deducted: pointsToDeduct,
        old_values: { status: 'COMPLETED', points: pointsToDeduct },
        new_values: { status: 'PENDING', points: 0 },
        acknowledged: false,
        created_at: new Date().toISOString()
      };

      try {
        await supabase.from('verdicts').insert({
          id: verdict.id,
          target_user_id: verdict.target_user_id,
          task_id: verdict.task_id,
          action_type: verdict.action_type,
          reason: verdict.reason,
          points_deducted: verdict.points_deducted,
          old_values: verdict.old_values,
          new_values: verdict.new_values,
          acknowledged: false
        });
      } catch (insertErr) {
        console.warn("Supabase verdict insert warning:", insertErr);
      }

      return verdict;
    } catch (fallbackErr: any) {
      console.error("Direct fallback failed:", fallbackErr);
      throw err;
    }
  }
}

export const KNOWN_OPERATIVE_NAMES: Record<string, string> = {
  '3bc1639a-148d-42c3-9dc2-ba6d84547ba1': 'Adityash',
  'cd06e10c-cb1e-4ac4-a8e4-c1dcca5df973': 'Manas',
  'd97c27ee-0548-4a4f-b485-79f974fb6bd1': 'Shivansh',
  '4b4bb28a-7938-468b-b6dd-e7159c96b515': 'Praveen',
  '18baa0cd-2063-4aca-93f8-73cdf97cdd95': 'Harshit'
};

export async function getPendingVerdicts(): Promise<VerdictItem[]> {
  try {
    const list = await apiFetch('/verdicts/pending');
    return (list || []).map((v: any) => ({
      ...v,
      target_user_name: (v.target_user_name && v.target_user_name !== 'Operative')
        ? v.target_user_name
        : (KNOWN_OPERATIVE_NAMES[v.target_user_id] || 'Operative')
    }));
  } catch {
    try {
      const [{ data: vList }, { data: usersData }, { data: tasksData }] = await Promise.all([
        supabase.from('verdicts').select('*').eq('acknowledged', false).order('created_at', { ascending: false }).limit(10),
        supabase.from('users').select('id, display_name'),
        supabase.from('tasks').select('id, title')
      ]);
      const userMap = new Map((usersData || []).map((u: any) => [u.id, u.display_name]));
      const taskMap = new Map((tasksData || []).map((t: any) => [t.id, t.title]));
      return (vList || []).map((v: any) => ({
        ...v,
        target_user_name: userMap.get(v.target_user_id) || KNOWN_OPERATIVE_NAMES[v.target_user_id] || 'Operative',
        task_title: taskMap.get(v.task_id) || v.old_values?.title || v.new_values?.title || (v.action_type === 'REVOKE_GYM' ? 'Daily Gym Checkpoint' : 'Directive')
      })) as VerdictItem[];
    } catch {
      return [];
    }
  }
}

export async function acknowledgeVerdict(verdictId: string): Promise<void> {
  try {
    await apiFetch(`/verdicts/${verdictId}/acknowledge`, { method: 'POST' });
  } catch {
    try {
      await supabase.from('verdicts').update({ acknowledged: true }).eq('id', verdictId);
    } catch {}
  }
}

export async function getVerdictsFeed(): Promise<VerdictItem[]> {
  try {
    const list = await apiFetch('/verdicts/feed');
    return (list || []).map((v: any) => ({
      ...v,
      target_user_name: (v.target_user_name && v.target_user_name !== 'Operative')
        ? v.target_user_name
        : (KNOWN_OPERATIVE_NAMES[v.target_user_id] || 'Operative')
    }));
  } catch {
    try {
      const [{ data: vList }, { data: usersData }, { data: tasksData }] = await Promise.all([
        supabase.from('verdicts').select('*').eq('acknowledged', false).order('created_at', { ascending: false }).limit(20),
        supabase.from('users').select('id, display_name'),
        supabase.from('tasks').select('id, title')
      ]);
      const userMap = new Map((usersData || []).map((u: any) => [u.id, u.display_name]));
      const taskMap = new Map((tasksData || []).map((t: any) => [t.id, t.title]));
      return (vList || []).map((v: any) => ({
        ...v,
        target_user_name: userMap.get(v.target_user_id) || KNOWN_OPERATIVE_NAMES[v.target_user_id] || 'Operative',
        task_title: taskMap.get(v.task_id) || v.old_values?.title || v.new_values?.title || (v.action_type === 'REVOKE_GYM' ? 'Daily Gym Checkpoint' : 'Directive')
      })) as VerdictItem[];
    } catch {
      return [];
    }
  }
}



