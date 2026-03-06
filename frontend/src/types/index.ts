// Types for the Dakshtra AI Workforce Platform

export interface Employee {
  id: number;
  name: string;
  department: string;
  role: string;
  year_exp: number;
}

export interface Skill {
  id: number;
  skill_name: string;
  category: string;
}

export interface EmployeeSkillMapping {
  skill_name: string;
  proficiency_level: number;
}

export interface EmployeeSkillsResponse {
  employee_name: string;
  skills: EmployeeSkillMapping[];
}

export interface SkillDistribution {
  skill_name: string;
  employee_count: number;
}

export interface SkillGapResult {
  skill_name?: string;
  required?: number;
  current?: number;
  gap?: number;
  error?: string;
}

export interface Recommendation {
  skill?: string;
  required?: number;
  current?: number;
  gap?: number;
  recommendation?: string;
  error?: string;
}

export interface ForecastResult {
  skill: string;
  predicted_demand_next_month: number;
}

export interface SkillForecastPoint {
  month: string;
  predicted_demand: number;
  estimated_supply: number;
  predicted_gap: number;
}

export interface SkillForecastResult {
  skill: string;
  department: string;
  months_ahead: number;
  forecast: SkillForecastPoint[];
}

export interface MLTrainingResult {
  demand_forecasting: {
    r2_score: number;
    mae?: number;
    rmse?: number;
  };
  turnover_prediction: {
    accuracy: number;
    precision?: number;
    recall?: number;
    f1_score?: number;
  };
  dataset_info: {
    historical_records: number;
    feature_count?: number;
  };
  message?: string;
}

export interface ProficiencyDistribution {
  level_name: string;
  count: number;
}

export interface SkillCategoryData {
  category: string;
  total_assignments: number;
}

export interface ExperienceDistribution {
  experience_range: string;
  employee_count: number;
}

export interface DepartmentSkillsAnalytics {
  department: string;
  skill_count: number;
  avg_proficiency?: number;
}

export interface AssignSkillPayload {
  employee_id: number;
  skill_id: number;
  proficiency_level: number;
}

export interface SkillGapPayload {
  skill_name: string;
  required_count: number;
}
