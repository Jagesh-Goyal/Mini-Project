import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  GraduationCap,
  RefreshCw,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '@/lib/api';
import type {
  HeatmapStatus,
  RiskLevel,
  SkillHeatmapResponse,
  UpskillingRecommendation,
} from '@/types';

const statusStyles: Record<
  HeatmapStatus,
  {
    row: string;
    badge: string;
    text: string;
    bar: string;
  }
> = {
  GREEN: {
    row: 'bg-emerald-500/6',
    badge: 'bg-emerald-500/20 border-emerald-400/35',
    text: 'text-emerald-200',
    bar: 'bg-emerald-400',
  },
  YELLOW: {
    row: 'bg-amber-500/7',
    badge: 'bg-amber-500/20 border-amber-400/35',
    text: 'text-amber-200',
    bar: 'bg-amber-300',
  },
  RED: {
    row: 'bg-rose-500/8',
    badge: 'bg-rose-500/20 border-rose-400/35',
    text: 'text-rose-200',
    bar: 'bg-rose-400',
  },
};

const priorityStyles: Record<RiskLevel, string> = {
  LOW: 'bg-emerald-500/20 border-emerald-400/35 text-emerald-200',
  MEDIUM: 'bg-amber-500/20 border-amber-400/35 text-amber-200',
  HIGH: 'bg-rose-500/20 border-rose-400/35 text-rose-200',
};

