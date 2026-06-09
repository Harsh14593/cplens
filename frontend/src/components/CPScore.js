const TIERS = [
  { min: 2600, label: "Grandmaster", color: "#ef4444" },
  { min: 2200, label: "Master",      color: "#ff8c00" },
  { min: 1800, label: "Expert",      color: "#a855f7" },
  { min: 1400, label: "Competitor",  color: "#3b82f6" },
  { min: 900,  label: "Apprentice",  color: "#22c55e" },
  { min: 0,    label: "Beginner",    color: "#64748b" },
];

export function computeCPScore({ user, lc, cc }) {
  const entries = [];
  if (user?.rating)                 entries.push({ norm: Math.min(user.rating, 2800) / 2800,          weight: 0.4 });
  if (lc?.contest_ranking?.rating)  entries.push({ norm: Math.min(lc.contest_ranking.rating, 2800) / 2800, weight: 0.4 });
  if (cc?.rating)                   entries.push({ norm: Math.min(cc.rating, 2500) / 2500,             weight: 0.2 });
  if (!entries.length) return null;
  const totalWeight = entries.reduce((a, e) => a + e.weight, 0);
  const weighted    = entries.reduce((a, e) => a + e.norm * e.weight, 0);
  return Math.round((weighted / totalWeight) * 3000);
}

export default function CPScore({ score }) {
  if (score === null || score === undefined) return null;
  const tier = TIERS.find(t => score >= t.min) ?? TIERS[TIERS.length - 1];
  const pct  = Math.round((score / 3000) * 100);

  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 16,
      background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)",
      border: "1px solid #2d3748", padding: "36px 40px",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32,
    }}>
      <div style={{ position: "absolute", top: "50%", left: 260, transform: "translateY(-50%)", width: 300, height: 300, borderRadius: "50%", background: tier.color, opacity: 0.05, filter: "blur(60px)", pointerEvents: "none" }} />

      <div>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>Unified CP Score</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 80, fontWeight: 900, color: tier.color, lineHeight: 1, letterSpacing: -3 }}>{score}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: tier.color, opacity: 0.85 }}>{tier.label}</span>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#475569" }}>
          Normalized across Codeforces · LeetCode · CodeChef
        </div>
      </div>

      <div style={{ flexShrink: 0, textAlign: "center" }}>
        <svg width={110} height={110} viewBox="0 0 110 110">
          <circle cx={55} cy={55} r={46} fill="none" stroke="#1e2330" strokeWidth={10} />
          <circle cx={55} cy={55} r={46} fill="none" stroke={tier.color} strokeWidth={10}
            strokeDasharray={`${2 * Math.PI * 46}`}
            strokeDashoffset={`${2 * Math.PI * 46 * (1 - pct / 100)}`}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
          <text x={55} y={51} textAnchor="middle" fontSize={22} fontWeight={800} fill={tier.color}>{pct}</text>
          <text x={55} y={67} textAnchor="middle" fontSize={10} fill="#475569" letterSpacing="1">PERCENTILE</text>
        </svg>
      </div>
    </div>
  );
}
