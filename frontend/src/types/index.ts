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

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface WorkforceRiskIssue {
  type: 'critical_skill_shortage' | 'single_skill_dependency' | 'lack_of_backup_employees';
  severity: RiskLevel;
  description: string;
  impacted_skills: string[];
}

export interface WorkforceTeamRisk {
  department: string;
  team_label: string;
  risk_level: RiskLevel;
  risk_score: number;
  summary: string;
  employee_count: number;
  unique_skill_count: number;
  backup_coverage: number;
  issues: WorkforceRiskIssue[];
}

export interface WorkforceRiskResponse {
  generated_at: string;
  overall_risk: RiskLevel;
  top_risk_summary: string;
  teams: WorkforceTeamRisk[];
}

export type HeatmapStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface SkillHeatmapRow {
  skill: string;
  category: string;
  available: number;
  required: number;
  gap: number;
  status: HeatmapStatus;
  status_label: 'Balanced' | 'Medium Gap' | 'Critical Gap';
  coverage_ratio: number;
}

export interface SkillHeatmapResponse {
  generated_at: string;
  legend: Record<HeatmapStatus, 'Balanced' | 'Medium Gap' | 'Critical Gap'>;
  rows: SkillHeatmapRow[];
}

export interface UpskillingRecommendation {
  employee_id: number;
  employee_name: string;
  department: string;
  current_skills: string[];
  recommended_skills: string[];
  priority: RiskLevel;
  rationale: string;
}

export interface UpskillingRecommendationsResponse {
  generated_at: string;
  high_gap_skills: Array<{
    skill: string;
    gap: number;
    status_label: 'Balanced' | 'Medium Gap' | 'Critical Gap';
  }>;
  recommendations: UpskillingRecommendation[];
}
