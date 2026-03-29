import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import ForecastChart from '@/components/charts/ForecastChart';
import { skillApi } from '@/api/skillApi';

export default function ForecastDemand() {
  const [growth, setGrowth] = useState(0);
  const [points, setPoints] = useState<Array<{ month: string; value: number }>>([]);

  useEffect(() => {
    skillApi.scenarioForecast(growth).then((res) => {
      const first = res.data?.[0];
      const rows = first?.predicted_demand?.map((value: number, index: number) => ({ month: `M${index + 1}`, value })) || [];
      setPoints(rows);
    });
  }, [growth]);

  return (
    <Card title='Demand Forecasting'>
      <div className='mb-4'>
        <label className='text-sm text-slate-600'>Scenario: team growth {growth}%</label>
        <input className='w-full' type='range' min='-20' max='50' value={growth} onChange={(e) => setGrowth(Number(e.target.value))} />
      </div>
      <ForecastChart data={points} />
    </Card>
  );
}
