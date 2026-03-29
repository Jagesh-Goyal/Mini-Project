import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { api } from '@/api/axiosConfig';

export default function Recommendations() {
  const [tab, setTab] = useState<'upskilling' | 'hiring' | 'training'>('upskilling');
  const [rows, setRows] = useState<Array<{ skill: string; action: string; resource: string; priority: number }>>([]);

  useEffect(() => {
    const endpoint = tab === 'hiring' ? '/api/recommendations/hiring' : tab === 'training' ? '/api/recommendations/training' : '/api/recommendations/employee/1';
    api.get(endpoint).then((res) => setRows(res.data.recommendations || []));
  }, [tab]);

  return (
    <div className='space-y-4'>
      <Card>
        <div className='flex gap-2'>
          <button className='btn-primary' onClick={() => setTab('upskilling')}>Upskilling</button>
          <button className='btn-primary' onClick={() => setTab('hiring')}>Hiring</button>
          <button className='btn-primary' onClick={() => setTab('training')}>Training Programs</button>
        </div>
      </Card>
      <div className='grid gap-3'>
        {rows.map((row, idx) => (
          <Card key={`${row.skill}-${idx}`}>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold'>{row.skill}</h3>
              <Badge label={row.action.toUpperCase()} tone={row.action === 'hire' ? 'red' : row.action === 'train' ? 'amber' : 'green'} />
            </div>
            <p className='text-sm text-slate-600 mt-2'>Priority: {row.priority}/10</p>
            <a href={row.resource} target='_blank' rel='noreferrer' className='text-sm text-indigo-600 mt-1 inline-block'>Learning Resource</a>
          </Card>
        ))}
      </div>
    </div>
  );
}
