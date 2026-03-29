import { useEffect, useState } from "react";

import api from "../api/axiosConfig";
import ForecastChart from "../components/charts/ForecastChart";

export default function ForecastDemand() {
  const [growth, setGrowth] = useState(20);
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    api.post("/api/forecast/scenario", { growth_percent: growth }).then((r) => setRows(r.data));
  }, [growth]);

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="block text-sm">Scenario Simulator: Team Growth {growth}%</label>
        <input type="range" min={0} max={100} value={growth} onChange={(e) => setGrowth(Number(e.target.value))} className="w-full" />
      </div>
      <div className="card"><ForecastChart data={rows} /></div>
    </div>
  );
}
