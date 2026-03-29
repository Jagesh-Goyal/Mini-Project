import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function WorkforceBarChart({ data }: { data: any[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="skill_name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="gap_percent" fill="#EF4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
