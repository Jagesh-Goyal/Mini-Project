import { useState } from 'react';
import Card from '@/components/ui/Card';
import { api } from '@/api/axiosConfig';

export default function ResumeParser() {
  const [file, setFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<Array<{ skill: string; confidence: number }>>([]);

  const parse = async () => {
    if (!file) return;
    const form = new FormData();
    form.append('upload', file);
    const res = await api.post('/api/resume/parse', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    setSkills(res.data.skills || []);
  };

  return (
    <Card title='Resume Parser'>
      <div className='space-y-3'>
        <input type='file' accept='.pdf' onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className='btn-primary' onClick={() => void parse()}>Parse Resume</button>
        <div className='flex flex-wrap gap-2'>
          {skills.map((row) => (
            <span key={row.skill} className='px-3 py-1 rounded-full text-xs bg-sky-100 text-sky-700'>
              {row.skill} ({Math.round(row.confidence * 100)}%)
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
