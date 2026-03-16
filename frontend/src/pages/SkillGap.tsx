import { useEffect, useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';
import toast from 'react-hot-toast';
import type { ReportFormat, SkillGapOverviewResponse } from '@/types';

function saveBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function SkillGap() {
  const { skills, fetchSkills } = useStore();
  const [selectedSkill, setSelectedSkill] = useState('');
  const [requiredCount, setRequiredCount] = useState('');
  const [department, setDepartment] = useState('');
  const [teamName, setTeamName] = useState('');
  const [result, setResult] = useState<any>(null);
  const [overview, setOverview] = useState<SkillGapOverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<ReportFormat | null>(null);

  useEffect(() => {
    void fetchSkills();
    void loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      const response = await api.getSkillGapOverview();
      setOverview(response.data);
    } catch {
      toast.error('Failed to fetch gap overview');
    }
  };

  const handleAnalyze = async () => {
    if (!selectedSkill || !requiredCount) {
      toast.error('Please select skill and enter required count');
      return;
    }

    setLoading(true);
    try {
      const res = await api.calculateSkillGap({
        skill_name: selectedSkill,
        required_count: parseInt(requiredCount, 10),
        department: department || undefined,
        team_name: teamName || undefined,
      });
      setResult(res.data);
      toast.success('Gap analysis complete');
    } catch (error) {
      toast.error('Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const response = await api.downloadSkillGapReport(format);
      saveBlob(response.data, `skill-gap-report.${format}`);
      toast.success('Skill gap report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-300" />
          <div>
            <h1 className="text-3xl font-bold text-white font-display">Skill Gap Analysis</h1>
            <p className="text-sm text-slate-400 mt-1">Track organization, department, and team-level skill shortages.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(['csv', 'xlsx', 'pdf'] as ReportFormat[]).map((format) => (
            <button key={format} className="btn-secondary px-4 py-2 inline-flex items-center gap-2" onClick={() => void handleExport(format)} disabled={exporting === format}>
              <Download size={15} />
              {exporting === format ? 'Downloading...' : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Organization Gap</p>
            <p className="text-3xl font-bold text-white">{overview.organization.total_gap}</p>
            <p className="text-sm text-slate-400 mt-2">{overview.organization.total_available} available vs {overview.organization.total_required} required</p>
          </div>
          <div className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Top Department Risk</p>
            <p className="text-2xl font-bold text-amber-300">{overview.departments[0]?.scope ?? 'N/A'}</p>
            <p className="text-sm text-slate-400 mt-2">Gap {overview.departments[0]?.total_gap ?? 0}</p>
          </div>
          <div className="glass-panel p-5">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400 mb-2">Top Team Risk</p>
            <p className="text-2xl font-bold text-rose-300">{overview.teams[0]?.scope ?? 'N/A'}</p>
            <p className="text-sm text-slate-400 mt-2">Gap {overview.teams[0]?.total_gap ?? 0}</p>
          </div>
        </div>
      )}

      <div className="glass-panel p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Analyze Demand vs Supply</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Skill
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="select-modern px-4 py-2.5"
            >
              <option value="">Choose a skill</option>
              {skills.map((skill) => (
                <option key={skill.id} value={skill.skill_name}>
                  {skill.skill_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Required Count
            </label>
            <input
              type="number"
              value={requiredCount}
              onChange={(e) => setRequiredCount(e.target.value)}
              placeholder="How many needed?"
              className="input-modern px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Department (Optional)</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Engineering"
              className="input-modern px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Team (Optional)</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Platform"
              className="input-modern px-4 py-2.5"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="btn-accent px-6 py-2.5 disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Analyze Gap'}
        </button>
      </div>

      {result && (
        <div className="glass-panel p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Analysis Result</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Skill</p>
              <p className="text-xl font-bold text-white">{result.skill_name}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Current</p>
              <p className="text-xl font-bold text-blue-400">{result.current}</p>
            </div>

            <div className="bg-slate-900/70 border border-white/10 rounded-lg p-4">
              <p className="text-sm text-slate-400 mb-1">Required</p>
              <p className="text-xl font-bold text-amber-300">{result.required}</p>
            </div>
          </div>

          <p className="text-sm text-slate-400 mt-4">Scope: {result.scope}</p>

          <div className={`mt-4 p-4 rounded-lg border ${
            result.gap > 0 
              ? 'bg-red-900/20 border-red-700' 
              : 'bg-green-900/20 border-green-700'
          }`}>
            <p className="text-sm text-slate-400 mb-1">Gap</p>
            <p className={`text-2xl font-bold ${
              result.gap > 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              {result.gap > 0 ? `${result.gap} shortage` : 'No gap'}
            </p>
          </div>
        </div>
      )}

      {overview && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Critical Organization Skills</h2>
            <div className="space-y-3">
              {overview.organization.rows.slice(0, 8).map((row) => (
                <div key={`org-${row.skill}`} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{row.skill}</p>
                    <p className="text-xs text-slate-400">{row.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-300">Gap {row.gap}</p>
                    <p className="text-xs text-slate-500">{row.status_label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Department & Team Hotspots</h2>
            <div className="space-y-4">
              {overview.departments.slice(0, 4).map((scope) => (
                <div key={`dept-${scope.scope}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-medium">{scope.scope}</p>
                    <span className="text-sm text-amber-300">Gap {scope.total_gap}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Top shortage: {scope.rows[0]?.skill ?? 'N/A'}</p>
                </div>
              ))}
              {overview.teams.slice(0, 4).map((scope) => (
                <div key={`team-${scope.scope}`} className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-white font-medium">{scope.scope}</p>
                    <span className="text-sm text-rose-300">Gap {scope.total_gap}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Top shortage: {scope.rows[0]?.skill ?? 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
