import axios from 'axios';
import type {
  Employee,
  Skill,
  SkillDistribution,
  AssignSkillPayload,
  ProficiencyData,
  CategoryData,
  ExperienceData,
  ForecastResult,
} from '@/types';

const BASE_URL = 'http://127.0.0.1:8000';
const AUTH_TOKEN_KEY = 'authToken';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Attach bearer token on every request if logged in.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// If token is invalid/expired, clear local auth and send user to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem('userEmail');

      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  email: string;
}

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  message: string;
  email: string;
  name: string;
}

// Auth
export const signup = (data: SignUpPayload) =>
  api.post<SignUpResponse>('/auth/signup', data);

export const login = (data: LoginPayload) =>
  api.post<LoginResponse>('/auth/login', data);

export const getCurrentUser = () =>
  api.get<{ email: string; role: string }>('/auth/me');

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

// Forecast
export const getForecast = (skillName: string) =>
  api.get<ForecastResult>(`/forecast/${skillName}`);

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
