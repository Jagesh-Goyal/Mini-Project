// Simple Types for Dakshtra Workforce Platform

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

export interface SkillDistribution {
  skill_name: string;
  employee_count: number;
}

export interface ProficiencyData {
  level: number;
  level_name: string;
  count: number;
}

export interface CategoryData {
  category: string;
  total_assignments: number;
}

export interface ExperienceData {
  experience_range: string;
  count: number;
}

export interface AssignSkillPayload {
  employee_id: number;
  skill_id: number;
  proficiency_level: number;
}

export interface ForecastResult {
  skill: string;
  predicted_demand_next_month: number;
}
