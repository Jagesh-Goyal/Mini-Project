import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
import { Users, Zap, ShieldCheck, AlertTriangle, Brain, CheckCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import MetricCard, {
  PageWrapper,
  SectionHeader,
  SkeletonCard,
  SkeletonRow,
  EmptyState,
} from '@/components/ui';

const barColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#ec4899', '#14b8a6'];
const pieColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

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

  const [proficiencyData, setProficiencyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [experienceData, setExperienceData] = useState<any[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [mlTraining, setMlTraining] = useState(false);
  const [mlTrained, setMlTrained] = useState(false);
  const [mlMetrics, setMlMetrics] = useState<any>(null);

  useEffect(() => {
    fetchEmployees();
    fetchSkills();
    fetchSkillDistribution();
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const [prof, cat, exp] = await Promise.all([
        api.getProficiencyDistribution(),
        api.getSkillCategories(),
        api.getExperienceDistribution(),
      ]);
      setProficiencyData(prof.data);
      setCategoryData(cat.data);
      setExperienceData(exp.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleTrainML = async () => {
    setMlTraining(true);
    try {
      const response = await api.trainMLModels();
      setMlMetrics(response.data);
      setMlTrained(true);
      setTimeout(() => setMlTrained(false), 3000);
    } catch (error) {
      console.error('ML training failed:', error);
    } finally {
      setMlTraining(false);
    }
  };

  const avgCoverage =
    skillDistribution.length > 0
      ? Math.round(
          skillDistribution.reduce((sum, s) => sum + s.employee_count, 0) /
            skillDistribution.length
        )
      : 0;

  const criticalGaps = skillDistribution.filter((s) => s.employee_count <= 1).length;

  const isLoading = loadingEmployees || loadingSkills || loadingDistribution;

  return (
    <PageWrapper>
      {/* Metric Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Employees"
              value={employees.length}
              icon={Users}
              color="blue"
              delay={0}
            />
            <MetricCard
              title="Total Skills"
              value={skills.length}
              icon={Zap}
              color="purple"
              delay={0.1}
            />
            <MetricCard
              title="Avg Coverage"
              value={avgCoverage}
              icon={ShieldCheck}
              color="cyan"
              suffix="emp"
              delay={0.2}
            />
            <MetricCard
              title="Critical Gaps"
              value={criticalGaps}
              icon={AlertTriangle}
              color="rose"
              delay={0.3}
            />
          </>
        )}
      </motion.div>

      {/* ML Training Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="glass-card-static p-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              ML Model Training
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Train AI models for demand forecasting and turnover prediction
            </p>
          </div>
          <button
            onClick={handleTrainML}
            disabled={mlTraining}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
              mlTraining
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : mlTrained
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/25'
            }`}
          >
            {mlTraining ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Training...
              </span>
            ) : mlTrained ? (
              <span className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Trained!
              </span>
            ) : (
              'Train Models'
            )}
          </button>
        </div>
        {mlMetrics && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/[0.03] rounded-xl p-3">
              <p className="text-xs text-slate-400">Demand Model R²</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {(mlMetrics.demand_forecasting.r2_score * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <p className="text-xs text-slate-400">Turnover Accuracy</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">
                {(mlMetrics.turnover_prediction.accuracy * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <p className="text-xs text-slate-400">Training Records</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {mlMetrics.dataset_info.historical_records}
              </p>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Skill Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="xl:col-span-2 glass-card-static p-5"
        >
          <SectionHeader
            title="Skill Distribution"
            description="Number of employees per skill"
          />
          {loadingDistribution ? (
            <div className="skeleton h-64 w-full rounded-xl mt-4" />
          ) : skillDistribution.length === 0 ? (
            <EmptyState message="No skill data available yet" />
          ) : (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDistribution} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="skill_name"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: 13,
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="employee_count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                    {skillDistribution.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Recent Employees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass-card-static p-5 overflow-hidden"
        >
          <SectionHeader title="Recent Employees" />
          {loadingEmployees ? (
            <div className="mt-4 space-y-2">
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : employees.length === 0 ? (
            <EmptyState message="No employees yet" icon={Users} />
          ) : (
            <div className="mt-4 space-y-1 max-h-64 overflow-y-auto">
              {employees.slice(-8).reverse().map((emp, i) => (
                <motion.div
                  key={emp.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.03] transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.role}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 bg-white/[0.03] px-2 py-1 rounded-lg">
                    {emp.department}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Additional Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proficiency Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="glass-card-static p-5"
        >
          <SectionHeader
            title="Proficiency Distribution"
            description="Skill levels across workforce"
          />
          {loadingAnalytics ? (
            <div className="skeleton h-64 w-full rounded-xl mt-4" />
          ) : proficiencyData.length === 0 ? (
            <EmptyState message="No proficiency data available" />
          ) : (
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={proficiencyData}
                    dataKey="count"
                    nameKey="level_name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={(entry: any) => `${entry.level_name}: ${entry.count}`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {proficiencyData.map((_, index) => (
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Skill Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="glass-card-static p-5"
        >
          <SectionHeader
            title="Skill Categories"
            description="Distribution by category"
          />
          {loadingAnalytics ? (
            <div className="skeleton h-64 w-full rounded-xl mt-4" />
          ) : categoryData.length === 0 ? (
            <EmptyState message="No category data available" />
          ) : (
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="total_assignments"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    label={(entry: any) => `${entry.category}: ${entry.total_assignments}`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Experience Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="glass-card-static p-5 lg:col-span-2"
        >
          <SectionHeader
            title="Experience Distribution"
            description="Employee count by experience level"
          />
          {loadingAnalytics ? (
            <div className="skeleton h-64 w-full rounded-xl mt-4" />
          ) : experienceData.length === 0 ? (
            <EmptyState message="No experience data available" />
          ) : (
            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={experienceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="experience_range"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15,15,25,0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={100}>
                    {experienceData.map((_, index) => (
                      <Cell key={index} fill={barColors[index % barColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </PageWrapper>
  );
}
