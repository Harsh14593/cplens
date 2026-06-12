import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { analyzeCodeforces, analyzeLeetcode, analyzeCodechef, getCFUser, getCFContests } from "../api";
import { computeCPScore } from "../components/CPScore";
import ActivityHeatmap from "../components/ActivityHeatmap";
import styles from "./Compare.module.css";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CF_BUCKETS = {
  "DP":         ["dp","bitmasks"],
  "Graphs":     ["graphs","dfs and similar","bfs","shortest paths","minimum spanning tree","flows"],
  "Trees":      ["trees","lca"],
  "Math":       ["math","number theory","combinatorics","geometry","probabilities"],
  "Structures": ["data structures","sortings","hashing"],
  "Strings":    ["strings","string suffix structures"],
  "Greedy":     ["greedy","constructive algorithms","implementation"],
  "Search":     ["binary search","ternary search","divide and conquer","two pointers"],
};

function cfBucketScore(tagStats, tags) {
  const hits = tags.filter(t => tagStats?.[t]?.attempted >= 3);
  if (!hits.length) return 0;
  return Math.round(hits.reduce((a,t) => a + tagStats[t].solved / tagStats[t].attempted, 0) / hits.length * 100);
}

function getRatingColor(r) {
  if (!r) return "#94a3b8";
  if (r >= 2400) return "#ef4444"; if (r >= 2100) return "#ff8c00";
  if (r >= 1900) return "#a855f7"; if (r >= 1600) return "#3b82f6";
  if (r >= 1400) return "#03a89e"; if (r >= 1200) return "#22c55e";
  return "#808080";
}

async function fetchUser(cf, lc, cc) {
  const results = await Promise.allSettled([
    cf ? analyzeCodeforces(cf) : Promise.resolve(null),
    lc ? analyzeLeetcode(lc)   : Promise.resolve(null),
    cf ? getCFUser(cf)         : Promise.resolve(null),
    cf ? getCFContests(cf)     : Promise.resolve(null),
    cc ? analyzeCodechef(cc)   : Promise.resolve(null),
  ]);
  return {
    cf:       results[0].value?.data ?? null,
    lc:       results[1].value?.data ?? null,
    user:     results[2].value?.data ?? null,
    contests: results[3].value?.data ?? null,
    cc:       results[4].value?.data ?? null,
  };
}

