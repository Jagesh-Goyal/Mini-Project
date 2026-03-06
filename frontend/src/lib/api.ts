import axios from 'axios';
import type {
  Employee,
  Skill,
  SkillDistribution,
  SkillGapResult,
  SkillGapPayload,
  Recommendation,
  EmployeeSkillsResponse,
  ForecastResult,
  AssignSkillPayload,
  MLTrainingResult,
  SkillForecastResult,
  ProficiencyDistribution,
  SkillCategoryData,
  ExperienceDistribution,
  DepartmentSkillsAnalytics,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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

// Analytics
export const getSkillDistribution = () =>
  api.get<SkillDistribution[]>('/skill-distribution');

// Skill Gap
export const calculateSkillGap = (data: SkillGapPayload) =>
  api.post<SkillGapResult>('/skill-gap', data);

// Recommendations
export const getRecommendation = (skillName: string, requiredCount: number) =>
  api.get<Recommendation>(`/recommendation/${skillName}`, {
    params: { required_count: requiredCount },
  });

// Employee Skills
export const getEmployeeSkills = (employeeId: number) =>
  api.get<EmployeeSkillsResponse>(`/employee-skills/${employeeId}`);

// Forecast
export const getForecast = (skillName: string) =>
  api.get<ForecastResult>(`/forecast/${skillName}`);

// ML Model APIs
export const trainMLModels = () =>
  api.post<MLTrainingResult>('/ml/train');

export const getSkillForecast = (skillName: string, department: string, monthsAhead: number = 6) =>
  api.get<SkillForecastResult>(`/ml/forecast/${skillName}`, {
    params: { department, months_ahead: monthsAhead },
  });

export const getFeatureImportance = () =>
  api.get('/ml/feature-importance');

// Analytics APIs
export const getDepartmentSkills = () =>
  api.get<DepartmentSkillsAnalytics>('/analytics/department-skills');

export const getProficiencyDistribution = () =>
  api.get<ProficiencyDistribution[]>('/analytics/proficiency-distribution');

export const getSkillCategories = () =>
  api.get<SkillCategoryData[]>('/analytics/skill-categories');

export const getExperienceDistribution = () =>
  api.get<ExperienceDistribution[]>('/analytics/experience-distribution');

export default api;
