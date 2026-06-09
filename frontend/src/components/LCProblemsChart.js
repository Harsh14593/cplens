import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = { Easy: "#22c55e", Medium: "#f59e0b", Hard: "#ef4444" };

export default function LCProblemsChart({ stats }) {
  const filtered = stats.filter(s => s.difficulty !== "All");
  const total = stats.find(s => s.difficulty === "All")?.count
    ?? filtered.reduce((a, s) => a + s.count, 0);
  const data = filtered.map(s => ({ name: s.difficulty, value: s.count }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((entry, i) => <Cell key={i} fill={COLORS[entry.name]} />)}
            </Pie>
            <Tooltip
              contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8 }}
              formatter={(val, name) => [`${val} solved`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#e2e8f0", lineHeight: 1 }}>{total}</div>
          <div style={{ fontSize: 10, color: "#64748b", marginTop: 5, letterSpacing: "1.2px", textTransform: "uppercase" }}>Solved</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
        {data.map(({ name, value }) => (
          <div key={name} style={{ textAlign: "center", padding: "10px 8px", background: "#0f1117", borderRadius: 8, borderTop: `3px solid ${COLORS[name]}` }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: COLORS[name] }}>{value}</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, letterSpacing: "0.8px", textTransform: "uppercase" }}>{name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
