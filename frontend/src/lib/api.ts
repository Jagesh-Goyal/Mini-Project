import axios from 'axios';
import type {
  Employee,
  Skill,
  SkillDistribution,
  AssignSkillPayload,
  ForecastResult,
  SkillHeatmapResponse,
  WorkforceRiskResponse,
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
export const updateEmployee = (id: number, data: Omit<Employee, 'id'>) =>
  api.put<Employee>(`/employees/${id}`, data);
export const deleteEmployee = (id: number) =>
  api.delete(`/employees/${id}`);

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

export const getWorkforceRiskAnalysis = () =>
  api.get<WorkforceRiskResponse>('/analytics/workforce-risk');

export const getSkillHeatmap = () =>
  api.get<SkillHeatmapResponse>('/analytics/skill-heatmap');

// ML Models
export const trainMLModels = () =>
  api.post('/ml/train');

export interface MLForecastRow {
  month: number;
  date: string;
  demand: number;
  supply: number;
  gap: number;
}

export interface MLForecastResponse {
  skill: string;
  months_ahead: number;
  scenario: 'conservative' | 'balanced' | 'aggressive';
  forecasts: Record<string, MLForecastRow[]>;
}

export const forecastSkillDemand = (
  skillName: string,
  monthsAhead: number = 3,
  department?: string,
  scenario: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
) =>
  api.get<MLForecastResponse>(`/ml/forecast/${skillName}`, {
    params: { months_ahead: monthsAhead, department, scenario },
  });

export const getTurnoverRisk = (employeeId: number) =>
  api.get(`/ml/turnover-risk/${employeeId}`);

// Resume Upload
export interface ResumeMappedSkill {
  skill_name: string;
  skill_id: number;
}

export interface ResumeExtractionResult {
  status: string;
  message: string;
  extracted_skills: string[];
  mapped_skills: ResumeMappedSkill[];
  experience_years: number;
  name: string;
}

export interface CreateEmployeeFromResumeResponse {
  status: string;
  message: string;
  employee_id: number;
  assigned_skills: number;
}

export const uploadResume = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post<ResumeExtractionResult>('/upload-resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const createEmployeeFromResume = (data: {
  name: string;
  department: string;
  role: string;
  experience_years: number;
  proficiency_level: number;
  skill_ids: number[];
}) =>
  api.post<CreateEmployeeFromResumeResponse>('/create-employee-from-resume', data);

// Job Description Parser
export interface JDSkillAnalysis {
  skill_name: string;
  skill_id: number | null;
  current_count: number;
  in_database: boolean;
}

export interface JDParseResponse {
  status: string;
  total_skills_found: number;
  total_matched_in_db: number;
  skill_analysis: JDSkillAnalysis[];
}

export const parseJobDescription = (jd_text: string) =>
  api.post<JDParseResponse>('/parse-jd', { jd_text });

export default api;
