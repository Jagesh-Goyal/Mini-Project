import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '@/lib/api';
import { useStore } from '@/store/useStore';
import type { ReportFormat } from '@/types';

type Scenario = 'conservative' | 'balanced' | 'aggressive';

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

export default function Reports() {
  const { skills, fetchSkills } = useStore();
  const [format, setFormat] = useState<ReportFormat>('csv');
  const [forecastSkill, setForecastSkill] = useState('');
  const [monthsAhead, setMonthsAhead] = useState<3 | 6 | 12>(6);
  const [scenario, setScenario] = useState<Scenario>('balanced');
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);

  useEffect(() => {
    void fetchSkills();
  }, []);

  const availableSkillOptions = useMemo(() => skills.map((skill) => skill.skill_name), [skills]);

  useEffect(() => {
    if (!forecastSkill && availableSkillOptions.length > 0) {
      setForecastSkill(availableSkillOptions[0]);
    }
  }, [availableSkillOptions, forecastSkill]);

  const handleDownload = async (
    key: string,
    action: () => Promise<{ data: Blob }>,
    filename: string,
  ) => {
    setDownloadingKey(key);
    try {
      const response = await action();
      saveBlob(response.data, filename);
      toast.success('Report downloaded');
    } catch {
      toast.error('Failed to download report');
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <div className="page-shell space-y-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="w-8 h-8 text-emerald-300" />
        <div>
          <h1 className="text-3xl font-bold text-white font-display">Reports & Export</h1>
          <p className="text-sm text-slate-400 mt-1">Download skill gap, employee skill, and forecast reports in CSV, Excel, or PDF.</p>
        </div>
      </div>

      <div className="glass-panel p-5 space-y-4">
        <div>
          <label className="block text-sm text-slate-400 mb-2">Export Format</label>
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value as ReportFormat)}
            className="select-modern px-4 py-2.5 max-w-xs"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-panel p-5 border border-cyan-500/20">
            <h2 className="text-lg font-semibold text-white mb-2">Skill Gap Report</h2>
            <p className="text-sm text-slate-400 mb-4">Organization-wide required vs available capability snapshot.</p>
            <button
              type="button"
              className="btn-primary px-4 py-2 inline-flex items-center gap-2"
              onClick={() => void handleDownload(
                'gap',
                () => api.downloadSkillGapReport(format),
                `skill-gap-report.${format}`,
              )}
              disabled={downloadingKey === 'gap'}
            >
              <Download size={16} />
              {downloadingKey === 'gap' ? 'Downloading...' : 'Download'}
            </button>
          </div>

          <div className="glass-panel p-5 border border-amber-500/20">
            <h2 className="text-lg font-semibold text-white mb-2">Employee Skill Report</h2>
            <p className="text-sm text-slate-400 mb-4">Full employee, team, skill, and proficiency export.</p>
            <button
              type="button"
              className="btn-accent px-4 py-2 inline-flex items-center gap-2"
              onClick={() => void handleDownload(
                'employee-skills',
                () => api.downloadEmployeeSkillReport(format),
                `employee-skill-report.${format}`,
              )}
              disabled={downloadingKey === 'employee-skills'}
            >
              <Download size={16} />
              {downloadingKey === 'employee-skills' ? 'Downloading...' : 'Download'}
            </button>
          </div>

          <div className="glass-panel p-5 border border-violet-500/20 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Forecast Report</h2>
              <p className="text-sm text-slate-400">Demand forecast report for a selected skill and planning scenario.</p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Skill</label>
              <select
                value={forecastSkill}
                onChange={(event) => setForecastSkill(event.target.value)}
                className="select-modern px-4 py-2.5"
              >
                {availableSkillOptions.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Months</label>
                <select
                  value={monthsAhead}
                  onChange={(event) => setMonthsAhead(Number(event.target.value) as 3 | 6 | 12)}
                  className="select-modern px-4 py-2.5"
                >
                  <option value={3}>3</option>
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Scenario</label>
                <select
                  value={scenario}
                  onChange={(event) => setScenario(event.target.value as Scenario)}
                  className="select-modern px-4 py-2.5"
                >
                  <option value="conservative">Conservative</option>
                  <option value="balanced">Balanced</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              className="rounded-xl bg-violet-500/20 border border-violet-400/30 px-4 py-2 text-violet-100 inline-flex items-center gap-2 hover:bg-violet-500/30 transition"
              onClick={() => void handleDownload(
                'forecast',
                () => api.downloadForecastReport(forecastSkill, monthsAhead, scenario, format),
                `forecast-report.${format}`,
              )}
              disabled={!forecastSkill || downloadingKey === 'forecast'}
            >
              <Download size={16} />
              {downloadingKey === 'forecast' ? 'Downloading...' : 'Download'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}