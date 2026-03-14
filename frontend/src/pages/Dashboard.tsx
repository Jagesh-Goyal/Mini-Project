import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';
import type {
  RiskLevel,
  SkillHeatmapResponse,
  WorkforceRiskResponse,
} from '@/types';

type Tone = 'high' | 'medium' | 'low';

interface DashboardInsight {
  title: string;
  detail: string;
  tone: Tone;
  emoji: string;
}

interface DashboardAction {
  title: string;
  detail: string;
  tone: Tone;
  emoji: string;
}

const insightToneClasses: Record<Tone, string> = {
  high: 'border-rose-500/35 bg-rose-500/10 text-rose-100',
  medium: 'border-amber-400/35 bg-amber-400/10 text-amber-100',
  low: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-100',
};

const actionToneClasses: Record<Tone, string> = {
  high: 'border-rose-500/30 bg-rose-500/8',
  medium: 'border-amber-400/30 bg-amber-400/8',
  low: 'border-emerald-400/30 bg-emerald-400/8',
};

const gapStatusClasses: Record<'GREEN' | 'YELLOW' | 'RED', string> = {
  GREEN: 'bg-emerald-500/20 border-emerald-400/35 text-emerald-100',
  YELLOW: 'bg-amber-500/20 border-amber-400/35 text-amber-100',
  RED: 'bg-rose-500/20 border-rose-400/35 text-rose-100',
};

const riskPillClassByLevel: Record<RiskLevel, string> = {
  HIGH: 'risk-high',
  MEDIUM: 'risk-medium',
  LOW: 'risk-low',
};

