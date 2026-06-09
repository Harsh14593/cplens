import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CCRatingChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis dataKey="contest" hide />
        <YAxis domain={["auto", "auto"]} tick={{ fill: "#94a3b8", fontSize: 12 }} />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8 }}
          labelStyle={{ color: "#94a3b8", fontSize: 11 }}
          formatter={(val, _, props) => [`${val} (Rank #${props.payload.rank})`, "Rating"]}
          labelFormatter={(_, payload) => payload?.[0]?.payload?.contest ?? ""}
        />
        <Line type="monotone" dataKey="rating" stroke="#22c55e" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
