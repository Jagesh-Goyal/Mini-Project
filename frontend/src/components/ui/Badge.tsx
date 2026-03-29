interface BadgeProps {
  label: string;
  tone?: 'green' | 'amber' | 'red' | 'blue';
  variant?: 'green' | 'amber' | 'red' | 'blue';
  className?: string;
}

export default function Badge({ label, tone, variant, className = '' }: BadgeProps) {
  const badgeVariant = tone || variant || 'blue';
  const badgeClass = `badge-${badgeVariant}`;
  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {label}
    </span>
  );
}
