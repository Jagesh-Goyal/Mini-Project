import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import type { SkillPoint } from "../../types";

export default function SkillHeatmap({ data }: { data: SkillPoint[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <ScatterChart>
          <XAxis dataKey="employee" name="Employee" />
          <YAxis dataKey="skill" name="Skill" />
          <ZAxis dataKey="score" range={[60, 350]} />
          <Tooltip />
          <Scatter data={data} fill="#6366F1" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
