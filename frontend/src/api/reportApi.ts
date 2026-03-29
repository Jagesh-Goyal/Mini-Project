import apiClient from './apiClient';

export interface Report {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  path?: string;
}

export const reportApi = {
  list: () =>
    apiClient.get<{ data: Report[] }>('/reports'),

  get: (id: string) =>
    apiClient.get<Report>(`/reports/${id}`),

  create: (data: Omit<Report, 'id' | 'createdAt'>) =>
    apiClient.post<Report>('/reports', data),

  download: (id: string) =>
    apiClient.get(`/reports/${id}/download`, { responseType: 'blob' }),

  delete: (id: string) =>
    apiClient.delete(`/reports/${id}`),

  generateSkillGapReport: () =>
    apiClient.post('/reports/generate/skill-gap'),

  generateForecastReport: () =>
    apiClient.post('/reports/generate/forecast'),

  generateRiskReport: () =>
    apiClient.post('/reports/generate/risk'),

  workforceSummary: () =>
    apiClient.get('/reports/workforce-summary'),

  skillGap: () =>
    apiClient.get('/reports/skill-gap'),

  forecast: () =>
    apiClient.get('/reports/forecast'),
};
