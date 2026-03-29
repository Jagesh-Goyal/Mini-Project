import apiClient from './apiClient';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  role: string;
  skills: string[];
}

export const employeeApi = {
  list: () =>
    apiClient.get<{ data: Employee[] }>('/employees'),

  get: (id: string) =>
    apiClient.get<Employee>(`/employees/${id}`),

  create: (data: Omit<Employee, 'id'>) =>
    apiClient.post<Employee>('/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    apiClient.put<Employee>(`/employees/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/employees/${id}`),

  getSkills: (id: string) =>
    apiClient.get(`/employees/${id}/skills`),

  addSkill: (id: string, skillId: string) =>
    apiClient.post(`/employees/${id}/skills`, { skill_id: skillId }),

  removeSkill: (id: string, skillId: string) =>
    apiClient.delete(`/employees/${id}/skills/${skillId}`),
};
