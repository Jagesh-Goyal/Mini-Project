import { useEffect, useState } from "react";

import api from "../api/axiosConfig";
import ForecastChart from "../components/charts/ForecastChart";
import WorkforceBarChart from "../components/charts/WorkforceBarChart";
import Card from "../components/ui/Card";

export default function Dashboard() {
  const [forecast, setForecast] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);

  useEffect(() => {
    api.get("/api/forecast/skills").then((r) => setForecast(r.data));
    api.get("/api/gap/org").then((r) => setGaps(r.data.slice(0, 5)));
  }, []);

  const cards = [
    ["Total Employees", 142],
    ["Skills Tracked", 48],
    ["Avg Skill Gap %", 37],
    ["Critical Departments", 3]
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {cards.map(([k, v]) => (
          <Card key={k as string}>
            <p className="text-sm text-slate-500">{k as string}</p>
            <p className="text-2xl font-bold">{String(v)}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Skill Demand Forecast"><ForecastChart data={forecast} /></Card>
        <Card title="Top 5 Skill Gaps"><WorkforceBarChart data={gaps} /></Card>
      </div>
    </div>
  );
}