export default function Compare() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const [handles, setHandles] = useState({
    a_cf: params.get("a_cf") || "", a_lc: params.get("a_lc") || "", a_cc: params.get("a_cc") || "",
    b_cf: params.get("b_cf") || "", b_lc: params.get("b_lc") || "", b_cc: params.get("b_cc") || "",
  });
  const [dataA, setDataA]   = useState(null);
  const [dataB, setDataB]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied]   = useState(false);

  const hasParams = params.get("a_cf") || params.get("a_lc");

  useEffect(() => {
    if (!hasParams) return;
    setLoading(true);
    Promise.all([
      fetchUser(params.get("a_cf"), params.get("a_lc"), params.get("a_cc")),
      fetchUser(params.get("b_cf"), params.get("b_lc"), params.get("b_cc")),
    ]).then(([a, b]) => { setDataA(a); setDataB(b); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString()]); // params.toString() is the stable dep we want

  function submit(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    Object.entries(handles).forEach(([k, v]) => { if (v) p.set(k, v); });
    setParams(p);
  }

  if (!hasParams || (!loading && !dataA)) return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => navigate("/")}>CP<span>Lens</span></h1>
      </header>
      <div className={styles.formWrap}>
        <h2>Head-to-Head Comparison</h2>
        <p>Enter handles for two competitive programmers</p>
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.formCols}>
            <div className={styles.formCol}>
              <div className={styles.playerLabel} style={{ color: "#6366f1" }}>Player 1</div>
              <input placeholder="Codeforces handle" value={handles.a_cf} onChange={e => setHandles({...handles, a_cf: e.target.value})} />
              <input placeholder="LeetCode username" value={handles.a_lc} onChange={e => setHandles({...handles, a_lc: e.target.value})} />
              <input placeholder="CodeChef username" value={handles.a_cc} onChange={e => setHandles({...handles, a_cc: e.target.value})} />
            </div>
            <div className={styles.vs}>VS</div>
            <div className={styles.formCol}>
              <div className={styles.playerLabel} style={{ color: "#f59e0b" }}>Player 2</div>
              <input placeholder="Codeforces handle" value={handles.b_cf} onChange={e => setHandles({...handles, b_cf: e.target.value})} />
              <input placeholder="LeetCode username"  value={handles.b_lc} onChange={e => setHandles({...handles, b_lc: e.target.value})} />
              <input placeholder="CodeChef username"  value={handles.b_cc} onChange={e => setHandles({...handles, b_cc: e.target.value})} />
            </div>
          </div>
          <button type="submit">Compare →</button>
        </form>
      </div>
    </div>
  );

  if (loading) return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => navigate("/")}>CP<span>Lens</span></h1>
      </header>
      <div className={styles.center}><div className={styles.spinner} /><p>Fetching both profiles...</p></div>
    </div>
  );

  const scoreA = computeCPScore({ user: dataA.user, lc: dataA.lc, cc: dataA.cc });
  const scoreB = computeCPScore({ user: dataB.user, lc: dataB.lc, cc: dataB.cc });
  const nameA  = params.get("a_cf") || params.get("a_lc") || "Player 1";
  const nameB  = params.get("b_cf") || params.get("b_lc") || "Player 2";

  const metrics = [
    { label: "CP Score",      a: scoreA,                              b: scoreB,                              max: 3000, colorA: "#6366f1", colorB: "#f59e0b", format: v => v },
    { label: "CF Rating",     a: dataA.user?.rating,                  b: dataB.user?.rating,                  max: 2800, colorA: getRatingColor(dataA.user?.rating), colorB: getRatingColor(dataB.user?.rating) },
    { label: "LC Rating",     a: dataA.lc?.contest_ranking?.rating ? Math.round(dataA.lc.contest_ranking.rating) : null, b: dataB.lc?.contest_ranking?.rating ? Math.round(dataB.lc.contest_ranking.rating) : null, max: 2800, colorA: "#f59e0b", colorB: "#f59e0b" },
    { label: "CC Rating",     a: dataA.cc?.rating,                    b: dataB.cc?.rating,                    max: 2500, colorA: "#22c55e", colorB: "#22c55e" },
    { label: "LC Solved",     a: dataA.lc?.profile?.ac_stats?.find(s=>s.difficulty==="All")?.count, b: dataB.lc?.profile?.ac_stats?.find(s=>s.difficulty==="All")?.count, max: 3000, colorA: "#f59e0b", colorB: "#f59e0b" },
    { label: "CF Contests",   a: dataA.contests?.length,              b: dataB.contests?.length,              max: 200,  colorA: "#6366f1", colorB: "#6366f1" },
  ].filter(m => m.a || m.b);

  const winsA = metrics.filter(m => (m.a || 0) > (m.b || 0)).length;
  const winsB = metrics.filter(m => (m.b || 0) > (m.a || 0)).length;

  // dual radar
  const radarData = Object.entries(CF_BUCKETS).map(([label, tags]) => ({
    subject: label,
    [nameA]: cfBucketScore(dataA.cf?.tag_analysis, tags),
    [nameB]: cfBucketScore(dataB.cf?.tag_analysis, tags),
    fullMark: 100,
  }));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => navigate("/")}>CP<span>Lens</span></h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className={styles.newBtn} onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true); setTimeout(() => setCopied(false), 2000);
          }} style={{ color: copied ? "#22c55e" : undefined, borderColor: copied ? "#22c55e" : undefined }}>
            {copied ? "✓ Copied!" : "Share Battle →"}
          </button>
          <button className={styles.newBtn} onClick={() => { setParams({}); setDataA(null); setDataB(null); }}>New Comparison</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* VS hero */}
        <div className={styles.hero}>
          <div className={styles.heroPlayer}>
            <div className={styles.heroName} style={{ color: "#6366f1" }}>{nameA}</div>
            {scoreA !== null && <div className={styles.heroScore} style={{ color: "#6366f1" }}>{scoreA}</div>}
            <div className={styles.heroSub}>{dataA.user?.rank || ""}</div>
            {metrics.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: winsA >= winsB ? "#6366f1" : "#475569" }}>
                {winsA}/{metrics.length} categories
              </div>
            )}
          </div>
          <div className={styles.vsText}>
            {scoreA !== null && scoreB !== null && (
              <div className={styles.winner} style={{ color: scoreA > scoreB ? "#6366f1" : "#f59e0b" }}>
                {scoreA === scoreB ? "DRAW" : `${scoreA > scoreB ? nameA : nameB} wins`}
              </div>
            )}
            <div>VS</div>
          </div>
          <div className={styles.heroPlayer}>
            <div className={styles.heroName} style={{ color: "#f59e0b" }}>{nameB}</div>
            {scoreB !== null && <div className={styles.heroScore} style={{ color: "#f59e0b" }}>{scoreB}</div>}
            <div className={styles.heroSub}>{dataB.user?.rank || ""}</div>
            {metrics.length > 0 && (
              <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: winsB >= winsA ? "#f59e0b" : "#475569" }}>
                {winsB}/{metrics.length} categories
              </div>
            )}
          </div>
        </div>

        {/* metric bars */}
        <div className={styles.card}>
          <h2>Head-to-Head Stats</h2>
          <div className={styles.metrics}>
            {metrics.map(({ label, a, b, max, colorA, colorB }) => {
              const pctA  = Math.round(((a || 0) / max) * 100);
              const pctB  = Math.round(((b || 0) / max) * 100);
              const aWins = (a || 0) > (b || 0);
              const bWins = (b || 0) > (a || 0);
              return (
                <div key={label} className={styles.metricRow}>
                  <div className={styles.metricValA} style={{ color: aWins ? colorA : "#64748b", fontWeight: aWins ? 700 : 400 }}>
                    {a ?? "—"}{aWins && " ↑"}
                  </div>
                  <div className={styles.metricCenter}>
                    <div className={styles.metricLabel}>{label}</div>
                    <div className={styles.barWrap}>
                      <div className={styles.barLeft}>
                        <div style={{ width: `${pctA}%`, height: "100%", background: colorA, borderRadius: 99, transition: "width 0.8s ease" }} />
                      </div>
                      <div className={styles.barRight}>
                        <div style={{ width: `${pctB}%`, height: "100%", background: colorB, borderRadius: 99, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                  </div>
                  <div className={styles.metricValB} style={{ color: bWins ? colorB : "#64748b", fontWeight: bWins ? 700 : 400 }}>
                    {bWins && "↑ "}{b ?? "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.grid}>
          {/* dual radar */}
          {(dataA.cf?.tag_analysis || dataB.cf?.tag_analysis) && (
            <div className={styles.card}>
              <h2>Skill Map Comparison</h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                  <PolarGrid stroke="#2d3748" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false} />
                  <Radar name={nameA} dataKey={nameA} stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }} />
                  <Radar name={nameB} dataKey={nameB} stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} strokeWidth={2} dot={{ r: 3, fill: "#f59e0b", strokeWidth: 0 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                  <Tooltip contentStyle={{ background: "#1e2330", border: "1px solid #2d3748", borderRadius: 8, fontSize: 13 }} formatter={(v) => `${v}%`} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* platform breakdown */}
          <div className={styles.card}>
            <h2>Platform Breakdown</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
              {[
                { platform: "Codeforces", color: "#6366f1", a: dataA.user?.rating, b: dataB.user?.rating, aExtra: dataA.user?.rank, bExtra: dataB.user?.rank },
                { platform: "LeetCode",   color: "#f59e0b", a: dataA.lc?.contest_ranking?.rating ? Math.round(dataA.lc.contest_ranking.rating) : null, b: dataB.lc?.contest_ranking?.rating ? Math.round(dataB.lc.contest_ranking.rating) : null, aExtra: dataA.lc?.contest_ranking ? `Top ${dataA.lc.contest_ranking.topPercentage?.toFixed(1)}%` : null, bExtra: dataB.lc?.contest_ranking ? `Top ${dataB.lc.contest_ranking.topPercentage?.toFixed(1)}%` : null },
                { platform: "CodeChef",   color: "#22c55e", a: dataA.cc?.rating, b: dataB.cc?.rating, aExtra: dataA.cc?.stars, bExtra: dataB.cc?.stars },
              ].filter(p => p.a || p.b).map(({ platform, color, a, b, aExtra, bExtra }) => (
                <div key={platform} style={{ padding: "14px 16px", background: "#0f1117", borderRadius: 10, borderLeft: `3px solid ${color}` }}>
                  <div style={{ fontSize: 11, color, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 10 }}>{platform}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: (a||0) >= (b||0) ? color : "#64748b" }}>{a ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{aExtra}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "#374151" }}>vs</div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: (b||0) > (a||0) ? color : "#64748b" }}>{b ?? "—"}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{bExtra}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* activity heatmaps */}
        {(dataA.cf?.activity || dataA.lc?.activity) && (
          <div className={styles.card} style={{ marginTop: 24 }}>
            <h2>Activity — {nameA}</h2>
            <ActivityHeatmap cfActivity={dataA.cf?.activity} lcActivity={dataA.lc?.activity} ccRatingHistory={dataA.cc?.rating_history} />
          </div>
        )}
        {(dataB.cf?.activity || dataB.lc?.activity) && (
          <div className={styles.card} style={{ marginTop: 16 }}>
            <h2>Activity — {nameB}</h2>
            <ActivityHeatmap cfActivity={dataB.cf?.activity} lcActivity={dataB.lc?.activity} ccRatingHistory={dataB.cc?.rating_history} />
          </div>
        )}
      </main>
    </div>
  );
}
