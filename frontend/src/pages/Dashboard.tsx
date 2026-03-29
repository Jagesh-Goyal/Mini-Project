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
    <div className='dashboard-container'>
      <div className='grid-4'>
        {kpis.map((item, index) => (
          <div
            key={item.label}
            className='kpi-card'
            style={{ animationDelay: `calc(${index} * 0.08s)` }}
          >
            <p className='kpi-label'>{item.label}</p>
            <p className='kpi-value'>{item.value}</p>
          </div>
        ))}
      </div>

      <div className='grid-dashboard'>
        <Card title='Skill Demand Forecast'>
          <ForecastChart data={lineData} />
        </Card>
        <Card title='Top 5 Skill Gaps'>
          <WorkforceBarChart data={barData} />
        </Card>
        <Card title='Recent Activity'>
          <ul className='activity-list'>
            <li>3 employees added in Engineering</li>
            <li>Skill gap report generated for Data team</li>
            <li>2 resumes parsed and mapped to employees</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
