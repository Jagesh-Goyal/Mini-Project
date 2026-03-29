import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ForecastChart({ data }: { data: any[] }) {
  return (
    <div className="h-72">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Line dataKey="predicted_demand" stroke="#0EA5E9" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
