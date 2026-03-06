import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Users, UserPlus, GraduationCap, ArrowUpRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { getRecommendation } from '@/lib/api';
import type { Recommendation } from '@/types';
import { PageWrapper, SkeletonCard, EmptyState, Badge } from '@/components/ui';
import toast from 'react-hot-toast';

export default function Recommendations() {
  const { skills, fetchSkills } = useStore();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  useEffect(() => {
    if (skills.length === 0) return;
    fetchRecommendations();
  }, [skills]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        skills.map((s) => getRecommendation(s.skill_name, 5).catch(() => null))
      );
      const recs = results
        .filter((r) => r !== null && !(r.data as any)?.error)
        .map((r) => r!.data);
      setRecommendations(recs);
    } catch {
      toast.error('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getRecIcon = (rec: string) => {
    if (rec.includes('No action')) return GraduationCap;
    if (rec.includes('Upskill')) return GraduationCap;
    if (rec.includes('combination')) return Users;
    return UserPlus;
  };

  const getRecBadge = (rec: string): { text: string; color: 'emerald' | 'amber' | 'blue' | 'rose' } => {
    if (rec.includes('No action')) return { text: 'Sufficient', color: 'emerald' };
    if (rec.includes('Upskill')) return { text: 'Upskill', color: 'amber' };
    if (rec.includes('combination')) return { text: 'Hire + Upskill', color: 'blue' };
    return { text: 'Hire Now', color: 'rose' };
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
        <p className="text-sm text-slate-400 mt-1">
          Smart workforce recommendations based on skill gap analysis (target: 5 per skill)
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState message="No recommendations available — add skills first" icon={Lightbulb} />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {recommendations.map((rec) => {
            const RecIcon = getRecIcon(rec.recommendation ?? 'No action');
            const badge = getRecBadge(rec.recommendation ?? 'No action');

            return (
              <motion.div
                key={rec.skill}
                variants={{
                  hidden: { opacity: 0, y: 15, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1 },
                }}
                className="glass-card p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 flex items-center justify-center">
                    <RecIcon size={18} className="text-purple-400" />
                  </div>
                  <Badge text={badge.text} color={badge.color} />
                </div>

                <h3 className="text-base font-semibold text-white mb-3">{rec.skill}</h3>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-2 rounded-xl bg-white/[0.02]">
                    <p className="text-lg font-bold text-blue-400">{rec.current}</p>
                    <p className="text-xs text-slate-500">Current</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/[0.02]">
                    <p className="text-lg font-bold text-purple-400">{rec.required}</p>
                    <p className="text-xs text-slate-500">Required</p>
                  </div>
                  <div className="text-center p-2 rounded-xl bg-white/[0.02]">
                    <p className={`text-lg font-bold ${(rec.gap ?? 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {(rec.gap ?? 0) > 0 ? `+${rec.gap}` : rec.gap}
                    </p>
                    <p className="text-xs text-slate-500">Gap</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <p className="text-sm text-slate-300 flex items-start gap-2">
                    <Lightbulb size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    {rec.recommendation}
                  </p>
                </div>

                {(rec.gap ?? 0) > 0 && (
                  <div className="flex gap-2 mt-4">
                    <button className="btn-primary text-xs py-2 px-4 flex-1 justify-center">
                      <UserPlus size={14} /> Hire
                    </button>
                    <button className="btn-secondary text-xs py-2 px-4 flex-1 justify-center">
                      <GraduationCap size={14} /> Upskill
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </PageWrapper>
  );
}
