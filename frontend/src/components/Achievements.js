import { useMemo, useState } from "react";

const TIER = {
  bronze:   { label: "Bronze",   color: "#cd7f32", bg: "#cd7f3218" },
  silver:   { label: "Silver",   color: "#94a3b8", bg: "#94a3b818" },
  gold:     { label: "Gold",     color: "#f59e0b", bg: "#f59e0b18" },
  platinum: { label: "Platinum", color: "#a855f7", bg: "#a855f718" },
};

const ACHIEVEMENTS = [
  // ── Streak ──────────────────────────────────────────────────────────────
  { id: "streak_7",   icon: "🔥", title: "On a Roll",      desc: "7-day solving streak",       tier: "bronze",   check: ({ streak }) => streak >= 7 },
  { id: "streak_30",  icon: "🔥", title: "Consistent",     desc: "30-day solving streak",      tier: "silver",   check: ({ streak }) => streak >= 30 },
  { id: "streak_100", icon: "🔥", title: "Unstoppable",    desc: "100-day solving streak",     tier: "gold",     check: ({ streak }) => streak >= 100 },
  { id: "streak_365", icon: "🔥", title: "Year of Code",   desc: "365-day solving streak",     tier: "platinum", check: ({ streak }) => streak >= 365 },

  // ── Codeforces Rating ────────────────────────────────────────────────────
  { id: "cf_1200", icon: "⚡", title: "Pupil",             desc: "Reached CF rating 1200",     tier: "bronze",   check: ({ cfRating }) => cfRating >= 1200 },
  { id: "cf_1400", icon: "⚡", title: "Specialist",        desc: "Reached CF rating 1400",     tier: "silver",   check: ({ cfRating }) => cfRating >= 1400 },
  { id: "cf_1600", icon: "⚡", title: "Expert",            desc: "Reached CF rating 1600",     tier: "silver",   check: ({ cfRating }) => cfRating >= 1600 },
  { id: "cf_1900", icon: "⚡", title: "Candidate Master",  desc: "Reached CF rating 1900",     tier: "gold",     check: ({ cfRating }) => cfRating >= 1900 },
  { id: "cf_2100", icon: "⚡", title: "Master",            desc: "Reached CF rating 2100",     tier: "platinum", check: ({ cfRating }) => cfRating >= 2100 },

  // ── Codeforces Contests ──────────────────────────────────────────────────
  { id: "cf_10c",  icon: "🏁", title: "First Campaigns",  desc: "Participated in 10 CF contests",  tier: "bronze", check: ({ cfContests }) => cfContests >= 10 },
  { id: "cf_25c",  icon: "🏁", title: "Battle Hardened",  desc: "Participated in 25 CF contests",  tier: "silver", check: ({ cfContests }) => cfContests >= 25 },
  { id: "cf_50c",  icon: "🏁", title: "Arena Veteran",    desc: "Participated in 50 CF contests",  tier: "gold",   check: ({ cfContests }) => cfContests >= 50 },

  // ── LeetCode Problems ────────────────────────────────────────────────────
  { id: "lc_50",   icon: "🧩", title: "Problem Solver",   desc: "Solved 50 LC problems",      tier: "bronze",   check: ({ lcSolved }) => lcSolved >= 50 },
  { id: "lc_100",  icon: "🧩", title: "Century",          desc: "Solved 100 LC problems",     tier: "silver",   check: ({ lcSolved }) => lcSolved >= 100 },
  { id: "lc_250",  icon: "🧩", title: "Grinder",          desc: "Solved 250 LC problems",     tier: "gold",     check: ({ lcSolved }) => lcSolved >= 250 },
  { id: "lc_500",  icon: "🧩", title: "LC Veteran",       desc: "Solved 500 LC problems",     tier: "platinum", check: ({ lcSolved }) => lcSolved >= 500 },

  // ── LeetCode Contest ─────────────────────────────────────────────────────
  { id: "lc_top10", icon: "🏆", title: "Top 10%",         desc: "LC contest top 10%",         tier: "silver",   check: ({ lcTop }) => lcTop !== null && lcTop <= 10 },
  { id: "lc_top5",  icon: "🏆", title: "Top 5%",          desc: "LC contest top 5%",          tier: "gold",     check: ({ lcTop }) => lcTop !== null && lcTop <= 5 },
  { id: "lc_top1",  icon: "🏆", title: "Elite",           desc: "LC contest top 1%",          tier: "platinum", check: ({ lcTop }) => lcTop !== null && lcTop <= 1 },

  // ── CodeChef ─────────────────────────────────────────────────────────────
  { id: "cc_3star", icon: "⭐", title: "3 Star",           desc: "Earned 3 stars on CodeChef", tier: "bronze",   check: ({ ccStars }) => (ccStars?.match(/★/g) || []).length >= 3 },
  { id: "cc_4star", icon: "⭐", title: "4 Star",           desc: "Earned 4 stars on CodeChef", tier: "silver",   check: ({ ccStars }) => (ccStars?.match(/★/g) || []).length >= 4 },
  { id: "cc_5star", icon: "⭐", title: "5 Star",           desc: "Earned 5 stars on CodeChef", tier: "gold",     check: ({ ccStars }) => (ccStars?.match(/★/g) || []).length >= 5 },

  // ── Multi-platform / Special ─────────────────────────────────────────────
  { id: "multi",    icon: "🌐", title: "All-Rounder",     desc: "Active on CF, LC, and CC",   tier: "gold",     check: ({ cfRating, lcSolved, ccStars }) => !!cfRating && !!lcSolved && !!ccStars },
  { id: "cp_1500",  icon: "💎", title: "CP Rising",       desc: "CP Score above 1500",        tier: "silver",   check: ({ cpScore }) => cpScore >= 1500 },
  { id: "cp_2000",  icon: "💎", title: "CP Expert",       desc: "CP Score above 2000",        tier: "gold",     check: ({ cpScore }) => cpScore >= 2000 },
  { id: "cp_2500",  icon: "💎", title: "CP Master",       desc: "CP Score above 2500",        tier: "platinum", check: ({ cpScore }) => cpScore >= 2500 },
];

