import { create } from 'zustand';
import type {
  Employee,
  Skill,
  SkillDistribution,
} from '@/types';
import * as api from '@/lib/api';
import toast from 'react-hot-toast';

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
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  toggleSidebarCollapse: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Actions
  fetchEmployees: () => Promise<void>;
  fetchSkills: () => Promise<void>;
  fetchSkillDistribution: () => Promise<void>;
  addEmployee: (data: Omit<Employee, 'id'>) => Promise<boolean>;
  addSkill: (data: { skill_name: string; category: string }) => Promise<boolean>;
}

export const useStore = create<AppState>((set, get) => ({
  employees: [],
  skills: [],
  skillDistribution: [],

  loadingEmployees: false,
  loadingSkills: false,
  loadingDistribution: false,

  sidebarOpen: false,
  sidebarCollapsed: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSidebarCollapse: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  fetchEmployees: async () => {
    set({ loadingEmployees: true });
    try {
      const res = await api.getEmployees();
      set({ employees: res.data, loadingEmployees: false });
    } catch {
      toast.error('Failed to fetch employees');
      set({ loadingEmployees: false });
    }
  },

  fetchSkills: async () => {
    set({ loadingSkills: true });
    try {
      const res = await api.getSkills();
      set({ skills: res.data, loadingSkills: false });
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
