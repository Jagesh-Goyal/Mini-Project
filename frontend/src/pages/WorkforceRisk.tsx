import { useEffect, useMemo, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  ShieldX,
  CircleAlert,
  Users,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import toast from 'react-hot-toast';
import * as api from '@/lib/api';
import type { RiskLevel, WorkforceRiskResponse, WorkforceTeamRisk } from '@/types';

const riskColors: Record<RiskLevel, { chip: string; text: string; bar: string; border: string }> = {
  LOW: {
    chip: 'bg-emerald-500/20 border-emerald-400/40',
    text: 'text-emerald-200',
    bar: '#22c55e',
    border: 'border-emerald-500/30',
  },
  MEDIUM: {
    chip: 'bg-amber-500/20 border-amber-400/40',
    text: 'text-amber-200',
    bar: '#f59e0b',
    border: 'border-amber-500/30',
  },
  HIGH: {
    chip: 'bg-rose-500/20 border-rose-400/40',
    text: 'text-rose-200',
    bar: '#f43f5e',
    border: 'border-rose-500/35',
  },
};

const issueTitles: Record<string, string> = {
  critical_skill_shortage: 'Critical Skill Shortage',
  single_skill_dependency: 'Single Skill Dependency',
  lack_of_backup_employees: 'Lack of Backup Employees',
};

function levelIcon(level: RiskLevel) {
  if (level === 'HIGH') return <ShieldX className="w-5 h-5 text-rose-300" />;
  if (level === 'MEDIUM') return <CircleAlert className="w-5 h-5 text-amber-300" />;
  return <ShieldCheck className="w-5 h-5 text-emerald-300" />;
}

export default function WorkforceRisk() {
  const [data, setData] = useState<WorkforceRiskResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRiskData = async () => {
    setLoading(true);
    try {
      const response = await api.getWorkforceRiskAnalysis();
      setData(response.data);
    } catch {
      toast.error('Failed to fetch workforce risk analysis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRiskData();
  }, []);

  const chartData = useMemo(() => {
    if (!data) return [];

    return data.teams.map((team) => ({
      team: team.team_label.replace(' Team', ''),
      score: team.risk_score,
      level: team.risk_level,
    }));
  }, [data]);

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-rose-300" />
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Workforce Risk Analysis</h1>
            <p className="text-sm text-slate-300/80">Detect critical people and skill coverage risks across teams</p>
          </div>
        </div>

        <button
          onClick={() => {
            void fetchRiskData();
          }}
          className="btn-secondary px-4 py-2 inline-flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Analysis
        </button>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-300">Analyzing workforce risk...</div>
      ) : !data || data.teams.length === 0 ? (
        <div className="glass-panel p-8 text-center text-slate-300">
          No team data found. Add employees and skill assignments to run risk analysis.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="glass-panel p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Overall Risk</p>
              <div className="flex items-center gap-2">
                {levelIcon(data.overall_risk)}
                <span
                  className={`px-2.5 py-1 rounded-lg border text-sm font-semibold ${riskColors[data.overall_risk].chip} ${riskColors[data.overall_risk].text}`}
                >
                  {data.overall_risk}
                </span>
              </div>
              <p className="text-sm text-slate-300/80 mt-3">Highest observed team risk in the organization.</p>
            </div>

            <div className="glass-panel p-5 lg:col-span-2 border border-rose-500/35">
              <p className="text-xs uppercase tracking-[0.14em] text-rose-200/80 mb-2">Top Alert</p>
              <p className="text-2xl font-display font-bold text-rose-100">{data.top_risk_summary}</p>
              <p className="text-sm text-rose-100/75 mt-2">Example output: DevOps Team Risk = HIGH</p>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h2 className="text-lg font-semibold text-white mb-4">Risk Score by Team</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="team" tick={{ fill: '#b4cad9', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: '#b4cad9', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#0b1f2f',
                      border: '1px solid rgba(147, 191, 220, 0.35)',
                      borderRadius: '10px',
                      color: '#e9f7ff',
                    }}
                    formatter={(value) => [`${value ?? 0}/100`, 'Risk Score']}
                  />
                  <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.team} fill={riskColors[entry.level as RiskLevel].bar} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {data.teams.map((team) => (
              <TeamRiskCard key={team.team_label} team={team} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeamRiskCard({ team }: { team: WorkforceTeamRisk }) {
  const palette = riskColors[team.risk_level];

  return (
    <div className={`glass-panel p-5 border ${palette.border}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Team</p>
          <h3 className="text-xl font-display font-semibold text-white">{team.team_label}</h3>
          <p className="text-sm mt-1 font-semibold text-rose-100">{team.summary}</p>
        </div>

        <span className={`px-2.5 py-1 rounded-lg border text-sm font-semibold ${palette.chip} ${palette.text}`}>
          {team.risk_level}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-900/65 border border-white/10 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400">Score</p>
          <p className="text-lg font-semibold text-white">{team.risk_score}</p>
        </div>
        <div className="bg-slate-900/65 border border-white/10 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400 inline-flex items-center gap-1">
            <Users size={12} /> Employees
          </p>
          <p className="text-lg font-semibold text-white">{team.employee_count}</p>
        </div>
        <div className="bg-slate-900/65 border border-white/10 rounded-lg px-3 py-2">
          <p className="text-xs text-slate-400 inline-flex items-center gap-1">
            <Layers size={12} /> Backup
          </p>
          <p className="text-lg font-semibold text-white">{Math.round(team.backup_coverage * 100)}%</p>
        </div>
      </div>

      <div className="space-y-3">
        {team.issues.map((issue) => (
          <div key={`${team.team_label}-${issue.type}`} className="bg-slate-900/65 border border-white/10 rounded-lg p-3">
            <p className="text-sm font-semibold text-slate-100 inline-flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-300" />
              {issueTitles[issue.type]}
            </p>
            <p className="text-sm text-slate-300/85 mt-1">{issue.description}</p>
            {issue.impacted_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {issue.impacted_skills.slice(0, 6).map((skill) => (
                  <span key={`${issue.type}-${skill}`} className="px-2 py-1 rounded-md text-xs bg-white/6 border border-white/12 text-slate-200">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
