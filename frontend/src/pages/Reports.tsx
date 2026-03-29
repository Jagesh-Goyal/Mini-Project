import { useState } from 'react';
import Card from '@/components/ui/Card';
import { reportApi } from '@/api/reportApi';

export default function Reports() {
  const [reportType, setReportType] = useState('workforce-summary');
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const generate = async () => {
    const apiMap = {
      'workforce-summary': reportApi.workforceSummary,
      'skill-gap': reportApi.skillGap,
      forecast: reportApi.forecast,
    } as const;
    const res = await apiMap[reportType as keyof typeof apiMap]();
    setPreview(res.data);
  };

  return (
    <Card title='Reports'>
      <div className='flex flex-wrap gap-3 mb-4'>
        <select className='input max-w-xs' value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value='workforce-summary'>Workforce Summary</option>
          <option value='skill-gap'>Skill Gap</option>
          <option value='forecast'>Forecast</option>
        </select>
        <button className='btn-primary' onClick={() => void generate()}>Generate Report</button>
      </div>
      <pre className='text-xs bg-slate-100 rounded-xl p-3 overflow-auto'>{preview ? JSON.stringify(preview, null, 2) : 'No report generated yet'}</pre>
    </Card>
  );
}
