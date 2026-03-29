import apiClient from './apiClient';

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency_level: string;
  demand_forecast: number;
}

export const skillApi = {
  list: () =>
    apiClient.get<{ data: Skill[] }>('/skills'),

  get: (id: string) =>
    apiClient.get<Skill>(`/skills/${id}`),

  create: (data: Omit<Skill, 'id'>) =>
    apiClient.post<Skill>('/skills', data),

  update: (id: string, data: Partial<Skill>) =>
    apiClient.put<Skill>(`/skills/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/skills/${id}`),

  getDemandForecast: () =>
    apiClient.get('/skills/forecast/demand'),

  getGapAnalysis: () =>
    apiClient.get('/skills/analysis/gap'),

  scenarioForecast: (growth: number) =>
    apiClient.post('/skills/forecast/scenario', { growth_rate: growth }),

  heatmap: () =>
    apiClient.get('/skills/heatmap'),
};