function computeStreak(cfActivity, lcActivity) {
  const merged = {};
  [cfActivity, lcActivity].forEach(act => {
    if (!act) return;
    Object.entries(act).forEach(([k, v]) => { merged[k] = (merged[k] || 0) + v; });
  });
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if ((merged[key] ?? 0) > 0) streak++;
    else if (i > 0) break;
  }
  return streak;
}

export function computeAchievements({ data, cpScore }) {
  const cfRating  = data.user?.rating ?? 0;
  const cfContests = data.contests?.length ?? 0;
  const lcSolved  = data.lc?.profile?.ac_stats?.find(s => s.difficulty === "All")?.count ?? 0;
  const lcTop     = data.lc?.contest_ranking?.topPercentage ?? null;
  const ccStars   = data.cc?.stars ?? null;
  const streak    = computeStreak(data.cf?.activity, data.lc?.activity);

  const ctx = { cfRating, cfContests, lcSolved, lcTop, ccStars, streak, cpScore: cpScore ?? 0 };
  return ACHIEVEMENTS.map(a => ({ ...a, earned: a.check(ctx) }));
}

export default function Achievements({ data, cpScore }) {
  const [showLocked, setShowLocked] = useState(false);
  const achievements = useMemo(() => computeAchievements({ data, cpScore }), [data, cpScore]);
  const earned = achievements.filter(a => a.earned);
  const locked = achievements.filter(a => !a.earned);

  return (
    <div>
      {/* summary row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{earned.length}</span>
        <span style={{ fontSize: 12, color: "#475569" }}>/ {achievements.length} unlocked</span>
        {["platinum","gold","silver","bronze"].map(t => {
          const count = earned.filter(a => a.tier === t).length;
          if (!count) return null;
          return (
            <span key={t} style={{ fontSize: 11, fontWeight: 700, color: TIER[t].color, background: TIER[t].bg, padding: "2px 8px", borderRadius: 99 }}>
              {count} {TIER[t].label}
            </span>
          );
        })}
      </div>

      {/* earned */}
      {earned.length > 0 ? (
        <>
          <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Earned</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {earned.map(a => <Badge key={a.id} a={a} />)}
          </div>
        </>
      ) : (
        <div style={{ color: "#475569", fontSize: 13, marginBottom: 20 }}>No achievements earned yet — keep grinding!</div>
      )}

      {/* locked — collapsible */}
      <button onClick={() => setShowLocked(s => !s)} style={{
        background: "none", border: "none", cursor: "pointer", padding: 0,
        fontSize: 11, color: "#475569", letterSpacing: "1px", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 6, marginBottom: 12,
      }}>
        <span>{showLocked ? "▾" : "▸"}</span>
        Locked ({locked.length})
      </button>

      {showLocked && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {locked.map(a => <Badge key={a.id} a={a} locked />)}
        </div>
      )}
    </div>
  );
}

function Badge({ a, locked }) {
  const t = TIER[a.tier];
  return (
    <div title={a.desc} style={{
      display: "flex", alignItems: "center", gap: 8,
      padding: "8px 14px", borderRadius: 10,
      background: locked ? "#0f1117" : t.bg,
      border: `1px solid ${locked ? "#1e2330" : t.color + "40"}`,
      opacity: locked ? 0.45 : 1,
      cursor: "default",
      transition: "opacity 0.2s",
    }}>
      <span style={{ fontSize: 18, filter: locked ? "grayscale(1)" : "none" }}>{a.icon}</span>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: locked ? "#475569" : t.color, lineHeight: 1.2 }}>{a.title}</div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{a.desc}</div>
      </div>
    </div>
  );
}
