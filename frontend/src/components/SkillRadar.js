import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";

const BUCKETS = {
  "DP":          ["dp", "bitmasks"],
  "Graphs":      ["graphs", "dfs and similar", "bfs", "shortest paths", "minimum spanning tree", "flows", "2-sat"],
  "Trees":       ["trees", "lca"],
  "Math":        ["math", "number theory", "combinatorics", "geometry", "probabilities", "fft", "matrices"],
  "Structures":  ["data structures", "sortings", "hashing"],
  "Strings":     ["strings", "string suffix structures"],
  "Greedy":      ["greedy", "constructive algorithms", "implementation"],
  "Search":      ["binary search", "ternary search", "divide and conquer", "two pointers"],
};

export default function SkillRadar({ cfTagStats }) {
  if (!cfTagStats) return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>No tag data available</p>;

  const chartData = Object.entries(BUCKETS).map(([label, tags]) => {
    const hits = tags.filter(t => cfTagStats[t]?.attempted >= 3);
    const score = hits.length
      ? Math.round(hits.reduce((a, t) => {
          const { solved, attempted } = cfTagStats[t];
          return a + solved / attempted;
        }, 0) / hits.length * 100)
      : 0;
    return { subject: label, score, fullMark: 100 };
  });

  const hasData = chartData.some(d => d.score > 0);
  if (!hasData) return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Solve more tagged problems to unlock your skill map</p>;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={chartData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
        <PolarGrid stroke="#2d3748" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Accuracy"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: "#818cf8" }}
        />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8, fontSize: 13 }}
          formatter={(val) => [`${val}%`, "Accuracy"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
