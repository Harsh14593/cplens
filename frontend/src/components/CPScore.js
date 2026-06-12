export const TIERS = [
  { min: 2600, label: "Grandmaster", color: "#ef4444" },
  { min: 2200, label: "Master",      color: "#ff8c00" },
  { min: 1800, label: "Expert",      color: "#a855f7" },
  { min: 1400, label: "Competitor",  color: "#3b82f6" },
  { min: 900,  label: "Apprentice",  color: "#22c55e" },
  { min: 0,    label: "Beginner",    color: "#64748b" },
];

const PLATFORMS = [
  { key: "cf",  label: "Codeforces", color: "#6366f1", weight: 0.4, max: 2800, weightLabel: "40%" },
  { key: "lc",  label: "LeetCode",   color: "#f59e0b", weight: 0.4, max: 2800, weightLabel: "40%" },
  { key: "cc",  label: "CodeChef",   color: "#22c55e", weight: 0.2, max: 2500, weightLabel: "20%" },
];

export function computeCPScore({ user, lc, cc }) {
  const entries = [];
  if (user?.rating)                entries.push({ norm: Math.min(user.rating, 2800) / 2800,               weight: 0.4 });
  if (lc?.contest_ranking?.rating) entries.push({ norm: Math.min(lc.contest_ranking.rating, 2800) / 2800, weight: 0.4 });
  if (cc?.rating)                  entries.push({ norm: Math.min(cc.rating, 2500) / 2500,                 weight: 0.2 });
  if (!entries.length) return null;
  const totalWeight = entries.reduce((a, e) => a + e.weight, 0);
  const weighted    = entries.reduce((a, e) => a + e.norm * e.weight, 0);
  return Math.round((weighted / totalWeight) * 3000);
}

export function buildBreakdown({ user, lc, cc }) {
  return [
    { ...PLATFORMS[0], rating: user?.rating ?? null },
    { ...PLATFORMS[1], rating: lc?.contest_ranking?.rating ? Math.round(lc.contest_ranking.rating) : null },
    { ...PLATFORMS[2], rating: cc?.rating ?? null },
  ];
}

export default function CPScore({ score, user, lc, cc }) {
  if (score === null || score === undefined) return null;

  const tierIdx  = TIERS.findIndex(t => score >= t.min);
  const tier     = TIERS[tierIdx] ?? TIERS[TIERS.length - 1];
  const nextTier = tierIdx > 0 ? TIERS[tierIdx - 1] : null;

  // progress within current tier band toward next tier
  const tierProgress = nextTier
    ? Math.round(((score - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;
  const pointsToNext = nextTier ? nextTier.min - score : 0;

  const breakdown = buildBreakdown({ user, lc, cc });
  const connected = breakdown.filter(p => p.rating !== null).map(p => p.label);

  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 16,
      background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)",
      border: "1px solid #2d3748", padding: "32px 36px",
    }}>
      <div style={{ position: "absolute", top: "50%", left: "40%", transform: "translateY(-50%)", width: 300, height: 300, borderRadius: "50%", background: tier.color, opacity: 0.05, filter: "blur(60px)", pointerEvents: "none" }} />

      {/* top row: score + tier progress ring */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "2.5px", textTransform: "uppercase", marginBottom: 10 }}>Unified CP Score</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <span style={{ fontSize: 76, fontWeight: 900, color: tier.color, lineHeight: 1, letterSpacing: -3 }}>{score}</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: tier.color, opacity: 0.85 }}>{tier.label}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>
            Based on {connected.length === 1 ? connected[0] : connected.join(" · ")}
            {connected.length < 3 && <span style={{ color: "#374151", marginLeft: 6 }}>· connect more platforms to compare</span>}
          </div>
        </div>

        {/* tier progress ring */}
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <svg width={100} height={100} viewBox="0 0 110 110">
            <circle cx={55} cy={55} r={46} fill="none" stroke="#1e2330" strokeWidth={10} />
            <circle cx={55} cy={55} r={46} fill="none" stroke={tier.color} strokeWidth={10}
              strokeDasharray={`${2 * Math.PI * 46}`}
              strokeDashoffset={`${2 * Math.PI * 46 * (1 - tierProgress / 100)}`}
              strokeLinecap="round" transform="rotate(-90 55 55)"
            />
            {nextTier ? (
              <>
                <text x={55} y={49} textAnchor="middle" fontSize={19} fontWeight={800} fill={tier.color}>{tierProgress}%</text>
                <text x={55} y={63} textAnchor="middle" fontSize={9} fill="#475569">TO {nextTier.label.toUpperCase()}</text>
              </>
            ) : (
              <>
                <text x={55} y={52} textAnchor="middle" fontSize={13} fontWeight={800} fill={tier.color}>MAX</text>
                <text x={55} y={66} textAnchor="middle" fontSize={9} fill="#475569">TIER</text>
              </>
            )}
          </svg>
          {nextTier && (
            <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
              {pointsToNext} pts to <span style={{ color: nextTier.color, fontWeight: 700 }}>{nextTier.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* divider */}
      <div style={{ height: 1, background: "#1e2330", margin: "24px 0 20px" }} />

      {/* breakdown */}
      <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 14 }}>
        How it's calculated
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {breakdown.filter(p => p.rating !== null).map(({ label, color, rating, max, weight, weightLabel }) => {
          const norm    = rating ? Math.min(rating, max) / max : 0;
          const contrib = Math.round(norm * weight * 3000);
          const barPct  = Math.round(norm * 100);
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 80, fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>{label}</span>
              <span style={{ width: 42, fontSize: 13, fontWeight: 700, color, flexShrink: 0, textAlign: "right" }}>{rating}</span>
              <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>/ {max}</span>
              <div style={{ flex: 1, height: 6, background: "#1e2330", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${barPct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.8s ease" }} />
              </div>
              <span style={{ fontSize: 11, color: "#475569", flexShrink: 0 }}>weight {weightLabel}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color, flexShrink: 0, width: 40, textAlign: "right" }}>+{contrib}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16, fontSize: 11, color: "#374151", lineHeight: 1.7 }}>
        Each platform's contribution = (rating / max) × weight. Weights redistribute across {connected.length} connected platform{connected.length !== 1 ? "s" : ""}.
      </div>
    </div>
  );
}
