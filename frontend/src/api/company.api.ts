import api from './axios';

export const companyApi = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (data: { name: string; email: string; password: string; website?: string; industry?: string }) =>
    api.post('/api/company/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/api/company/login', data),

  logout: () =>
    api.post('/api/company/logout'),

  refresh: () =>
    api.post('/api/company/refresh'),

  // ── Profile ───────────────────────────────────────────────────────────────
  getProfile: () =>
    api.get('/api/company/profile'),

  updateProfile: (data: { name?: string; website?: string; industry?: string }) =>
    api.patch('/api/company/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch('/api/company/password', data),

  // ── Dashboard ─────────────────────────────────────────────────────────────
  getDashboard: () =>
    api.get('/api/company/dashboard'),

  getRefIDCandidates: (refCode: string) =>
    api.get(`/api/company/refid/${refCode}/candidates`),

  runSandboxQuery: (refCode: string, query: string) =>
    api.post(`/api/company/refid/${refCode}/sandbox`, { query }),

  getCandidateData: (userId: string, permissionId: string) =>
    api.get(`/api/company/candidate/${userId}?permissionId=${permissionId}`),
  

  // ── Access logs ───────────────────────────────────────────────────────────
  getAccessLogs: () =>
    api.get('/api/company/logs'),
};
