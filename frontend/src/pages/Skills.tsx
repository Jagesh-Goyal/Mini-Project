import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useStore } from '@/store/useStore';
import {
  PageWrapper,
  Modal,
  Badge,
  SkeletonCard,
  EmptyState,
} from '@/components/ui';
import toast from 'react-hot-toast';

const categoryColors: Record<string, 'blue' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'amber'> = {
  Frontend: 'blue',
  Backend: 'purple',
  DevOps: 'cyan',
  Design: 'rose',
  Data: 'emerald',
  Management: 'amber',
  AI: 'purple',
  Cloud: 'cyan',
  Security: 'rose',
  Mobile: 'blue',
};

function getCategoryColor(category: string): 'blue' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'amber' {
  return categoryColors[category] || 'blue';
}

export default function Skills() {
  const { skills, loadingSkills, fetchSkills, addSkill } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ skill_name: '', category: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSkills();
  }, []);

  const handleAdd = async () => {
    if (!form.skill_name || !form.category) {
      toast.error('Please fill all fields');
      return;
    }
    setSubmitting(true);
    const success = await addSkill(form);
    setSubmitting(false);
    if (success) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setForm({ skill_name: '', category: '' });
      setShowAdd(false);
    }
  };

  const categories = [...new Set(skills.map((s) => s.category))];

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Skills</h2>
          <p className="text-sm text-slate-400 mt-1">
            {skills.length} skills across {categories.length} categories
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add Skill
        </button>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300"
            >
              {cat} ({skills.filter((s) => s.category === cat).length})
            </span>
          ))}
        </div>
      )}

      {/* Skills Grid */}
      {loadingSkills ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : skills.length === 0 ? (
        <EmptyState message="No skills added yet" icon={Zap} />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {skills.map((skill) => (
            <motion.div
              key={skill.id}
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.97 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              className="glass-card p-5 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-purple-500/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap size={18} className="text-blue-400" />
                </div>
                <span className="text-xs text-slate-500">#{skill.id}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 truncate">
                {skill.skill_name}
              </h3>
              <Badge text={skill.category} color={getCategoryColor(skill.category)} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Add Skill Modal */}
      <AnimatePresence>
        {showAdd && (
          <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Skill">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Skill Name</label>
                <div className="relative">
                  <Zap size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="input-glass pl-10"
                    placeholder="React.js"
                    value={form.skill_name}
                    onChange={(e) => setForm({ ...form, skill_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Category</label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    className="input-glass pl-10"
                    placeholder="Frontend"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn-secondary flex-1" onClick={() => setShowAdd(false)}>
                  Cancel
                </button>
                <button className="btn-primary flex-1 justify-center" onClick={handleAdd} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Skill'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
