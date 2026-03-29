import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  name: string;
  fullMark: number;
  [key: string]: any;
}

interface GapRadarChartProps {
  data: DataPoint[];
}

export default function GapRadarChart({ data }: GapRadarChartProps) {
  return (
    <div className="recharts-wrapper h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis />
          <Radar
            name="Gap"
            dataKey="value"
            stroke="#6366F1"
            fill="#6366F1"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
