import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';
import { calculateSkillGap, getRecommendation } from '@/lib/api';
import type { SkillGapResult, Recommendation } from '@/types';
import { PageWrapper } from '@/components/ui';
import toast from 'react-hot-toast';

export default function SkillGap() {
  const [skillName, setSkillName] = useState('');
  const [requiredCount, setRequiredCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const handleAnalyze = async () => {
    if (!skillName || !requiredCount) {
      toast.error('Please fill all fields');
      return;
    }
    setLoading(true);
    setResult(null);
    setRecommendation(null);

    try {
      const [gapRes, recRes] = await Promise.all([
        calculateSkillGap({ skill_name: skillName, required_count: parseInt(requiredCount) }),
        getRecommendation(skillName, parseInt(requiredCount)),
      ]);

      const gapData = gapRes.data as any;
      if (gapData?.error) {
        toast.error(gapData.error);
      } else {
        setResult(gapRes.data);
      }

      const recData = recRes.data as any;
      if (!recData?.error) {
        setRecommendation(recRes.data);
      }
    } catch {
      toast.error('Failed to analyze skill gap');
    } finally {
      setLoading(false);
    }
  };

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'text-emerald-400';
    if (gap <= 2) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getGapGlow = (gap: number) => {
    if (gap <= 0) return 'glow-emerald';
    if (gap <= 2) return 'glow-cyan';
    return 'glow-rose';
  };

  const getRecColor = (rec: string) => {
    if (rec.includes('No action')) return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20';
    if (rec.includes('Upskill')) return 'from-amber-500/20 to-amber-600/10 border-amber-500/20';
    if (rec.includes('combination')) return 'from-blue-500/20 to-purple-500/10 border-blue-500/20';
    return 'from-rose-500/20 to-rose-600/10 border-rose-500/20';
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">Skill Gap Analysis</h2>
        <p className="text-sm text-slate-400 mt-1">
          Analyze the gap between current workforce skills and requirements
        </p>
      </div>

      {/* Input Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-static p-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Skill Name</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                className="input-glass pl-10"
                placeholder="e.g., Python, React, AWS..."
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Required Count</label>
            <input
              type="number"
              className="input-glass"
              placeholder="10"
              value={requiredCount}
              onChange={(e) => setRequiredCount(e.target.value)}
            />
          </div>
          <div className="sm:self-end">
            <button
              className="btn-primary w-full sm:w-auto"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                  Analyzing...
                </span>
              ) : (
                <>
                  Analyze <ArrowRight size={16} />
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
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Current vs Required */}
            <div className="glass-card-static p-6 text-center">
              <p className="text-sm text-slate-400 mb-3">Current Employees</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="text-5xl font-bold text-blue-400"
              >
                {result.current}
              </motion.p>
              <div className="flex items-center justify-center gap-1 mt-2 text-sm text-slate-500">
                <TrendingUp size={14} /> with this skill
              </div>
            </div>

            <div className="glass-card-static p-6 text-center">
              <p className="text-sm text-slate-400 mb-3">Required</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="text-5xl font-bold text-purple-400"
              >
                {result.required}
              </motion.p>
              <div className="flex items-center justify-center gap-1 mt-2 text-sm text-slate-500">
                <AlertTriangle size={14} /> target count
              </div>
            </div>

            <div className={`glass-card-static p-6 text-center ${getGapGlow(result.gap ?? 0)}`}>
              <p className="text-sm text-slate-400 mb-3">Gap</p>
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                className={`text-5xl font-bold ${getGapColor(result.gap ?? 0)}`}
              >
                {(result.gap ?? 0) > 0 ? `+${result.gap}` : result.gap}
              </motion.p>
              <div className="flex items-center justify-center gap-1 mt-2 text-sm text-slate-500">
                {(result.gap ?? 0) <= 0 ? (
                  <>
                    <CheckCircle2 size={14} className="text-emerald-400" /> sufficient
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} className="text-rose-400" /> employees needed
                  </>
                )}
              </div>
            </div>

            {/* Recommendation */}
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-3"
              >
                <div
                  className={`glass-card-static p-6 border bg-gradient-to-r ${getRecColor(
                    recommendation.recommendation ?? 'No action'
                  )}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                      <Lightbulb size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        AI Recommendation
                      </h3>
                      <p className="text-sm text-slate-300 mb-3">
                        For <span className="text-white font-medium">{recommendation.skill}</span> with
                        a gap of <span className="font-medium text-white">{recommendation.gap}</span>:
                      </p>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08]">
                        <span className="text-white font-semibold text-base">
                          {recommendation.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
