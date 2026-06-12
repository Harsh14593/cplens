import { useState, useEffect } from "react";
import { getStudyPlan } from "../api";

const WEEK_COLORS = ["#6366f1", "#f59e0b", "#22c55e", "#ef4444"];

function planKey(cf, lc, cc) {
  return `cplens_plan_${cf || ""}_${lc || ""}_${cc || ""}`;
}

export default function StudyPlan({ data, user, cfHandle, lcUsername, ccUsername }) {
  const [plan,    setPlan]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // load persisted plan on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(planKey(cfHandle, lcUsername, ccUsername));
      if (saved) setPlan(JSON.parse(saved));
    } catch {}
  }, [cfHandle, lcUsername, ccUsername]);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const cfWeak = data.cf?.weak_tags ?? [];
      const lcWeak = data.lc?.weak_tags ?? [];

      // build streak from activity
      const activity = data.cf?.activity ?? {};
      const today = new Date();
      let streak = 0;
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        if ((activity[key] ?? 0) > 0) streak++;
        else if (i > 0) break;
      }

      const payload = {
        cf_rating:          data.user?.rating ?? null,
        cf_rank:            data.user?.rank ?? null,
        cf_max_rating:      data.user?.maxRating ?? null,
        lc_rating:          data.lc?.contest_ranking?.rating ?? null,
        lc_top_percentage:  data.lc?.contest_ranking?.topPercentage ?? null,
        lc_problems_solved: data.lc?.profile?.ac_stats?.find(s => s.difficulty === "All")?.count ?? null,
        cc_rating:          data.cc?.rating ?? null,
        cc_stars:           data.cc?.stars ?? null,
        cp_score:           user?.cpScore ?? null,
        weak_tags_cf:       cfWeak.map(t => ({ tag: t.tag, accuracy: t.accuracy, attempted: t.attempted })),
        weak_tags_lc:       lcWeak,
        difficulty_breakdown: data.cf?.difficulty_breakdown ?? null,
        contests_count:     (data.contests?.length ?? 0) + (data.lc?.contest_ranking?.attendedContestsCount ?? 0),
        streak,
      };

      const res = await getStudyPlan(payload);
      setPlan(res.data);
      try { localStorage.setItem(planKey(cfHandle, lcUsername, ccUsername), JSON.stringify(res.data)); } catch {}
    } catch (e) {
      setError("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!plan && !loading) return (
    <div style={{ textAlign: "center", padding: "32px 20px" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🤖</div>
      <div style={{ fontSize: 15, color: "#94a3b8", marginBottom: 8 }}>
        Get a personalized 4-week study plan powered by Gemini AI
      </div>
      <div style={{ fontSize: 12, color: "#475569", marginBottom: 24 }}>
        Analyzes your weak topics, rating gaps, and solving patterns
      </div>
      {error && <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 16 }}>{error}</div>}
      <button onClick={generate} style={{
        padding: "12px 28px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
        fontWeight: 600, cursor: "pointer",
      }}>
        Generate My Study Plan →
      </button>
    </div>
  );

  if (loading) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ display: "inline-block", width: 36, height: 36, border: "3px solid #2d3748", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 16 }}>Gemini is analyzing your profile...</div>
    </div>
  );

  return (
    <div>
      {/* summary */}
      <div style={{ padding: "16px 20px", background: "linear-gradient(135deg, #1a1f35, #0f1117)", borderRadius: 10, border: "1px solid #2d3748", marginBottom: 24 }}>
        <div style={{ fontSize: 11, color: "#6366f1", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>AI Assessment</div>
        <p style={{ color: "#e2e8f0", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{plan.summary}</p>
      </div>

      {/* biggest gap + target */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        <div style={{ padding: "14px 16px", background: "#0f1117", borderRadius: 10, border: "1px solid #2d3748", borderLeft: "3px solid #ef4444" }}>
          <div style={{ fontSize: 11, color: "#ef4444", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>Biggest Gap</div>
          <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{plan.biggest_gap}</div>
        </div>
        <div style={{ padding: "14px 16px", background: "#0f1117", borderRadius: 10, border: "1px solid #2d3748", borderLeft: "3px solid #22c55e" }}>
          <div style={{ fontSize: 11, color: "#22c55e", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>3-Month Target</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e" }}>{plan.target_rating}</div>
        </div>
      </div>

      {/* 4 week plan */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
        {plan.weeks?.map((week, i) => (
          <div key={i} style={{ padding: "16px 20px", background: "#0f1117", borderRadius: 10, border: "1px solid #2d3748", borderLeft: `3px solid ${WEEK_COLORS[i]}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: WEEK_COLORS[i], letterSpacing: "1px", textTransform: "uppercase" }}>Week {week.week}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0" }}>{week.focus}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", background: "#1e2330", padding: "3px 10px", borderRadius: 99 }}>
                {week.daily_problems} problems/day · {week.cf_difficulty}
              </div>

            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>{week.goal}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {week.topics?.map((t, j) => (
                <span key={j} style={{ fontSize: 11, padding: "3px 10px", background: "#1e2330", border: `1px solid ${WEEK_COLORS[i]}33`, borderRadius: 99, color: WEEK_COLORS[i] }}>{t}</span>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", borderTop: "1px solid #1e2330", paddingTop: 10 }}>
              💡 {week.tip}
            </div>
          </div>
        ))}
      </div>

      {/* quick wins */}
      {plan.quick_wins?.length > 0 && (
        <div style={{ padding: "16px 20px", background: "#0f1117", borderRadius: 10, border: "1px solid #2d3748" }}>
          <div style={{ fontSize: 11, color: "#f59e0b", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Quick Wins — Do These Today</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {plan.quick_wins.map((w, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "#f59e0b", flexShrink: 0, marginTop: 1 }}>→</span>
                <span style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.5 }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, textAlign: "right" }}>
        <button onClick={() => {
          setPlan(null); setError(null);
          try { localStorage.removeItem(planKey(cfHandle, lcUsername, ccUsername)); } catch {}
        }} style={{ fontSize: 12, color: "#475569", background: "none", border: "none", cursor: "pointer" }}>
          Regenerate plan
        </button>
      </div>
    </div>
  );
}
