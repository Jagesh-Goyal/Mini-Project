import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  x: number;
  y: number;
  z?: number;
  [key: string]: any;
}

interface SkillHeatmapProps {
  data: DataPoint[];
}

export default function SkillHeatmap({ data }: SkillHeatmapProps) {
  return (
    <div className="recharts-wrapper h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="x" />
          <YAxis dataKey="y" />
          <Tooltip />
          <Scatter
            name="Skills"
            data={data}
            fill="#6366F1"
            fillOpacity={0.6}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
