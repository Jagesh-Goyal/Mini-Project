import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'cyan' | 'emerald' | 'rose';
  suffix?: string;
  delay?: number;
}

const colorMap = {
  blue: {
    glow: 'glow-blue',
    iconBg: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
    border: 'hover:border-blue-500/20',
  },
  purple: {
    glow: 'glow-purple',
    iconBg: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-400',
    border: 'hover:border-purple-500/20',
  },
  cyan: {
    glow: 'glow-cyan',
    iconBg: 'from-cyan-500/20 to-cyan-600/10',
    iconColor: 'text-cyan-400',
    border: 'hover:border-cyan-500/20',
  },
  emerald: {
    glow: 'glow-emerald',
    iconBg: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
    border: 'hover:border-emerald-500/20',
  },
  rose: {
    glow: 'glow-rose',
    iconBg: 'from-rose-500/20 to-rose-600/10',
    iconColor: 'text-rose-400',
    border: 'hover:border-rose-500/20',
  },
};

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return (
    <span className="flex items-baseline gap-1">
      <motion.span>{rounded}</motion.span>
      {suffix && <span className="text-sm text-slate-400">{suffix}</span>}
    </span>
  );
}

export default function MetricCard({ title, value, icon: Icon, color, suffix, delay = 0 }: MetricCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`glass-card p-5 ${c.border} cursor-default`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center`}>
          <Icon size={22} className={c.iconColor} />
        </div>
      </div>
      <div className="text-3xl font-bold text-white mb-1 tabular-nums">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <p className="text-sm text-slate-400">{title}</p>
    </motion.div>
  );
}

// Page wrapper with stagger animation
export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {children}
    </motion.div>
  );
}

// Section header
export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-1">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
    </div>
  );
}

// Loading skeleton card
export function SkeletonCard() {
  return (
    <div className="glass-card-static p-5 space-y-3">
      <div className="skeleton h-11 w-11 rounded-xl" />
      <div className="skeleton h-8 w-20 rounded-lg" />
      <div className="skeleton h-4 w-32 rounded-md" />
    </div>
  );
}

// Loading skeleton row
export function SkeletonRow() {
  return (
    <div className="flex gap-4 py-3 px-4 border-b border-white/[0.04]">
      <div className="skeleton h-5 w-8 rounded" />
      <div className="skeleton h-5 flex-1 rounded" />
      <div className="skeleton h-5 w-24 rounded" />
      <div className="skeleton h-5 w-20 rounded" />
    </div>
  );
}

// Modal Wrapper
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card-static p-6 w-full max-w-lg relative z-10 border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
        {children}
      </motion.div>
    </motion.div>
  );
}

// Badge
interface BadgeProps {
  text: string;
  color?: 'blue' | 'purple' | 'cyan' | 'emerald' | 'rose' | 'amber';
}

const badgeColors = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function Badge({ text, color = 'blue' }: BadgeProps) {
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${badgeColors[color]}`}>
      {text}
    </span>
  );
}

// Empty state
export function EmptyState({ message, icon: Icon }: { message: string; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      {Icon && <Icon size={48} className="mb-4 opacity-30" />}
      <p className="text-sm">{message}</p>
    </div>
  );
}