export default function SkillHeatmap() {
  const [heatmap, setHeatmap] = useState<SkillHeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | RiskLevel>('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const heatmapRes = await api.getSkillHeatmap();
      setHeatmap(heatmapRes.data);
    } catch {
      toast.error('Failed to load skill heatmap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const normalizedSearch = searchText.trim().toLowerCase();

  const filteredHeatmapRows = useMemo(() => {
    if (!heatmap) return [];
    if (!normalizedSearch) return heatmap.rows;

    return heatmap.rows.filter((row) => {
      return (
        row.skill.toLowerCase().includes(normalizedSearch) ||
        row.category.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [heatmap, normalizedSearch]);

  const generatedRecommendations = useMemo<UpskillingRecommendation[]>(() => {
    if (!heatmap) return [];

    return heatmap.rows
      .filter((row) => row.gap > 0)
      .sort((a, b) => b.gap - a.gap || b.required - a.required)
      .slice(0, 8)
      .map((row, index) => ({
        employee_id: index + 1,
        employee_name: `${row.category} Team`,
        department: row.category,
        current_skills: row.available > 0 ? [`${row.skill} (${row.available})`] : [],
        recommended_skills: [row.skill],
        priority: row.status === 'RED' ? 'HIGH' : row.status === 'YELLOW' ? 'MEDIUM' : 'LOW',
        rationale: `Current availability ${row.available} vs required ${row.required} for ${row.skill}.`,
      }));
  }, [heatmap]);

  const filteredRecommendations = useMemo(() => {
    return generatedRecommendations.filter((item) => {
      const matchesPriority = priorityFilter === 'ALL' || item.priority === priorityFilter;

      if (!normalizedSearch) return matchesPriority;

      const matchByEmployee = item.employee_name.toLowerCase().includes(normalizedSearch);
      const matchByDepartment = item.department.toLowerCase().includes(normalizedSearch);
      const matchBySkill = [...item.current_skills, ...item.recommended_skills].some((skill) =>
        skill.toLowerCase().includes(normalizedSearch)
      );

      return matchesPriority && (matchByEmployee || matchByDepartment || matchBySkill);
    });
  }, [generatedRecommendations, priorityFilter, normalizedSearch]);

  const highGapSkills = useMemo(() => {
    const rows = heatmap?.rows ?? [];
    return rows
      .filter((item) => item.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 8)
      .map((item) => ({
        skill: item.skill,
        gap: item.gap,
        status_label: item.status_label,
      }));
  }, [heatmap]);

  const heatmapCounts = useMemo(() => {
    const rows = heatmap?.rows ?? [];
    return {
      green: rows.filter((row) => row.status === 'GREEN').length,
      yellow: rows.filter((row) => row.status === 'YELLOW').length,
      red: rows.filter((row) => row.status === 'RED').length,
    };
  }, [heatmap]);

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Flame className="w-8 h-8 text-amber-300" />
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Skill Heatmap & Upskilling</h1>
            <p className="text-sm text-slate-300/80">
              Detect shortages and generate targeted learning recommendations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            void loadData();
          }}
          className="btn-secondary px-4 py-2 inline-flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Analysis
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Balanced Skills</p>
          <p className="text-3xl font-bold text-emerald-200">{heatmapCounts.green}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Medium Gaps</p>
          <p className="text-3xl font-bold text-amber-200">{heatmapCounts.yellow}</p>
        </div>
        <div className="glass-panel p-4 border border-rose-500/35">
          <p className="text-xs uppercase tracking-[0.14em] text-rose-200/80 mb-2">Critical Gaps</p>
          <p className="text-3xl font-bold text-rose-200">{heatmapCounts.red}</p>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Skill Heatmap</h2>

          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search skill or category"
              className="input-modern pl-9 pr-3 py-2"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-slate-300 text-sm py-10 text-center">Building skill heatmap...</div>
        ) : filteredHeatmapRows.length === 0 ? (
          <div className="text-slate-300 text-sm py-10 text-center">No matching skill rows found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-slate-300/80 border-b border-white/10">
                  <th className="py-2 pr-3">Skill</th>
                  <th className="py-2 px-3">Available</th>
                  <th className="py-2 px-3">Required</th>
                  <th className="py-2 px-3">Gap</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 pl-3">Heat</th>
                </tr>
              </thead>
              <tbody>
                {filteredHeatmapRows.map((row) => {
                  const style = statusStyles[row.status];
                  const barWidth = Math.min(100, row.gap * 18 + (row.status === 'RED' ? 24 : 10));

                  return (
                    <tr key={row.skill} className={`border-b border-white/6 ${style.row}`}>
                      <td className="py-3 pr-3">
                        <p className="font-semibold text-white">{row.skill}</p>
                        <p className="text-xs text-slate-400">{row.category}</p>
                      </td>
                      <td className="py-3 px-3 text-slate-100">{row.available}</td>
                      <td className="py-3 px-3 text-slate-100">{row.required}</td>
                      <td className="py-3 px-3 font-semibold text-slate-50">{row.gap}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs ${style.badge} ${style.text}`}>
                          {row.status === 'GREEN' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {row.status_label}
                        </span>
                      </td>
                      <td className="py-3 pl-3">
                        <div className="w-36 h-2 rounded-full bg-slate-900/70 border border-white/10 overflow-hidden">
                          <div className={`h-full ${style.bar}`} style={{ width: `${barWidth}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white inline-flex items-center gap-2">
              <GraduationCap size={18} className="text-cyan-200" />
              Training & Upskilling Recommendation
            </h2>
            <p className="text-sm text-slate-300/75 mt-1">Personalized skill paths using employee profile + gap hotspots</p>
          </div>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value as 'ALL' | RiskLevel)}
            className="select-modern px-3 py-2 w-full lg:w-48"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {highGapSkills.map((item) => (
            <span key={item.skill} className="px-2 py-1 rounded-md text-xs bg-rose-500/15 border border-rose-400/30 text-rose-200">
              {item.skill} gap: {item.gap}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="text-slate-300 text-sm py-8 text-center">Generating upskilling paths...</div>
        ) : filteredRecommendations.length === 0 ? (
          <div className="text-slate-300 text-sm py-8 text-center">No matching recommendations found.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredRecommendations.map((item) => (
              <RecommendationCard key={item.employee_id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecommendationCard({ item }: { item: UpskillingRecommendation }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Employee</p>
          <h3 className="text-lg font-semibold text-white font-display">{item.employee_name}</h3>
          <p className="text-sm text-slate-300/80">{item.department}</p>
        </div>

        <span className={`px-2.5 py-1 rounded-md border text-xs font-semibold ${priorityStyles[item.priority]}`}>
          {item.priority}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-900/60 border border-white/10 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-2">Current Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {item.current_skills.length === 0 ? (
              <span className="text-xs text-slate-400">No skills mapped yet</span>
            ) : (
              item.current_skills.map((skill) => (
                <span key={`${item.employee_id}-current-${skill}`} className="px-2 py-1 rounded-md text-xs bg-white/6 border border-white/12 text-slate-200">
                  {skill}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="bg-cyan-500/8 border border-cyan-300/22 rounded-lg p-3">
          <p className="text-xs text-slate-300 mb-2">Recommended Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {item.recommended_skills.map((skill) => (
              <span key={`${item.employee_id}-next-${skill}`} className="px-2 py-1 rounded-md text-xs bg-cyan-500/20 border border-cyan-300/30 text-cyan-100">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-300/75 mt-3">{item.rationale}</p>
    </div>
  );
}
