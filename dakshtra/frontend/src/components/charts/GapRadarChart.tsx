import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";

export default function GapRadarChart({ data }: { data: any[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <RadarChart outerRadius={90} data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="skill_name" />
          <Radar dataKey="required_level" stroke="#6366F1" fill="#6366F1" fillOpacity={0.3} />
          <Radar dataKey="avg_current_level" stroke="#0EA5E9" fill="#0EA5E9" fillOpacity={0.2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
