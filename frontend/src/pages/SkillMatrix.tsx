import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import SkillHeatmap from '@/components/charts/SkillHeatmap';
import { skillApi } from '@/api/skillApi';

export default function SkillMatrix() {
  const [data, setData] = useState<{ x: string[]; y: string[]; values: number[][] }>({ x: [], y: [], values: [] });

  useEffect(() => {
    skillApi.heatmap().then((res) => setData(res.data));
  }, []);

  return (
    <Card title='Skill Matrix'>
      <SkillHeatmap x={data.x} y={data.y} values={data.values} />
    </Card>
  );
}
