
import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { Users, Zap, TrendingUp, BarChart3 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import type { ProficiencyData, CategoryData } from '@/types';

const barColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];
const pieColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

export default function Dashboard() {
  const {
    employees,
    skills,
    skillDistribution,
    loadingEmployees,
    loadingSkills,
    loadingDistribution,
    fetchEmployees,
    fetchSkills,
    fetchSkillDistribution,
  } = useStore();

  const [proficiencyData, setProficiencyData] = useState<ProficiencyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchSkills();
    fetchSkillDistribution();
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [prof, cat] = await Promise.all([
        api.getProficiencyDistribution(),
        api.getSkillCategories(),
      ]);
      setProficiencyData(prof.data);
      setCategoryData(cat.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loadingEmployees || loadingSkills || loadingDistribution || loading;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold text-white">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Skills</p>
              <p className="text-2xl font-bold text-white">{skills.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Skill Assignments</p>
              <p className="text-2xl font-bold text-white">
                {skillDistribution.reduce((sum, s) => sum + s.employee_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Categories</p>
              <p className="text-2xl font-bold text-white">{categoryData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Distribution Bar Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Skill Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : skillDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="skill_name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="employee_count" radius={[4, 4, 0, 0]}>
                    {skillDistribution.map((_, i) => (
                      <Cell key={i} fill={barColors[i % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Proficiency Pie Chart */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Proficiency Levels</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : proficiencyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proficiencyData}
                    dataKey="count"
                    nameKey="level_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${String(name)}: ${String(value)}`}
                  >
                    {proficiencyData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Bar Chart */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Skills by Category</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
        ) : categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis dataKey="category" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} width={100} />
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="total_assignments" radius={[0, 4, 4, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Employees */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Employees</h3>
        {loadingEmployees ? (
          <div className="text-slate-400">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="text-slate-400">No employees yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Experience</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(-5).reverse().map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-700/50 text-sm">
                    <td className="py-3 text-white font-medium">{emp.name}</td>
                    <td className="py-3 text-slate-300">{emp.department}</td>
                    <td className="py-3 text-slate-300">{emp.role}</td>
                    <td className="py-3 text-slate-300">{emp.year_exp} years</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
