import { create } from 'zustand';
import type { Employee, Skill, SkillDistribution } from '@/types';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';

type EmployeePayload = api.EmployeePayload;

interface AppState {
  // Data
  employees: Employee[];
  skills: Skill[];
  skillDistribution: SkillDistribution[];

  // Loading
  loadingEmployees: boolean;
  loadingSkills: boolean;
  loadingDistribution: boolean;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions
  fetchEmployees: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchSkillDistribution: () => Promise<void>;
  addEmployee: (data: EmployeePayload) => Promise<boolean>;
  addSkill: (data: { skill_name: string; category: string; description?: string | null }) => Promise<boolean>;
}

const extractListData = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) {
    return payload as T[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: T[] }).data;
  }

  return [];
};

export const useStore = create<AppState>((set, get) => ({
  employees: [],
  skills: [],
  skillDistribution: [],

  loadingEmployees: false,
  loadingSkills: false,
  loadingDistribution: false,

  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  fetchEmployees: async () => {
    set({ loadingEmployees: true });
    try {
      const res = await api.getEmployees();
      set({ employees: extractListData<Employee>(res.data), loadingEmployees: false });
    } catch {
      toast.error('Failed to fetch employees');
      set({ loadingEmployees: false });
    }
  },

  fetchSkills: async () => {
    set({ loadingSkills: true });
    try {
      const res = await api.getSkills();
      set({ skills: extractListData<Skill>(res.data), loadingSkills: false });
    } catch {
      toast.error('Failed to fetch skills');
      set({ loadingSkills: false });
    }
  },

  fetchSkillDistribution: async () => {
    set({ loadingDistribution: true });
    try {
      const res = await api.getSkillDistribution();
      set({ skillDistribution: res.data, loadingDistribution: false });
    } catch {
      toast.error('Failed to fetch skill distribution');
      set({ loadingDistribution: false });
    }
  },

  addEmployee: async (data) => {
    try {
      const res = await api.addEmployee(data);
      set((s) => ({ employees: [...s.employees, res.data] }));
      toast.success('Employee added successfully!');
      return true;
    } catch {
      toast.error('Failed to add employee');
      return false;
    }
  },

  addSkill: async (data) => {
    try {
      await api.addSkill(data);
      // Refetch skills to get full list
      await get().fetchSkills();
      toast.success('Skill added successfully!');
      return true;
    } catch {
      toast.error('Failed to add skill');
      return false;
    }
  },
}));