const containsAny = (value: string, keywords: string[]) => {
  const normalized = value.toLowerCase();
  return keywords.some((word) => normalized.includes(word));
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

  const [workforceRiskData, setWorkforceRiskData] = useState<WorkforceRiskResponse | null>(null);
  const [skillHeatmapData, setSkillHeatmapData] = useState<SkillHeatmapResponse | null>(null);
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
      const [risk, heatmap] = await Promise.all([
        api.getWorkforceRiskAnalysis(),
        api.getSkillHeatmap(),
      ]);
      setWorkforceRiskData(risk.data);
      setSkillHeatmapData(heatmap.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const departmentData = Object.values(
    employees.reduce<Record<string, { department: string; count: number }>>((acc, employee) => {
      const key = employee.department || 'Unknown';
      if (!acc[key]) {
        acc[key] = { department: key, count: 0 };
      }
      acc[key].count += 1;
      return acc;
    }, {})
  );

  const proficiencyData = skillDistribution.map((skill) => ({
    level_name: skill.skill_name,
    count: skill.employee_count,
    status: 'ok',
  }));

  const categoryData = skillDistribution.map((skill) => ({
    category: skill.skill_name.split('_')[0] || skill.skill_name,
    total_assignments: skill.employee_count,
    status: 'ok',
  }));

  const experienceData = employees.reduce<Record<string, { experience_range: string; count: number }>>((acc, emp) => {
    const range = emp.year_exp <= 2 ? '0-2 years' : emp.year_exp <= 5 ? '3-5 years' : '5+ years';
    if (!acc[range]) {
      acc[range] = { experience_range: range, count: 0 };
    }
    acc[range].count += 1;
    return acc;
  }, {});

  const experienceDataArray = Object.values(experienceData);

  const isLoading = loadingEmployees || loadingSkills || loadingDistribution || loading;

  const riskWatch = useMemo(
    () => ({
      summary: workforceRiskData?.top_risk_summary ?? 'Risk analysis is collecting signals',
      level: workforceRiskData?.overall_risk ?? 'LOW',
    }),
    [workforceRiskData]
  );

  const topSkillGaps = useMemo(() => {
    const rows = [...(skillHeatmapData?.rows ?? [])];
    rows.sort((a, b) => b.gap - a.gap || b.required - a.required);
    const withGap = rows.filter((row) => row.gap > 0);
    return (withGap.length > 0 ? withGap : rows).slice(0, 5);
  }, [skillHeatmapData]);

  const futureDemandPreview = useMemo(() => {
    const rows = skillHeatmapData?.rows ?? [];
    const overallBoost =
      riskWatch.level === 'HIGH'
        ? 6
        : riskWatch.level === 'MEDIUM'
          ? 3
          : 0;

    const growthFor = (keywords: string[], baseline: number) => {
      const matched = rows.filter(
        (row) => containsAny(row.skill, keywords) || containsAny(row.category, keywords)
      );

      if (matched.length === 0) {
        return baseline + overallBoost;
      }

      const totalGap = matched.reduce((sum, row) => sum + row.gap, 0);
      const totalRequired = matched.reduce((sum, row) => sum + row.required, 0);
      const gapRatio = totalRequired > 0 ? totalGap / totalRequired : 0;

      return Math.min(
        85,
        Math.max(
          baseline + overallBoost,
          Math.round(baseline + (gapRatio * 55) + (totalGap * 4))
        )
      );
    };

    return [
      { domain: 'AI/ML', growth: growthFor(['ai', 'ml', 'machine learning', 'tensorflow', 'spark', 'airflow'], 40) },
      { domain: 'Cloud', growth: growthFor(['cloud', 'devops', 'aws', 'kubernetes', 'docker', 'terraform'], 30) },
      { domain: 'Cybersecurity', growth: growthFor(['security', 'cyber'], 24) },
    ];
  }, [skillHeatmapData, riskWatch.level]);

  const aiInsights = useMemo<DashboardInsight[]>(() => {
    const insights: DashboardInsight[] = [];

    const devopsTeam = workforceRiskData?.teams.find((team) =>
      containsAny(team.department, ['devops'])
    );
    const devopsGap = topSkillGaps.find(
      (row) =>
        containsAny(row.skill, ['devops', 'kubernetes', 'docker', 'aws']) ||
        containsAny(row.category, ['devops', 'cloud'])
    );
    const devopsShortage = Boolean(
      (devopsTeam && devopsTeam.risk_level !== 'LOW') || ((devopsGap?.gap ?? 0) >= 2)
    );

    insights.push({
      title: devopsShortage ? 'DevOps team skill shortage detected' : 'DevOps team capacity is stable',
      detail: devopsShortage
        ? `Risk level ${devopsTeam?.risk_level ?? 'MEDIUM'} with key gap on ${devopsGap?.skill ?? 'critical cloud skills'}`
        : 'Current team coverage is currently healthy for core DevOps operations',
      tone: devopsShortage ? 'high' : 'low',
      emoji: '🛡️',
    });

    const kubernetesRow = skillHeatmapData?.rows.find(
      (row) => row.skill.toLowerCase() === 'kubernetes'
    );
    if (kubernetesRow) {
      insights.push({
        title: `Only ${kubernetesRow.available} Kubernetes expert${kubernetesRow.available === 1 ? '' : 's'} available`,
        detail: `Required ${kubernetesRow.required}, available ${kubernetesRow.available}, current gap ${kubernetesRow.gap}`,
        tone: kubernetesRow.available <= 1 ? 'high' : kubernetesRow.gap >= 2 ? 'medium' : 'low',
        emoji: '⚠️',
      });
    }

    const aiMlGrowth = futureDemandPreview.find((item) => item.domain === 'AI/ML')?.growth ?? 40;
    insights.push({
      title: `AI/ML demand expected to grow by ${aiMlGrowth}%`,
      detail: 'Projected growth derived from high-gap AI/ML and analytics skill clusters',
      tone: aiMlGrowth >= 50 ? 'high' : aiMlGrowth >= 35 ? 'medium' : 'low',
      emoji: '📈',
    });

    const backendTeam = workforceRiskData?.teams.find((team) =>
      containsAny(team.department, ['engineering', 'backend'])
    );
    const backendOverloaded = Boolean(backendTeam && backendTeam.risk_level !== 'LOW');
    insights.push({
      title: backendOverloaded ? 'Backend team overloaded' : 'Backend workload appears balanced',
      detail: backendOverloaded
        ? `${backendTeam?.summary}. Backup coverage ${Math.round((backendTeam?.backup_coverage ?? 0) * 100)}%`
        : 'No major overload signal detected from current risk and backup coverage indicators',
      tone: backendOverloaded ? (backendTeam?.risk_level === 'HIGH' ? 'high' : 'medium') : 'low',
      emoji: '🧠',
    });

    return insights.slice(0, 4);
  }, [futureDemandPreview, skillHeatmapData, topSkillGaps, workforceRiskData]);

  const recommendedActions = useMemo<DashboardAction[]>(() => {
    const actions: DashboardAction[] = [];

    const devopsTeam = workforceRiskData?.teams.find((team) =>
      containsAny(team.department, ['devops'])
    );
    const devopsGap = topSkillGaps.find(
      (row) =>
        containsAny(row.skill, ['devops', 'kubernetes', 'docker', 'aws']) ||
        containsAny(row.category, ['devops', 'cloud'])
    );
    const devopsShortage = Boolean(
      (devopsTeam && devopsTeam.risk_level !== 'LOW') || ((devopsGap?.gap ?? 0) >= 2)
    );
    if (devopsShortage) {
      const hireCount = Math.max(2, Math.min(6, devopsGap?.gap ?? 3));
      actions.push({
        title: `Hire ${hireCount} DevOps Engineers`,
        detail: `Priority for ${devopsGap?.skill ?? 'critical cloud skills'} to reduce operational risk`,
        tone: 'high',
        emoji: '👥',
      });
    }

    const backendTeam = workforceRiskData?.teams.find((team) =>
      containsAny(team.department, ['engineering', 'backend'])
    );
    if (backendTeam && backendTeam.risk_level !== 'LOW') {
      const upskillCount = Math.max(2, Math.min(5, Math.ceil(backendTeam.employee_count * 0.4)));
      actions.push({
        title: `Upskill ${upskillCount} Backend Developers`,
        detail: 'Focus on API optimization, cloud reliability, and incident response readiness',
        tone: backendTeam.risk_level === 'HIGH' ? 'high' : 'medium',
        emoji: '📚',
      });
    }

    const kubernetesRow = skillHeatmapData?.rows.find(
      (row) => row.skill.toLowerCase() === 'kubernetes'
    );
    if (kubernetesRow && kubernetesRow.gap > 0) {
      actions.push({
        title: 'Train employees in Kubernetes',
        detail: `Bridge a current gap of ${kubernetesRow.gap} to improve deployment resilience`,
        tone: kubernetesRow.gap >= 4 ? 'high' : 'medium',
        emoji: '🔧',
      });
    }

    const topUpskillingCandidate = null;

    if (actions.length === 0) {
      actions.push({
        title: 'Maintain quarterly skill audits',
        detail: 'Current data does not show urgent actions; keep monitoring to prevent drift',
        tone: 'low',
        emoji: '✨',
      });
    }

    return actions.slice(0, 4);
  }, [skillHeatmapData, topSkillGaps, workforceRiskData]);

  return (
    <div className="page-shell space-y-6">
      <h1 className="text-3xl font-bold text-white font-display">Dashboard</h1>

      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-300/25 flex items-center justify-center text-xl">
            🛡️
          </div>
          <div>
            <p className="text-sm text-slate-300">Risk Watch</p>
            <p className="text-base font-semibold text-white">{riskWatch.summary}</p>
          </div>
        </div>
        <span className={`risk-pill ${riskPillClassByLevel[riskWatch.level]}`}>
          <span className="risk-dot" />
          {riskWatch.level}
        </span>
      </div>

      {/* AI Workforce Insights */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🧠</span>
          <h2 className="text-lg font-semibold text-white">AI Workforce Insights</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {aiInsights.map((insight) => (
            <div
              key={insight.title}
              className={`rounded-xl border p-4 ${insightToneClasses[insight.tone]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{insight.emoji}</span>
                <p className="text-sm font-semibold">{insight.title}</p>
              </div>
              <p className="text-xs opacity-85">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Skill Gaps + Future Demand */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="glass-panel p-5 xl:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">⚠️</span>
            <h2 className="text-lg font-semibold text-white">Top Skill Gaps</h2>
          </div>

          {isLoading ? (
            <div className="h-56 flex items-center justify-center text-slate-400">Loading...</div>
          ) : topSkillGaps.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-slate-400">No gap data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="text-left text-sm text-slate-400 border-b border-slate-700">
                    <th className="py-2">Skill</th>
                    <th className="py-2">Required</th>
                    <th className="py-2">Available</th>
                    <th className="py-2">Gap</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topSkillGaps.map((row) => (
                    <tr key={row.skill} className="border-b border-slate-700/40 text-sm">
                      <td className="py-3 text-white font-medium">{row.skill}</td>
                      <td className="py-3 text-slate-200">{row.required}</td>
                      <td className="py-3 text-slate-200">{row.available}</td>
                      <td className="py-3 text-slate-100 font-semibold">{row.gap}</td>
                      <td className="py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md border text-xs ${gapStatusClasses[row.status]}`}
                        >
                          {row.status_label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📈</span>
            <h2 className="text-lg font-semibold text-white">Future Skill Demand Preview</h2>
          </div>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 text-slate-400">Domain</th>
                    <th className="text-right py-3 text-slate-400">Growth %</th>
                    <th className="text-left py-3 text-slate-400">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {futureDemandPreview.map((item) => (
                    <tr key={item.domain} className="border-b border-slate-700/40 hover:bg-cyan-500/8">
                      <td className="py-3 text-white font-medium">{item.domain}</td>
                      <td className="py-3 text-right text-cyan-300 font-semibold">+{item.growth}%</td>
                      <td className="py-3">
                        <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300"
                            style={{ width: `${Math.min(item.growth, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔧</span>
          <h2 className="text-lg font-semibold text-white">Recommended Actions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {recommendedActions.map((action) => (
            <div
              key={action.title}
              className={`rounded-xl border p-4 ${actionToneClasses[action.tone]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{action.emoji}</span>
                <p className="text-sm font-semibold text-white">{action.title}</p>
              </div>
              <p className="text-xs text-slate-200/85">{action.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg text-xl">
              👥
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Employees</p>
              <p className="text-2xl font-bold text-white">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-xl">
              ⚡
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Skills</p>
              <p className="text-2xl font-bold text-white">{skills.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg text-xl">
              📊
            </div>
            <div>
              <p className="text-sm text-slate-400">Skill Assignments</p>
              <p className="text-2xl font-bold text-white">
                {skillDistribution.reduce((sum, s) => sum + s.employee_count, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-xl">
              📂
            </div>
            <div>
              <p className="text-sm text-slate-400">Categories</p>
              <p className="text-2xl font-bold text-white">{categoryData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        {/* Skill Distribution Table */}
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Skill Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : skillDistribution.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="space-y-2">
              {skillDistribution.map((skill, i) => (
                <div key={skill.skill_name} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-slate-300 truncate">{skill.skill_name}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${['bg-cyan-500', 'bg-teal-500', 'bg-green-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500'][i % 6]}`}
                      style={{ width: `${Math.min((skill.employee_count / Math.max(1, Math.max(...skillDistribution.map(s => s.employee_count)))) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-white font-semibold w-8 text-right">{skill.employee_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proficiency Levels Table */}
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Proficiency Levels</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : proficiencyData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="space-y-3">
              {proficiencyData.map((prof, i) => {
                const colors = ['bg-emerald-500/30 border-emerald-400/50', 'bg-cyan-500/30 border-cyan-400/50', 'bg-amber-500/30 border-amber-400/50', 'bg-orange-500/30 border-orange-400/50'];
                return (
                  <div key={prof.level_name} className={`p-3 border rounded-lg ${colors[i % colors.length]}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{prof.level_name}</span>
                      <span className="text-white font-bold">{prof.count}</span>
                    </div>
                    <div className="mt-2 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className={colors[i % colors.length].split(' ')[0].replace('bg-', 'bg-')}
                        style={{ width: `${Math.min((prof.count / Math.max(1, Math.max(...proficiencyData.map(p => p.count)))) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Table */}
      <div className="glass-panel p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Skills by Category</h3>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
        ) : categoryData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 text-slate-400">Category</th>
                  <th className="text-right py-3 text-slate-400">Assignments</th>
                  <th className="text-left py-3 text-slate-400">Distribution</th>
                </tr>
              </thead>
              <tbody>
                {categoryData.map((cat, i) => (
                  <tr key={cat.category} className="border-b border-slate-700/40 hover:bg-cyan-500/8">
                    <td className="py-3 text-white font-medium">{cat.category}</td>
                    <td className="py-3 text-right text-cyan-300 font-semibold">{cat.total_assignments}</td>
                    <td className="py-3">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${['bg-cyan-400', 'bg-teal-400', 'bg-green-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400'][i % 6]}`}
                          style={{ width: `${Math.min((cat.total_assignments / Math.max(1, Math.max(...categoryData.map(c => c.total_assignments)))) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Additional Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger-children">
        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Experience Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : experienceDataArray.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="space-y-2">
              {experienceDataArray.map((exp, i) => {
                const colors = ['bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500', 'bg-lime-500'];
                return (
                  <div key={exp.experience_range} className="flex items-center gap-3">
                    <span className="w-24 text-sm text-slate-300">{exp.experience_range}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={colors[i % colors.length]}
                        style={{ width: `${Math.min((exp.count / Math.max(1, Math.max(...experienceDataArray.map(e => e.count)))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-semibold w-8 text-right">{exp.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass-panel p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Employees by Department</h3>
          {loadingEmployees ? (
            <div className="h-64 flex items-center justify-center text-slate-400">Loading...</div>
          ) : departmentData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400">No data</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {departmentData.map((dept, i) => {
                const colors = ['bg-blue-500/20 border-blue-400/50', 'bg-purple-500/20 border-purple-400/50', 'bg-pink-500/20 border-pink-400/50', 'bg-rose-500/20 border-rose-400/50'];
                return (
                  <div key={dept.department} className={`p-3 border rounded-lg ${colors[i % colors.length]}`}>
                    <div className="text-sm text-slate-300">{dept.department}</div>
                    <div className="text-xl font-bold text-white">{dept.count}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Employees */}
      <div className="glass-panel p-5">
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
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.slice(-5).reverse().map((emp) => (
                  <tr key={emp.id} className="border-b border-slate-700/50 text-sm hover:bg-cyan-500/8 transition">
                    <td className="py-3 text-white font-medium">{emp.name}</td>
                    <td className="py-3 text-slate-300">{emp.department}</td>
                    <td className="py-3 text-slate-300">{emp.role}</td>
                    <td className="py-3 text-slate-300">{emp.year_exp} years</td>
                    <td className="py-3">
                      <div className="row-action-group justify-end gap-2">
                        <button
                          type="button"
                          className="row-action-btn text-lg"
                          title="View profile"
                          onClick={() => alert(`Opened profile for ${emp.name}`)}
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="row-action-btn text-lg"
                          title="Nudge action"
                          onClick={() => alert(`Nudge sent to ${emp.name}`)}
                        >
                          ✨
                        </button>
                      </div>
                    </td>
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
