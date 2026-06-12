import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CF_BUCKETS = {
  "DP":          ["dp", "bitmasks"],
  "Graphs":      ["graphs", "dfs and similar", "bfs", "shortest paths", "minimum spanning tree", "flows", "2-sat"],
  "Trees":       ["trees", "lca"],
  "Math":        ["math", "number theory", "combinatorics", "geometry", "probabilities", "fft", "matrices"],
  "Structures":  ["data structures", "sortings", "hashing"],
  "Strings":     ["strings", "string suffix structures"],
  "Greedy":      ["greedy", "constructive algorithms", "implementation"],
  "Search":      ["binary search", "ternary search", "divide and conquer", "two pointers"],
};

const LC_BUCKETS = {
  "DP":          ["Dynamic Programming", "Memoization"],
  "Graphs":      ["Graph", "Breadth-First Search", "Depth-First Search", "Topological Sort", "Shortest Path", "Union Find"],
  "Trees":       ["Tree", "Binary Tree", "Binary Search Tree"],
  "Math":        ["Math", "Number Theory", "Combinatorics", "Geometry", "Probability and Statistics"],
  "Structures":  ["Hash Table", "Stack", "Queue", "Heap (Priority Queue)", "Linked List", "Monotonic Stack"],
  "Strings":     ["String", "String Matching", "Trie"],
  "Greedy":      ["Greedy", "Simulation", "Brainteaser"],
  "Search":      ["Binary Search", "Two Pointers", "Sliding Window", "Divide and Conquer", "Backtracking"],
};

// LC max solved per tag to normalize (rough ceiling)
const LC_MAX = 80;

function cfBucketScore(cfTagStats, tags) {
  const hits = tags.filter(t => cfTagStats[t]?.attempted >= 3);
  if (!hits.length) return 0;
  return Math.round(
    hits.reduce((a, t) => a + cfTagStats[t].solved / cfTagStats[t].attempted, 0) / hits.length * 100
  );
}

function lcBucketScore(lcTagMap, tags) {
  const hits = tags.filter(t => lcTagMap[t] != null);
  if (!hits.length) return 0;
  const avg = hits.reduce((a, t) => a + lcTagMap[t], 0) / hits.length;
  return Math.min(100, Math.round((avg / LC_MAX) * 100));
}

export default function SkillRadar({ cfTagStats, lcTagCounts }) {
  const hasCF = cfTagStats && Object.keys(cfTagStats).length > 0;
  const hasLC = lcTagCounts && lcTagCounts.length > 0;

  if (!hasCF && !hasLC) {
    return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>No tag data available</p>;
  }

  // build LC tag → solved map
  const lcTagMap = {};
  if (hasLC) lcTagCounts.forEach(({ tagName, problemsSolved }) => { lcTagMap[tagName] = problemsSolved; });

  const chartData = Object.keys(CF_BUCKETS).map(label => {
    const row = { subject: label, fullMark: 100 };
    if (hasCF) row.CF  = cfBucketScore(cfTagStats, CF_BUCKETS[label]);
    if (hasLC) row.LC  = lcBucketScore(lcTagMap, LC_BUCKETS[label]);
    return row;
  });

  const hasAnyData = chartData.some(d => (d.CF ?? 0) + (d.LC ?? 0) > 0);
  if (!hasAnyData) return <p style={{ color: "#64748b", fontSize: 13, marginTop: 12 }}>Solve more tagged problems to unlock your skill map</p>;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={chartData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
        <PolarGrid stroke="#2d3748" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {hasCF && (
          <Radar name="Codeforces" dataKey="CF"
            stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2}
            dot={{ fill: "#6366f1", r: 3, strokeWidth: 0 }}
          />
        )}
        {hasLC && (
          <Radar name="LeetCode" dataKey="LC"
            stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 3, strokeWidth: 0 }}
          />
        )}
        <Legend
          iconType="circle" iconSize={8}
          wrapperStyle={{ fontSize: 12, color: "#94a3b8", paddingTop: 8 }}
        />
        <Tooltip
          contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8, fontSize: 13 }}
          formatter={(val, name) => [`${val}%`, name]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
