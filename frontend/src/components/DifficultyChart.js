import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = { "800-1199": "#808080", "1200-1599": "#008000", "1600-1999": "#03a89e", "2000+": "#ff8c00" };

export default function DifficultyChart({ data }) {
  const chartData = Object.entries(data)
    .filter(([k]) => k !== "unrated")
    .map(([range, stats]) => ({
      range,
      accuracy: stats.attempted > 0 ? Math.round((stats.solved / stats.attempted) * 100) : 0,
      solved: stats.solved,
      attempted: stats.attempted,
    }))
    .sort((a, b) => a.range.localeCompare(b.range));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={36}>
        <XAxis dataKey="range" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8 }}
          formatter={(val, _, props) => [
            `${val}% (${props.payload.solved}/${props.payload.attempted})`,
            "Accuracy"
          ]}
        />
        <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.range] ?? "#6366f1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
