import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const ORDER = ["800-1199", "1200-1599", "1600-1999", "2000+"];
const COLORS = { "800-1199": "#808080", "1200-1599": "#008000", "1600-1999": "#03a89e", "2000+": "#ff8c00" };

export default function DifficultyChart({ data }) {
  const chartData = ORDER
    .filter(k => data[k] && data[k].attempted > 0)
    .map(range => ({
      range,
      accuracy: Math.round((data[range].solved / data[range].attempted) * 100),
      solved: data[range].solved,
      attempted: data[range].attempted,
    }));

  if (!chartData.length) return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Not enough data yet</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={48}>
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
