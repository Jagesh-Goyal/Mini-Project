export type Role = "ADMIN" | "HR_MANAGER" | "TEAM_LEAD" | "EMPLOYEE";

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: Role;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  team: string;
  job_title: string;
  years_experience: number;
  is_active: boolean;
}

export interface SkillPoint {
  employee: string;
  skill: string;
  score: number;
}
