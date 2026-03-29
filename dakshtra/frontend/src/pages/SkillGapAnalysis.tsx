import { useSkillGap } from "../hooks/useSkillGap";
import GapRadarChart from "../components/charts/GapRadarChart";
import Badge from "../components/ui/Badge";

export default function SkillGapAnalysis() {
  const { data, loading } = useSkillGap();
  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="card">
        <GapRadarChart data={data.slice(0, 8)} />
      </div>
      <div className="card space-y-2">
        {data.slice(0, 10).map((row: any) => (
          <div key={row.skill_name} className="flex items-center justify-between border-b pb-2">
            <span>{row.skill_name}</span>
            <Badge label={row.risk_level} tone={row.risk_level === "critical" ? "danger" : "warning"} />
          </div>
        ))}
      </div>
    </div>
  );
}
