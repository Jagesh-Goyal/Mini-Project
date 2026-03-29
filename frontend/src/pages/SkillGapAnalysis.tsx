import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import GapRadarChart from '@/components/charts/GapRadarChart';
import { useSkillGap } from '@/hooks/useSkillGap';

export default function SkillGapAnalysis() {
  const { items } = useSkillGap();

  const radar = items.slice(0, 6).map((item) => ({ name: item.skill, fullMark: item.required_level, value: item.avg_current_level }));

  return (
    <div className='space-y-4'>
      <Card title='Skill Gap Radar'>
        <GapRadarChart data={radar} />
      </Card>
      <Card title='Gap Analysis Table'>
        <div className='space-y-2'>
          {items.map((item) => (
            <div key={item.skill} className='flex items-center justify-between border-b border-slate-100 py-2 text-sm'>
              <span>{item.skill}</span>
              <div className='flex items-center gap-3'>
                <span>{item.gap_percent}%</span>
                <Badge label={item.risk_level.toUpperCase()} tone={item.gap_percent > 70 ? 'red' : item.gap_percent > 30 ? 'amber' : 'green'} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
