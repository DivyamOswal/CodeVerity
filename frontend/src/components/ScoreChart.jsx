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
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis
            dataKey="subject"
            stroke="#6e7681"
            tick={{ fill: "#8b949e", fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            stroke="#30363d"
            tick={{ fill: "#484f58", fontSize: 9 }}
          />
          <Radar
            dataKey="value"
            stroke="#3fb950"
            fill="#3fb950"
            fillOpacity={0.18}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}