import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';

import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';

vi.mock('@/lib/api', () => ({
  getEmployees: vi.fn(),
  getSkills: vi.fn(),
  getSkillDistribution: vi.fn(),
  addEmployee: vi.fn(),
  addSkill: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);
const mockedToast = vi.mocked(toast);

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      employees: [],
      skills: [],
      skillDistribution: [],
      loadingEmployees: false,
      loadingSkills: false,
      loadingDistribution: false,
      sidebarOpen: false,
    });
    vi.clearAllMocks();
  });

  it('toggles sidebar state', () => {
    expect(useStore.getState().sidebarOpen).toBe(false);

    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarOpen).toBe(true);

    useStore.getState().toggleSidebar();
    expect(useStore.getState().sidebarOpen).toBe(false);
  });

  it('fetchEmployees stores API data', async () => {
    mockedApi.getEmployees.mockResolvedValue({
      data: [
        {
          id: 1,
          name: 'Alice',
          department: 'Engineering',
          role: 'Developer',
          year_exp: 4,
        },
      ],
    } as never);

    await useStore.getState().fetchEmployees();

    expect(useStore.getState().employees).toHaveLength(1);
    expect(useStore.getState().employees[0].name).toBe('Alice');
    expect(useStore.getState().loadingEmployees).toBe(false);
  });

  it('fetchEmployees handles API failure', async () => {
    mockedApi.getEmployees.mockRejectedValue(new Error('network'));

    await useStore.getState().fetchEmployees();

    expect(useStore.getState().loadingEmployees).toBe(false);
    expect(mockedToast.error).toHaveBeenCalledWith('Failed to fetch employees');
  });

  it('addEmployee appends employee on success', async () => {
    mockedApi.addEmployee.mockResolvedValue({
      data: {
        id: 7,
        name: 'Bob',
        department: 'Data',
        role: 'Analyst',
        year_exp: 2,
      },
    } as never);

    const ok = await useStore.getState().addEmployee({
      name: 'Bob',
      department: 'Data',
      role: 'Analyst',
      year_exp: 2,
    });

    expect(ok).toBe(true);
    expect(useStore.getState().employees).toHaveLength(1);
    expect(useStore.getState().employees[0].name).toBe('Bob');
    expect(mockedToast.success).toHaveBeenCalledWith('Employee added successfully!');
  });

  it('addSkill refreshes skills list on success', async () => {
    mockedApi.addSkill.mockResolvedValue({ data: { message: 'ok' } } as never);
    mockedApi.getSkills.mockResolvedValue({
      data: [
        {
          id: 11,
          skill_name: 'FastAPI',
          category: 'Backend',
        },
      ],
    } as never);

    const ok = await useStore.getState().addSkill({
      skill_name: 'FastAPI',
      category: 'Backend',
    });

    expect(ok).toBe(true);
    expect(useStore.getState().skills).toHaveLength(1);
    expect(useStore.getState().skills[0].skill_name).toBe('FastAPI');
    expect(mockedToast.success).toHaveBeenCalledWith('Skill added successfully!');
  });

  it('addSkill handles API failure', async () => {
    mockedApi.addSkill.mockRejectedValue(new Error('bad request'));

    const ok = await useStore.getState().addSkill({
      skill_name: 'React',
      category: 'Frontend',
    });

    expect(ok).toBe(false);
    expect(mockedToast.error).toHaveBeenCalledWith('Failed to add skill');
  });
});
