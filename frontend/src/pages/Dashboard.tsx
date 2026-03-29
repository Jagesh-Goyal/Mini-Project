import Card from '@/components/ui/Card';
import ForecastChart from '@/components/charts/ForecastChart';
import WorkforceBarChart from '@/components/charts/WorkforceBarChart';

const kpis = [
  { label: 'Total Employees', value: 128 },
  { label: 'Skills Tracked', value: 46 },
  { label: 'Avg Skill Gap %', value: 39 },
  { label: 'Critical Risk Departments', value: 3 },
];

const lineData = [
  { month: 'Jan', value: 40 },
  { month: 'Feb', value: 44 },
  { month: 'Mar', value: 46 },
  { month: 'Apr', value: 48 },
  { month: 'May', value: 53 },
  { month: 'Jun', value: 58 },
];

const barData = [
  { name: 'Cloud', value: 76 },
  { name: 'MLOps', value: 68 },
  { name: 'Kubernetes', value: 62 },
  { name: 'Cybersecurity', value: 57 },
  { name: 'Data Eng', value: 51 },
];

export default function Dashboard() {
  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4'>
        {kpis.map((item) => (
          <Card key={item.label}>
            <p className='text-sm text-slate-500'>{item.label}</p>
            <p className='text-3xl font-semibold text-slate-800 mt-1'>{item.value}</p>
          </Card>
        ))}
      </div>
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-4'>
        <Card title='Skill Demand Forecast'>
          <ForecastChart data={lineData} />
        </Card>
        <Card title='Top 5 Skill Gaps'>
          <WorkforceBarChart data={barData} />
        </Card>
        <Card title='Recent Activity'>
          <ul className='space-y-3 text-sm text-slate-600'>
            <li>3 employees added in Engineering</li>
            <li>Skill gap report generated for Data team</li>
            <li>2 resumes parsed and mapped to employees</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
