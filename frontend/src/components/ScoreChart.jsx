import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
export default function ScoreCharts({ scores }) {
  const data = [
    { subject: "Code Quality", value: scores.codeQuality || 0 },
    { subject: "Security", value: scores.security || 0 },
    { subject: "Performance", value: scores.performance || 0 },
    { subject: "Maintainability", value: scores.maintainability || 0 },
  ];
  return (
    <div style={{ width: "100%", height: 280, minHeight: 280 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border-light)" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="var(--text-muted)"
            tick={{ fill: "var(--text-secondary)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            stroke="var(--border-light)"
            tick={{ fill: "var(--text-muted)", fontSize: 9 }}
          />
          <Radar
            dataKey="value"
            stroke="#6366f1"
            fill="#6366f1"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}