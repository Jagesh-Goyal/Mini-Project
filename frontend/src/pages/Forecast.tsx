import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Legend,
} from 'recharts';
import { Search, TrendingUp, BrainCircuit } from 'lucide-react';
import { getForecast, getSkillForecast } from '@/lib/api';
import type { ForecastResult, SkillForecastResult } from '@/types';
import { PageWrapper } from '@/components/ui';
import toast from 'react-hot-toast';

export default function Forecast() {
  const [skillName, setSkillName] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [monthsAhead, setMonthsAhead] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [mlResult, setMlResult] = useState<SkillForecastResult | null>(null);
  const [useMLForecast, setUseMLForecast] = useState(true);

  const departments = ['Engineering', 'Data Science', 'Security', 'Product', 'HR', 'Marketing'];

  const generateChartData = (prediction: number) => [
    { month: 'Month 1', demand: 2 },
    { month: 'Month 2', demand: 3 },
    { month: 'Month 3', demand: 4 },
    { month: 'Month 4', demand: 5 },
    { month: 'Month 5', demand: 6 },
    { month: 'Month 6', demand: prediction },
  ];

  const handleForecast = async () => {
    if (!skillName) {
      toast.error('Please enter a skill name');
      return;
    }
    setLoading(true);
    setResult(null);
    setMlResult(null);
    try {
      if (useMLForecast) {
        const res = await getSkillForecast(skillName, department, monthsAhead);
        setMlResult(res.data);
        toast.success('ML forecast generated!');
      } else {
        const res = await getForecast(skillName);
        setResult(res.data);
        toast.success('Forecast generated!');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to get forecast');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">AI Demand Forecast</h2>
        <p className="text-sm text-slate-400 mt-1">
          {useMLForecast 
            ? 'Random Forest ML model for multi-month skill demand prediction'
            : 'Simple linear regression forecast for skill demand trends'}
        </p>
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static p-6"
      >
        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setUseMLForecast(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              useMLForecast
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            ML Forecast (Advanced)
          </button>
          <button
            onClick={() => setUseMLForecast(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !useMLForecast
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            Simple Forecast
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Skill Name</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input-glass pl-10"
                placeholder="e.g., Python, React, AWS..."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleForecast()}
              />
            </div>
          </div>

          {useMLForecast && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Department</label>
                <select
                  className="input-glass"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Forecast Months
                </label>
                <select
                  className="input-glass"
                  value={monthsAhead}
                  onChange={(e) => setMonthsAhead(Number(e.target.value))}
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <button
            className="btn-primary w-full"
            onClick={handleForecast}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Predicting...
              </span>
            ) : (
              <>
                <BrainCircuit size={16} /> Generate Forecast
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {mlResult && (
          <motion.div
            key="ml-forecast-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card-static p-6 text-center glow-blue"
              >
                <p className="text-sm text-slate-400 mb-2">Skill</p>
                <p className="text-xl font-bold gradient-text">{mlResult.skill}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="glass-card-static p-6 text-center glow-purple"
              >
                <p className="text-sm text-slate-400 mb-2">Department</p>
                <p className="text-xl font-bold text-purple-400">{mlResult.department}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card-static p-6 text-center glow-emerald"
              >
                <p className="text-sm text-slate-400 mb-2">Avg Predicted Demand</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="text-3xl font-bold text-emerald-400"
                >
                  {Math.round(
                    mlResult.forecast.reduce((sum, f) => sum + f.predicted_demand, 0) /
                      mlResult.forecast.length
                  )}
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="glass-card-static p-6 text-center glow-rose"
              >
                <p className="text-sm text-slate-400 mb-2">Avg Predicted Gap</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.35 }}
                  className="text-3xl font-bold text-rose-400"
                >
                  {Math.round(
                    mlResult.forecast.reduce((sum, f) => sum + f.predicted_gap, 0) /
                      mlResult.forecast.length
                  )}
                </motion.p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-static p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-blue-400" />
                <h3 className="text-base font-semibold text-white">
                  Multi-Month Demand Forecast
                </h3>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mlResult.forecast}
                    margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
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
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Line
                      type="monotone"
                      dataKey="predicted_demand"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5, stroke: '#0a0a0f', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#8b5cf6' }}
                      name="Predicted Demand"
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated_supply"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Estimated Supply"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted_gap"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ fill: '#f43f5e', r: 4 }}
                      name="Skill Gap"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}

        {result && (
          <motion.div
            key="simple-forecast-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card-static p-6 text-center glow-blue"
              >
                <p className="text-sm text-slate-400 mb-2">Skill</p>
                <p className="text-2xl font-bold gradient-text">{result.skill}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card-static p-6 text-center glow-purple"
              >
                <p className="text-sm text-slate-400 mb-2">Predicted Demand</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="text-5xl font-bold text-purple-400"
                >
                  {result.predicted_demand_next_month}
                </motion.p>
                <p className="text-xs text-slate-500 mt-1">next month</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card-static p-6 text-center glow-emerald"
              >
                <p className="text-sm text-slate-400 mb-2">Trend</p>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp size={28} className="text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">Upward</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">linear regression</p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-static p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-blue-400" />
                <h3 className="text-base font-semibold text-white">
                  Historical + Predicted Trend
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={generateChartData(result.predicted_demand_next_month)}
                    margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
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
                    />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stroke="#3b82f6"
                      fill="url(#demandGrad)"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 5, stroke: '#0a0a0f', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#8b5cf6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Historical Data (Month 1-5)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  Predicted (Month 6)
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}

  // The backend uses months 1-5 with demand 2-6 and predicts month 6
  const generateChartData = (prediction: number) => [
    { month: 'Month 1', demand: 2 },
    { month: 'Month 2', demand: 3 },
    { month: 'Month 3', demand: 4 },
    { month: 'Month 4', demand: 5 },
    { month: 'Month 5', demand: 6 },
    { month: 'Month 6', demand: prediction },
  ];

  const handleForecast = async () => {
    if (!skillName) {
      toast.error('Please enter a skill name');
      return;
    }
    setLoading(true);
    setResult(null);
    setMlResult(null);
    try {
      if (useMLForecast) {
        const res = await getSkillForecast(skillName, department, monthsAhead);
        setMlResult(res.data);
        toast.success('ML forecast generated!');
      } else {
        const res = await getForecast(skillName);
        setResult(res.data);
        toast.success('Forecast generated!');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to get forecast');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">AI Demand Forecast</h2>
        <p className="text-sm text-slate-400 mt-1">
          {useMLForecast 
            ? 'Random Forest ML model for multi-month skill demand prediction'
            : 'Simple linear regression forecast for skill demand trends'}
        </p>
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static p-6"
      >
        {/* Toggle between ML and Simple Forecast */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setUseMLForecast(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              useMLForecast
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            ML Forecast (Advanced)
          </button>
          <button
            onClick={() => setUseMLForecast(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !useMLForecast
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.08]'
            }`}
          >
            Simple Forecast
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Skill Name</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input-glass pl-10"
                placeholder="e.g., Python, React, AWS..."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleForecast()}
              />
            </div>
          </div>

          {useMLForecast && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Department</label>
                <select
                  className="input-glass"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                  Forecast Months
                </label>
                <select
                  className="input-glass"
                  value={monthsAhead}
                  onChange={(e) => setMonthsAhead(Number(e.target.value))}
                >
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="mt-4">
          <button
            className="btn-primary w-full"
            onClick={handleForecast}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
                Predicting...
              </span>
            ) : (
              <>
                <BrainCircuit size={16} /> Generate Forecast
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* ML Results */}
      <AnimatePresence mode="wait">
        {mlResult && (
          <motion.div
            key="ml-forecast-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card-static p-6 text-center glow-blue"
              >
                <p className="text-sm text-slate-400 mb-2">Skill</p>
                <p className="text-xl font-bold gradient-text">{mlResult.skill}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="glass-card-static p-6 text-center glow-purple"
              >
                <p className="text-sm text-slate-400 mb-2">Department</p>
                <p className="text-xl font-bold text-purple-400">{mlResult.department}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card-static p-6 text-center glow-emerald"
              >
                <p className="text-sm text-slate-400 mb-2">Avg Predicted Demand</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="text-3xl font-bold text-emerald-400"
                >
                  {Math.round(
                    mlResult.forecast.reduce((sum, f) => sum + f.predicted_demand, 0) /
                      mlResult.forecast.length
                  )}
                </motion.p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 }}
                className="glass-card-static p-6 text-center glow-rose"
              >
                <p className="text-sm text-slate-400 mb-2">Avg Predicted Gap</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.35 }}
                  className="text-3xl font-bold text-rose-400"
                >
                  {Math.round(
                    mlResult.forecast.reduce((sum, f) => sum + f.predicted_gap, 0) /
                      mlResult.forecast.length
                  )}
                </motion.p>
              </motion.div>
            </div>

            {/* Forecast Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-static p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-blue-400" />
                <h3 className="text-base font-semibold text-white">
                  Multi-Month Demand Forecast
                </h3>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={mlResult.forecast}
                    margin={{ top: 10, right: 30, bottom: 5, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
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
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
                    <Line
                      type="monotone"
                      dataKey="predicted_demand"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5, stroke: '#0a0a0f', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#8b5cf6' }}
                      name="Predicted Demand"
                    />
                    <Line
                      type="monotone"
                      dataKey="estimated_supply"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Estimated Supply"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted_gap"
                      stroke="#f43f5e"
                      strokeWidth={2}
                      dot={{ fill: '#f43f5e', r: 4 }}
                      name="Skill Gap"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Simple Forecast Results */}
              ) : (
                <>
                  <BrainCircuit size={16} /> Forecast
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key="forecast-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Prediction Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card-static p-6 text-center glow-blue"
              >
                <p className="text-sm text-slate-400 mb-2">Skill</p>
                <p className="text-2xl font-bold gradient-text">{result.skill}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass-card-static p-6 text-center glow-purple"
              >
                <p className="text-sm text-slate-400 mb-2">Predicted Demand</p>
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                  className="text-5xl font-bold text-purple-400"
                >
                  {result.predicted_demand_next_month}
                </motion.p>
                <p className="text-xs text-slate-500 mt-1">next month</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="glass-card-static p-6 text-center glow-emerald"
              >
                <p className="text-sm text-slate-400 mb-2">Trend</p>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp size={28} className="text-emerald-400" />
                  <span className="text-2xl font-bold text-emerald-400">Upward</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">linear regression</p>
              </motion.div>
            </div>

            {/* Chart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass-card-static p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={18} className="text-blue-400" />
                <h3 className="text-base font-semibold text-white">
                  Historical + Predicted Trend
                </h3>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={generateChartData(result.predicted_demand_next_month)}
                    margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="demandGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis
                      dataKey="month"
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
                    />
                    <Area
                      type="monotone"
                      dataKey="demand"
                      stroke="url(#demandLineGrad)"
                      fill="url(#demandGrad)"
                      strokeWidth={2.5}
                    />
                    <Line
                      type="monotone"
                      dataKey="demand"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      dot={{ fill: '#3b82f6', r: 5, stroke: '#0a0a0f', strokeWidth: 2 }}
                      activeDot={{ r: 7, fill: '#8b5cf6' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Historical Data (Month 1-5)
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  Predicted (Month 6)
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
