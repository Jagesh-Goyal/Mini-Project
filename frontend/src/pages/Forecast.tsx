import { useState } from 'react';
import { TrendingUp, Brain, RefreshCw } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import * as api from '@/lib/api';
import type { MLForecastRow } from '@/lib/api';
import toast from 'react-hot-toast';

type Scenario = 'conservative' | 'balanced' | 'aggressive';

const scenarioColors: Record<Scenario, string> = {
  conservative: '#f59e0b',
  balanced:     '#22d3ee',
  aggressive:   '#a78bfa',
};

const scenarioLabels: Record<Scenario, string> = {
  conservative: '🟡 Conservative',
  balanced:     '🔵 Balanced',
  aggressive:   '🟣 Aggressive',
};

export default function Forecast() {
  const [skillName, setSkillName]     = useState('');
  const [monthsAhead, setMonthsAhead] = useState<3 | 6 | 12>(3);
  const [scenario, setScenario]       = useState<Scenario>('balanced');
  const [chartData, setChartData]     = useState<{ label: string; demand: number; supply: number }[]>([]);
  const [resultMeta, setResultMeta]   = useState<{ skill: string; scenario: string; months: number } | null>(null);
  const [loading, setLoading]         = useState(false);
  const [training, setTraining]       = useState(false);

  const handleForecast = async () => {
    if (!skillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }
    setLoading(true);
    try {
      const res = await api.forecastSkillDemand(skillName.trim(), monthsAhead, undefined, scenario);
      const data = res.data;

      const deptKeys = Object.keys(data.forecasts);
      if (deptKeys.length === 0) {
        toast.error('No forecast data returned');
        return;
      }

      const firstDept = data.forecasts[deptKeys[0]] as MLForecastRow[];
      const flattened = firstDept.map((row, idx) => {
        const avgDemand = Math.round(
          deptKeys.reduce((sum, d) => sum + (data.forecasts[d][idx]?.demand ?? 0), 0) / deptKeys.length
        );
        const supply = row.supply;
        return { label: row.date.slice(0, 7), demand: avgDemand, supply };
      });

      setChartData(flattened);
      setResultMeta({ skill: data.skill, scenario: data.scenario ?? scenario, months: data.months_ahead });
      toast.success('Forecast generated');
    } catch {
      toast.error('Forecast failed — try training the model first');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    setTraining(true);
    try {
      await api.trainMLModels();
      toast.success('Model trained successfully! Now run the forecast.');
    } catch {
      toast.error('Model training failed');
    } finally {
      setTraining(false);
    }
  };

  const color = scenarioColors[scenario];

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-cyan-300" />
          <h1 className="text-3xl font-bold text-white font-display">Skill Demand Forecast</h1>
        </div>
        <button
          onClick={() => { void handleTrain(); }}
          disabled={training}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20 border border-violet-400/30 text-violet-200 hover:bg-violet-500/30 transition text-sm font-medium disabled:opacity-50"
        >
          <Brain size={15} />
          {training ? 'Training...' : 'Train ML Model'}
        </button>
      </div>

      <div className="glass-panel p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Configure Forecast</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Skill Name</label>
            <input
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleForecast(); }}
              placeholder="e.g. Python, AWS, Machine Learning"
              className="input-modern px-4 py-2.5"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Months Ahead</label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value) as 3 | 6 | 12)}
              className="select-modern px-4 py-2.5"
            >
              <option value={3}>3 Months</option>
              <option value={6}>6 Months</option>
              <option value={12}>12 Months</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Scenario</label>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value as Scenario)}
              className="select-modern px-4 py-2.5"
            >
              <option value="conservative">🟡 Conservative</option>
              <option value="balanced">🔵 Balanced</option>
              <option value="aggressive">🟣 Aggressive</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => { void handleForecast(); }}
          disabled={loading}
          className="btn-primary px-6 py-2.5 disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Forecasting...' : 'Generate Forecast'}
        </button>
      </div>

      {resultMeta && chartData.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-4">
              <p className="text-xs text-slate-400 mb-1">Skill</p>
              <p className="text-lg font-bold text-white">{resultMeta.skill}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-slate-400 mb-1">Scenario</p>
              <p className="text-lg font-bold" style={{ color }}>{scenarioLabels[resultMeta.scenario as Scenario] ?? resultMeta.scenario}</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-slate-400 mb-1">Horizon</p>
              <p className="text-lg font-bold text-white">{resultMeta.months} months</p>
            </div>
            <div className="glass-panel p-4">
              <p className="text-xs text-slate-400 mb-1">Peak Demand</p>
              <p className="text-lg font-bold text-amber-300">{Math.max(...chartData.map((d) => d.demand))}</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Demand vs Supply Trend</h3>
            <div className="h-72 chart-interactive">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="supplyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4ade80" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                  <Area type="monotone" dataKey="demand" name="Forecasted Demand" stroke={color} fill="url(#demandGrad)" strokeWidth={2.2} activeDot={{ r: 6 }} animationDuration={700} />
                  <Area type="monotone" dataKey="supply" name="Current Supply"    stroke="#4ade80" fill="url(#supplyGrad)" strokeWidth={1.8} strokeDasharray="5 3" activeDot={{ r: 5 }} animationDuration={750} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
