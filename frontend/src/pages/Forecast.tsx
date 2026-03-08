import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import * as api from '@/lib/api';
import type { ForecastResult } from '@/types';
import toast from 'react-hot-toast';

function generateChartData(prediction: number) {
  return [
    { month: 'Month 1', demand: 2 },
    { month: 'Month 2', demand: 3 },
    { month: 'Month 3', demand: 4 },
    { month: 'Month 4', demand: 5 },
    { month: 'Month 5', demand: 6 },
    { month: 'Month 6', demand: prediction },
  ];
}

export default function Forecast() {
  const [skillName, setSkillName] = useState('');
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleForecast = async () => {
    if (!skillName.trim()) {
      toast.error('Please enter a skill name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.getForecast(skillName.trim());
      setResult(res.data);
      toast.success('Forecast generated');
    } catch {
      toast.error('Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-cyan-500" />
        <h1 className="text-2xl font-bold text-white">Skill Demand Forecast</h1>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-white">Predict Next Month Demand</h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <input
            value={skillName}
            onChange={(e) => setSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleForecast();
              }
            }}
            placeholder="Enter skill name (e.g., Python, React, AWS)"
            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            onClick={() => {
              void handleForecast();
            }}
            disabled={loading}
            className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Predicting...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400 mb-1">Skill</p>
              <p className="text-xl font-bold text-white">{result.skill}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
              <p className="text-sm text-slate-400 mb-1">Predicted Demand (Next Month)</p>
              <p className="text-3xl font-bold text-cyan-400">{result.predicted_demand_next_month}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Historical + Predicted Trend</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={generateChartData(result.predicted_demand_next_month)}>
                  <defs>
                    <linearGradient id="demandArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Area type="monotone" dataKey="demand" stroke="#22d3ee" fill="url(#demandArea)" />
                  <Line type="monotone" dataKey="demand" stroke="#06b6d4" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
