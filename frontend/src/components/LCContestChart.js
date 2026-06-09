import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function LCContestChart({ data }) {
  const chartData = data.map(c => ({
    contest: c.contest?.title?.replace("Weekly Contest ", "W").replace("Biweekly Contest ", "B") ?? "",
    rating: Math.round(c.rating),
    solved: c.problemsSolved,
    total: c.totalProblems,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis dataKey="contest" hide />
        <YAxis domain={["auto", "auto"]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8", fontSize: 11 }}
          formatter={(val, name, props) => [
            `${val} (${props.payload.solved}/${props.payload.total} solved)`,
            "Rating"
          ]}
        />
        <Line type="monotone" dataKey="rating" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
