// Simple Types for Dakshtra Workforce Platform

export interface Employee {
  id: number;
  employee_code: string | null;
  name: string;
  email: string;
  department: string;
  role: string;
  year_exp: number;
  join_date: string | null;
  manager: string | null;
  performance_score: number;
  team_name: string | null;
}

export interface Skill {
  id: number;
  skill_name: string;
  category: string;
  description: string | null;
}

export interface EmployeeProfileSkill {
  skill_id: number;
  skill_name: string;
  category: string;
  proficiency_level: number;
  proficiency_label: string;
}

export interface TrainingHistoryEntry {
  id: number;
  training_name: string;
  provider: string | null;
  status: string;
  focus_skill: string | null;
  duration_hours: number | null;
  completion_date: string | null;
}

export interface EmployeeProfile {
  employee: Employee;
  skills: EmployeeProfileSkill[];
  training_history: TrainingHistoryEntry[];
}

export interface CurrentUser {
  email: string;
  name: string;
  role: string;
  role_label?: string;
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

export interface SkillGapOverviewScope {
  scope: string;
  total_available: number;
  total_required: number;
  total_gap: number;
  critical_skills: SkillHeatmapRow[];
  rows: SkillHeatmapRow[];
}

export interface SkillGapOverviewResponse {
  generated_at: string;
  organization: SkillGapOverviewScope;
  departments: SkillGapOverviewScope[];
  teams: SkillGapOverviewScope[];
}

export interface RecommendationCandidate {
  employee_id: number;
  employee_name: string;
  department: string;
  team_name: string | null;
}

export interface TransferRecommendationCandidate extends RecommendationCandidate {
  proficiency_label: string;
}

export interface UpskillRecommendationCandidate extends RecommendationCandidate {
  performance_score: number;
}

export interface StrategicRecommendation {
  skill: string;
  required: number;
  current: number;
  gap: number;
  recommendation: string;
  hire_count: number;
  upskill_count: number;
  transfer_count: number;
  internal_transfer_candidates: TransferRecommendationCandidate[];
  upskill_candidates: UpskillRecommendationCandidate[];
  recommended_actions: Array<string | null>;
  decision_scores?: {
    hire_pressure: number;
    upskill_fit: number;
    transfer_readiness: number;
  };
  decision_rationale?: string[];
}

export type ReportFormat = 'csv' | 'xlsx' | 'pdf';

export interface HiringTrendRow {
  month: string;
  hires: number;
  running_total: number;
}

export interface HiringTrendsResponse {
  generated_at: string;
  months: number;
  total_hires: number;
  trends: HiringTrendRow[];
}

export interface AdvisorActionCard {
  title: string;
  priority: RiskLevel;
  action: string;
}

export interface WorkforceAdvisorResponse {
  mode: 'llm' | 'fallback';
  query: string;
  department: string | null;
  scenario: 'conservative' | 'balanced' | 'aggressive';
  answer: string;
  action_cards: AdvisorActionCard[];
  follow_up_questions: string[];
  kpis: {
    employees: number;
    critical_gap_count: number;
    medium_gap_count: number;
  };
  snapshot_generated_at: string;
}
