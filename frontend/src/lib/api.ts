import axios from 'axios';
import type {
  Employee,
  Skill,
  SkillDistribution,
  AssignSkillPayload,
  ProficiencyData,
  CategoryData,
  ExperienceData,
} from '@/types';

const BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Health check
export const healthCheck = () => api.get('/');

// Employees
export const getEmployees = () => api.get<Employee[]>('/employees');
export const addEmployee = (data: Omit<Employee, 'id'>) =>
  api.post<Employee>('/employees', data);

// Skills
export const getSkills = () => api.get<Skill[]>('/skills');
export const addSkill = (data: { skill_name: string; category: string }) =>
  api.post('/skills', data);

// Assign skill
export const assignSkill = (data: AssignSkillPayload) =>
  api.post('/assign-skill', data);

// Skill Gap & Recommendations
export const calculateSkillGap = (data: { skill_name: string; required_count: number }) =>
  api.post('/skill-gap', data);

export const getRecommendation = (skillName: string, requiredCount: number) =>
  api.get(`/recommendation/${skillName}`, { params: { required_count: requiredCount } });

// Analytics
export const getSkillDistribution = () =>
  api.get<SkillDistribution[]>('/skill-distribution');

export const getProficiencyDistribution = () =>
  api.get<ProficiencyData[]>('/analytics/proficiency-distribution');

export const getSkillCategories = () =>
  api.get<CategoryData[]>('/analytics/skill-categories');

export const getExperienceDistribution = () =>
  api.get<ExperienceData[]>('/analytics/experience-distribution');

export default api;
