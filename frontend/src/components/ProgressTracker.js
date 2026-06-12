import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const PLATFORMS = [
  { key: "cfRating", label: "Codeforces", color: "#3b82f6" },
  { key: "lcRating", label: "LeetCode",   color: "#f59e0b" },
  { key: "ccRating", label: "CodeChef",   color: "#a855f7" },
  { key: "cpScore",  label: "CP Score",   color: "#6366f1" },
];

function delta(snapshots, key) {
  const vals = snapshots.map(s => s[key]).filter(v => v != null);
  if (vals.length < 2) return null;
  return vals[vals.length - 1] - vals[0];
}

function DeltaBadge({ value }) {
  if (value === null) return <span style={{ color: "#475569", fontSize: 12 }}>—</span>;
  const up    = value >= 0;
  const color = up ? "#22c55e" : "#ef4444";
  return (
    <span style={{ color, fontSize: 13, fontWeight: 700 }}>
      {up ? "↑" : "↓"} {Math.abs(value)}
    </span>
  );
}

function Sparkline({ snapshots, field, color }) {
  const data = snapshots
    .filter(s => s[field] != null)
    .map(s => ({ date: s.date.slice(5), val: Math.round(s[field]) }));

  if (data.length < 2) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 80, color: "#475569", fontSize: 12 }}>
        Need more data points
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={data}>
        <XAxis dataKey="date" hide />
        <YAxis domain={["auto", "auto"]} hide />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#94a3b8" }}
          itemStyle={{ color }}
          formatter={v => [v, ""]}
        />
        <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ProgressTracker({ snapshots }) {
  if (!snapshots || snapshots.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
        <div style={{ fontSize: 14 }}>No progress data yet.</div>
        <div style={{ fontSize: 12, marginTop: 6 }}>Come back tomorrow — your ratings are being tracked from today.</div>
      </div>
    );
  }

  const latest = snapshots[snapshots.length - 1];

  return (
    <div>
      {/* summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {PLATFORMS.map(({ key, label, color }) => (
          <div key={key} style={{ background: "#0f1117", border: "1px solid #2d3748", borderLeft: `3px solid ${color}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color }}>{latest[key] != null ? Math.round(latest[key]) : "—"}</div>
            <div style={{ marginTop: 4 }}>
              <span style={{ fontSize: 11, color: "#475569" }}>all time </span>
              <DeltaBadge value={delta(snapshots, key)} />
            </div>
          </div>
        ))}
      </div>

      {/* sparklines */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {PLATFORMS.map(({ key, label, color }) => (
          <div key={key} style={{ background: "#0f1117", border: "1px solid #2d3748", borderRadius: 10, padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{label}</div>
              <DeltaBadge value={delta(snapshots, key)} />
            </div>
            <Sparkline snapshots={snapshots} field={key} color={color} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#374151", textAlign: "right" }}>
        {snapshots.length} data point{snapshots.length !== 1 ? "s" : ""} · tracked since {snapshots[0]?.date}
      </div>
    </div>
  );
}
