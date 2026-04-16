const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getUsers: () => request('/auth/users'),
  getUser: (id) => request(`/auth/users/${id}`),
  createUser: (data) => request('/auth/users', { method: 'POST', body: data }),
  loginCaregiver: (email, pin) => request('/auth/caregivers/login', { method: 'POST', body: { email, pin } }),

  startSession: (userId) => request('/conversations/sessions', { method: 'POST', body: { userId } }),
  sendMessage: (sessionId, message) => request(`/conversations/sessions/${sessionId}/message`, { method: 'POST', body: { message } }),
  endSession: (sessionId) => request(`/conversations/sessions/${sessionId}/end`, { method: 'POST' }),
  getUserSessions: (userId) => request(`/conversations/sessions/user/${userId}`),
  getSessionMessages: (sessionId) => request(`/conversations/sessions/${sessionId}/messages`),

  getSchedules: (userId) => request(`/schedules/user/${userId}`),
  createSchedule: (data) => request('/schedules', { method: 'POST', body: data }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: data }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),

  getPendingNudges: (userId) => request(`/nudges/pending/${userId}`),
  acknowledgeNudge: (nudgeLogId) => request(`/nudges/acknowledge/${nudgeLogId}`, { method: 'POST' }),
  triggerNudge: (scheduleId) => request(`/nudges/trigger/${scheduleId}`, { method: 'POST' }),
  getNudgeHistory: (userId) => request(`/nudges/history/${userId}`),
  getNudgeStats: (userId) => request(`/nudges/stats/${userId}`),

  getAnomalies: (userId) => request(`/anomalies/user/${userId}`),
  getAllAnomalies: () => request('/anomalies'),
  resolveAnomaly: (id, data) => request(`/anomalies/${id}/resolve`, { method: 'POST', body: data }),
  runDetection: () => request('/anomalies/detect', { method: 'POST' }),

  getWeeklyReports: (userId) => request(`/reports/weekly/${userId}`),
  generateReport: (userId) => request(`/reports/weekly/${userId}/generate`, { method: 'POST' }),
  getDashboard: (userId) => request(`/reports/dashboard/${userId}`)
};
