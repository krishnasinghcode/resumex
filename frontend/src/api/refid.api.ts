import api from './axios';

export interface RequestedField {
  section: string;
  fields?: string[];
}

export const refidApi = {
  // ── Candidate-facing ──────────────────────────────────────────────────────
  getByCode:   (code: string) =>
    api.get(`/api/refid/${code}`),

  grantAccess: (code: string) =>
    api.post(`/api/refid/${code}/grant`),

  getMyGrants: () =>
    api.get('/api/refid/grants/mine'),

  revokeGrant: (permissionId: string) =>
    api.delete(`/api/refid/grants/${permissionId}`),

  // ── Company-facing ────────────────────────────────────────────────────────
  createRefID: (data: {
    jobTitle:        string;
    requestedFields: RequestedField[];
    accessDuration:  number;
  }) => api.post('/api/refid', data),

  deactivateRefID: (code: string) =>
    api.patch(`/api/refid/${code}/deactivate`),

  activateRefID: (code: string) =>
    api.patch(`/api/refid/${code}/activate`),
};
