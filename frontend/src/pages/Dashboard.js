import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { analyzeCodeforces, analyzeLeetcode, analyzeCodechef, getCFUser, getCFContests, getCFRecommendations, getLCRecommendations, getCCRecommendations } from "../api";
import RatingChart from "../components/RatingChart";
import WeakTags from "../components/WeakTags";
import Insights from "../components/Insights";
import Recommendations from "../components/Recommendations";
import DifficultyChart from "../components/DifficultyChart";
import PlatformCard from "../components/PlatformCard";
import LCContestChart from "../components/LCContestChart";
import CCRatingChart from "../components/CCRatingChart";
import LCProblemsChart from "../components/LCProblemsChart";
import CPScore, { computeCPScore } from "../components/CPScore";
import StudyPlan from "../components/StudyPlan";
import SkillRadar from "../components/SkillRadar";
import ActivityHeatmap from "../components/ActivityHeatmap";
import RecentSolved from "../components/RecentSolved";
import styles from "./Dashboard.module.css";
import { useAuth } from "../contexts/AuthContext";
import ProgressTracker from "../components/ProgressTracker";
import { saveSnapshot, getSnapshots, calcDelta, saveLeaderboardEntry } from "../utils/progress";
import { TIERS } from "../components/CPScore";

export default function Dashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cfHandle = params.get("codeforces");
  const lcUsername = params.get("leetcode");
  const ccUsername = params.get("codechef");

  const { user, logout, saveHandles } = useAuth();
  const [editOpen, setEditOpen]   = useState(false);
  const [editForm, setEditForm]   = useState({ cf: cfHandle || "", lc: lcUsername || "", cc: ccUsername || "" });

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const CF_RANKS = [
    { label: "Newbie",                  min: 0,    max: 1199, color: "#808080" },
    { label: "Pupil",                   min: 1200, max: 1399, color: "#008000" },
    { label: "Specialist",              min: 1400, max: 1599, color: "#03a89e" },
    { label: "Expert",                  min: 1600, max: 1899, color: "#0000ff" },
    { label: "Candidate Master",        min: 1900, max: 2099, color: "#aa00aa" },
    { label: "Master",                  min: 2100, max: 2299, color: "#ff8c00" },
    { label: "International Master",    min: 2300, max: 2399, color: "#ff8c00" },
    { label: "Grandmaster",             min: 2400, max: 2599, color: "#ff0000" },
    { label: "International Grandmaster", min: 2600, max: 2999, color: "#ff0000" },
    { label: "Legendary Grandmaster",  min: 3000, max: Infinity, color: "#ff0000" },
  ];

  function cfRankTooltip(rating) {
    return (
      <div>
        <div style={{ fontSize: 11, color: "#475569", letterSpacing: "1px", marginBottom: 10, textTransform: "uppercase" }}>CF Rating Thresholds</div>
        {CF_RANKS.map(r => {
          const active = rating >= r.min && rating <= r.max;
          return (
            <div key={r.label} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "4px 8px", borderRadius: 6, marginBottom: 2,
              background: active ? r.color + "20" : "transparent",
              border: active ? `1px solid ${r.color}40` : "1px solid transparent",
            }}>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? r.color : "#64748b" }}>{r.label}</span>
              <span style={{ fontSize: 11, color: active ? r.color : "#374151" }}>
                {r.max === Infinity ? `${r.min}+` : `${r.min}–${r.max}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  async function handleEditSave(e) {
    e.preventDefault();
    await saveHandles(editForm.cf, editForm.lc, editForm.cc);
    setEditOpen(false);
    const p = new URLSearchParams();
    if (editForm.cf) p.set("codeforces", editForm.cf);
    if (editForm.lc) p.set("leetcode",   editForm.lc);
    if (editForm.cc) p.set("codechef",   editForm.cc);
    navigate(`/dashboard?${p.toString()}`);
  }
  const [data, setData] = useState({ cf: null, lc: null, cc: null, user: null, contests: null, cfRecs: null, lcRecs: null, ccRecs: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied]           = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [snapshots, setSnapshots]     = useState([]);

  function shareProfile() {
    const p = new URLSearchParams();
    if (cfHandle)   p.set("codeforces", cfHandle);
    if (lcUsername) p.set("leetcode",   lcUsername);
    if (ccUsername) p.set("codechef",   ccUsername);
    const url = `${window.location.origin}/u?${p.toString()}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyEmbed() {
    const apiBase = process.env.REACT_APP_API_URL || "http://localhost:8000";
    const p = new URLSearchParams();
    if (lcUsername) p.set("lc", lcUsername);
    if (ccUsername) p.set("cc", ccUsername);
    const qs = p.toString() ? `?${p.toString()}` : "";
    const cardUrl = `${apiBase}/api/card/${cfHandle}${qs}`;
    const profileUrl = `${window.location.origin}/u?codeforces=${cfHandle}${lcUsername ? `&leetcode=${lcUsername}` : ""}${ccUsername ? `&codechef=${ccUsername}` : ""}`;
    const markdown = `[![CPLens](${cardUrl})](${profileUrl})`;
    navigator.clipboard.writeText(markdown);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  }

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = await Promise.allSettled([
          cfHandle ? analyzeCodeforces(cfHandle) : Promise.resolve(null),
          lcUsername ? analyzeLeetcode(lcUsername) : Promise.resolve(null),
          cfHandle ? getCFUser(cfHandle) : Promise.resolve(null),
          cfHandle ? getCFContests(cfHandle) : Promise.resolve(null),
          cfHandle ? getCFRecommendations(cfHandle) : Promise.resolve(null),
          ccUsername ? analyzeCodechef(ccUsername) : Promise.resolve(null),
          lcUsername ? getLCRecommendations(lcUsername) : Promise.resolve(null),
          ccUsername ? getCCRecommendations(ccUsername) : Promise.resolve(null),
        ]);
        const cf   = results[0].value?.data ?? null;
        const lc   = results[1].value?.data ?? null;
        const cfU  = results[2].value?.data ?? null;
        const cc   = results[5].value?.data ?? null;
        setData({
          cf, lc,
          user:     cfU,
          contests: results[3].value?.data ?? null,
          cfRecs:   results[4].value?.data ?? null,
          cc,
          lcRecs:   results[6].value?.data ?? null,
          ccRecs:   results[7].value?.data ?? null,
        });

      } catch (e) {
        setError("Failed to fetch data. Check your handles and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfHandle, lcUsername, ccUsername]);

  // Separate effect: save to Firestore once BOTH user auth AND data are ready.
  // This fires even if auth resolves after the initial fetch.
  useEffect(() => {
    if (!user || loading || (!data.user && !data.lc && !data.cc)) return;
    async function persist() {
      try {
        const cpScore = computeCPScore({ user: data.user, lc: data.lc, cc: data.cc });
        const tier    = TIERS.find(t => cpScore >= t.min) ?? TIERS[TIERS.length - 1];
        await Promise.all([
          saveSnapshot(user.uid, {
            cfRating: data.user?.rating ?? null,
            lcRating: data.lc?.contest_ranking?.rating ?? null,
            ccRating: data.cc?.rating ?? null,
            cpScore,
          }),
          saveLeaderboardEntry(user.uid, {
            displayName: user.displayName,
            photoURL:    user.photoURL,
            cfHandle:    cfHandle    ?? null,
            lcUsername:  lcUsername  ?? null,
            ccUsername:  ccUsername  ?? null,
            cfRating:    data.user?.rating ?? null,
            lcRating:    data.lc?.contest_ranking?.rating ?? null,
            ccRating:    data.cc?.rating ?? null,
            cpScore,
            tier:        tier.label,
            tierColor:   tier.color,
          }),
        ]);
        const snaps = await getSnapshots(user.uid);
        setSnapshots(snaps);
      } catch (e) {
        console.error("Firestore save failed:", e);
      }
    }
    persist();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p>Analyzing your profile across all platforms...</p>
    </div>
  );
  if (error) return <div className={styles.center}><p>{error}</p></div>;

  const allInsights = [
    ...(data.cf?.insights ?? []),
    ...(data.lc?.insights ?? []),
    ...(data.cc?.insights ?? []),
  ];

  const tabs = [
    { key: "overview",   label: "Overview" },
    ...(user ? [{ key: "progress", label: "Progress" }] : []),
    ...(cfHandle  ? [{ key: "codeforces", label: "Codeforces" }] : []),
    ...(lcUsername ? [{ key: "leetcode",  label: "LeetCode" }]  : []),
    ...(ccUsername ? [{ key: "codechef",  label: "CodeChef" }]  : []),
  ];

  // deltas for platform card badges (all-time)
  const cfDelta = calcDelta(snapshots, "cfRating");
  const lcDelta = calcDelta(snapshots, "lcRating");
  const ccDelta = calcDelta(snapshots, "ccRating");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 onClick={() => navigate("/")} className={styles.logo}>CP<span>Lens</span></h1>

        <nav className={styles.navActions}>
          <button onClick={() => navigate("/compare")}     className={styles.navBtn} style={{ color: "#a855f7" }}>Compare</button>
          <button onClick={() => navigate("/contests")}    className={styles.navBtn} style={{ color: "#22c55e" }}>Contests</button>
          <button onClick={() => navigate("/leaderboard")} className={styles.navBtn} style={{ color: "#f59e0b" }}>Leaderboard</button>
        </nav>

        {user && (
          <div className={styles.avatarMenu}>
            <img src={user.photoURL} alt="" className={styles.avatarImg} referrerPolicy="no-referrer" />
            <div className={styles.avatarDropdown}>
              <div className={styles.avatarDropdownName}>{user.displayName}</div>
              <div className={styles.avatarDropdownEmail}>{user.email}</div>
              <div className={styles.avatarDropdownDivider} />
              <button className={styles.avatarDropdownItem} onClick={() => { setEditForm({ cf: cfHandle||"", lc: lcUsername||"", cc: ccUsername||"" }); setEditOpen(true); }}>
                Edit handles
              </button>
              <button className={styles.avatarDropdownItem} onClick={shareProfile} style={{ color: copied ? "#22c55e" : undefined }}>
                {copied ? "✓ Link copied" : "Share profile"}
              </button>
              {cfHandle && (
                <button className={styles.avatarDropdownItem} onClick={copyEmbed} style={{ color: embedCopied ? "#6366f1" : undefined }}>
                  {embedCopied ? "✓ Copied" : "Copy README card"}
                </button>
              )}
              <div className={styles.avatarDropdownDivider} />
              <button className={styles.avatarDropdownItem} onClick={handleLogout} style={{ color: "#ef4444" }}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </header>

      <nav className={styles.tabs}>
        {tabs.map(t => (
          <button key={t.key} className={`${styles.tab} ${activeTab === t.key ? styles.activeTab : ""}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className={styles.main}>

        {activeTab === "overview" && (
          <>
            {(() => {
              const score = computeCPScore({ user: data.user, lc: data.lc, cc: data.cc });
              return score !== null ? <div style={{ marginBottom: 24 }}><CPScore score={score} user={data.user} lc={data.lc} cc={data.cc} /></div> : null;
            })()}

            <div className={styles.platformRow}>
              {data.user && (
                <PlatformCard
                  platform="Codeforces"
                  color="#6366f1"
                  delta={cfDelta}
                  stats={[
                    { label: "Rating", value: data.user.rating ?? "—", color: getRatingColor(data.user.rating) },
                    { label: "Rank", value: data.user.rank ?? "—", tooltip: data.user.rating ? cfRankTooltip(data.user.rating) : null },
                    { label: "Max Rating", value: data.user.maxRating ?? "—", color: getRatingColor(data.user.maxRating) },
                    { label: "Contests", value: data.contests?.length ?? "—" },
                  ]}
                />
              )}
              {data.lc?.contest_ranking && (
                <PlatformCard
                  platform="LeetCode"
                  color="#f59e0b"
                  delta={lcDelta}
                  stats={[
                    { label: "Contest Rating", value: Math.round(data.lc.contest_ranking.rating) },
                    { label: "Global Rank", value: `#${data.lc.contest_ranking.globalRanking?.toLocaleString()}` },
                    { label: "Top %", value: `${data.lc.contest_ranking.topPercentage?.toFixed(1)}%` },
                    { label: "Contests", value: data.lc.contest_ranking.attendedContestsCount ?? "—" },
                  ]}
                />
              )}
              {data.cc && (
                <PlatformCard
                  platform="CodeChef"
                  color="#22c55e"
                  delta={ccDelta}
                  stats={[
                    { label: "Rating", value: data.cc.rating ?? "—" },
                    { label: "Stars", value: data.cc.stars ?? "—" },
                    { label: "Global Rank", value: data.cc.global_rank ?? "—" },
                    { label: "Contests", value: data.cc.contests_participated ?? "—" },
                  ]}
                />
              )}
            </div>

            {(data.cf?.activity || data.lc?.activity || data.cc?.rating_history) && (
              <div className={`${styles.card} ${styles.fullWidth}`} style={{ marginBottom: 8 }}>
                <h2>Submission Activity</h2>
                <ActivityHeatmap cfActivity={data.cf?.activity} lcActivity={data.lc?.activity} ccRatingHistory={data.cc?.rating_history} />
              </div>
            )}

            <div className={styles.card} style={{ marginBottom: 8 }}>
              <h2>AI Study Plan</h2>
              <StudyPlan data={data} user={{ cpScore: computeCPScore({ user: data.user, lc: data.lc, cc: data.cc }) }} />
            </div>

            {allInsights.length > 0 && <Insights insights={allInsights} />}
            {(data.cfRecs?.recommendations?.length > 0 || data.lcRecs?.recommendations?.length > 0 || data.ccRecs?.recommendations?.length > 0) && (
              <div className={styles.recsRow}>
                {data.cfRecs?.recommendations?.length > 0 && <Recommendations title="Codeforces" recommendations={data.cfRecs.recommendations} />}
                {data.lcRecs?.recommendations?.length > 0 && <Recommendations title="LeetCode" recommendations={data.lcRecs.recommendations} />}
                {data.ccRecs?.recommendations?.length > 0 && <Recommendations title="CodeChef Practice" recommendations={data.ccRecs.recommendations} />}
              </div>
            )}

            <div className={styles.grid}>
              {data.cf?.rating_trend?.length > 0 && (
                <div className={styles.card}>
                  <h2>CF Rating History</h2>
                  <RatingChart data={data.cf.rating_trend} />
                </div>
              )}
              {data.lc?.contest_history?.length > 0 && (
                <div className={styles.card}>
                  <h2>LC Contest History</h2>
                  <LCContestChart data={data.lc.contest_history} />
                </div>
              )}
              {data.cf?.tag_analysis && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Skill Map</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "-12px 0 4px", lineHeight: 1.6 }}>
                    Accuracy across topic buckets from your Codeforces submissions
                  </p>
                  <SkillRadar cfTagStats={data.cf?.tag_analysis} lcTagCounts={data.lc?.tag_counts} />
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "progress" && (
          <div className={styles.card}>
            <h2>Rating Progress</h2>
            <ProgressTracker snapshots={snapshots} />
          </div>
        )}

        {activeTab === "codeforces" && (
          <>
            {data.user && (
              <div style={{ background: "#6366f108", border: "1px solid #6366f125", borderLeft: "4px solid #6366f1", borderRadius: 12, padding: "20px 28px", marginBottom: 24, display: "flex", gap: 40, flexWrap: "wrap" }}>
                <PlatformStat label="Rating"     value={data.user.rating ?? "—"}    color={getRatingColor(data.user.rating)} />
                <PlatformStat label="Rank"       value={data.user.rank ?? "—"}       color="#94a3b8" />
                <PlatformStat label="Max Rating" value={data.user.maxRating ?? "—"} color={getRatingColor(data.user.maxRating)} />
                <PlatformStat label="Contests"   value={data.contests?.length ?? "—"} color="#64748b" />
              </div>
            )}
            <div className={styles.grid}>
              {data.cf?.rating_trend?.length > 0 && (
                <div className={styles.card}>
                  <h2>Rating History</h2>
                  <RatingChart data={data.cf.rating_trend} />
                </div>
              )}
              {data.cf?.difficulty_breakdown && (
                <div className={styles.card}>
                  <h2>Accuracy by Difficulty</h2>
                  <DifficultyChart data={data.cf.difficulty_breakdown} />
                </div>
              )}
              {data.cf?.tag_analysis && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Skill Map</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>Accuracy per topic bucket from your Codeforces submissions</p>
                  <SkillRadar cfTagStats={data.cf?.tag_analysis} />
                </div>
              )}
              {data.cf?.weak_tags?.length > 0 && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Weak Topics</h2>
                  <WeakTags tags={data.cf.weak_tags} />
                </div>
              )}
            </div>
            {data.cfRecs?.recommendations?.length > 0 && (
              <Recommendations recommendations={data.cfRecs.recommendations} title="Recommended Problems" />
            )}
          </>
        )}

        {activeTab === "leetcode" && (
          <>
            {data.lc?.contest_ranking && (
              <div style={{ background: "#f59e0b08", border: "1px solid #f59e0b25", borderLeft: "4px solid #f59e0b", borderRadius: 12, padding: "20px 28px", marginBottom: 24, display: "flex", gap: 40, flexWrap: "wrap" }}>
                <PlatformStat label="Contest Rating" value={Math.round(data.lc.contest_ranking.rating)}                                    color="#f59e0b" />
                <PlatformStat label="Global Rank"    value={`#${data.lc.contest_ranking.globalRanking?.toLocaleString()}`}                  color="#94a3b8" />
                <PlatformStat label="Top %"          value={`${data.lc.contest_ranking.topPercentage?.toFixed(1)}%`}                        color="#f59e0b" />
                <PlatformStat label="Contests"       value={data.lc.contest_ranking.attendedContestsCount ?? "—"}                           color="#64748b" />
              </div>
            )}
            <div className={styles.grid}>
              {data.lc?.contest_history?.length > 0 && (
                <div className={styles.card}>
                  <h2>Contest History</h2>
                  <LCContestChart data={data.lc.contest_history} />
                </div>
              )}
              {data.lc?.profile?.ac_stats && (
                <div className={styles.card} style={{ minHeight: 380 }}>
                  <h2>Problems Solved</h2>
                  <LCProblemsChart stats={data.lc.profile.ac_stats} />
                </div>
              )}
              {data.lc?.tag_counts?.length > 0 && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Skill Map</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px" }}>Problems solved per topic bucket from your LeetCode history</p>
                  <SkillRadar lcTagCounts={data.lc?.tag_counts} />
                </div>
              )}
              {data.lc?.weak_tags?.length > 0 && (
                <div className={styles.card} style={{ minHeight: 380 }}>
                  <h2>Skill Gaps</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px", lineHeight: 1.6 }}>
                    Topics with fewest problems solved — target these to level up
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {data.lc.weak_tags.slice(0, 6).map((t, i) => {
                      const intensity = 1 - i / (data.lc.weak_tags.length - 1 || 1);
                      const barW = Math.max(10, Math.round(intensity * 60));
                      return (
                        <a key={i}
                          href={`https://leetcode.com/tag/${t.toLowerCase().replace(/\s+/g, "-")}`}
                          target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#0f1117", border: "1px solid #2d3748", borderRadius: 8, textDecoration: "none", transition: "border-color 0.2s, background 0.2s" }}
                          onMouseOver={e => { e.currentTarget.style.borderColor = "#f59e0b"; e.currentTarget.style.background = "#131825"; }}
                          onMouseOut={e => { e.currentTarget.style.borderColor = "#2d3748"; e.currentTarget.style.background = "#0f1117"; }}
                        >
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#475569", width: 16, textAlign: "right", flexShrink: 0 }}>#{i + 1}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "#e2e8f0" }}>{t}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 60, height: 4, background: "#1e2330", borderRadius: 99, overflow: "hidden" }}>
                              <div style={{ width: `${barW}%`, height: "100%", background: `hsl(${45 - i * 6}, 80%, 55%)`, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b", width: 18 }}>→</span>
                          </div>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              {data.lc?.recent_solved?.length > 0 && (
                <div className={styles.card}>
                  <h2>Recently Solved</h2>
                  <RecentSolved problems={data.lc.recent_solved} />
                </div>
              )}
            </div>
            {data.lcRecs?.recommendations?.length > 0 && (
              <Recommendations recommendations={data.lcRecs.recommendations} title="Recommended Problems" />
            )}
          </>
        )}

        {activeTab === "codechef" && (
          <>
            {data.cc && (
              <div style={{ background: "#22c55e08", border: "1px solid #22c55e25", borderLeft: "4px solid #22c55e", borderRadius: 12, padding: "20px 28px", marginBottom: 24, display: "flex", gap: 40, flexWrap: "wrap", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>{data.cc.rating}</div>
                  <div style={{ fontSize: 18, color: "#f59e0b", marginTop: 4 }}>{data.cc.stars}</div>
                </div>
                <div style={{ width: 1, height: 48, background: "#2d3748", flexShrink: 0 }} />
                {data.cc.global_rank  && <PlatformStat label="Global Rank"   value={data.cc.global_rank}            color="#94a3b8" />}
                {data.cc.country_rank && <PlatformStat label="Country Rank"  value={data.cc.country_rank}           color="#94a3b8" />}
                {data.cc.contests_participated && <PlatformStat label="Contests" value={data.cc.contests_participated} color="#64748b" />}
                {data.cc.problems_solved > 0   && <PlatformStat label="Problems Solved" value={data.cc.problems_solved} color="#64748b" />}
              </div>
            )}
            <div className={styles.grid}>
              {data.cc?.rating_history?.length > 0 && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Rating History</h2>
                  <CCRatingChart data={data.cc.rating_history} />
                </div>
              )}
              {data.ccRecs?.recommendations?.length > 0 && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Practice Links</h2>
                  <Recommendations recommendations={data.ccRecs.recommendations} />
                </div>
              )}
            </div>
          </>
        )}

      </main>

      {/* Edit handles modal */}
      {editOpen && (
        <div onClick={() => setEditOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <form onClick={e => e.stopPropagation()} onSubmit={handleEditSave} style={{
            background: "#1a1f2e", border: "1px solid #2d3748", borderRadius: 16,
            padding: "32px 36px", width: 400, display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 4 }}>Edit handles</div>
              <div style={{ fontSize: 13, color: "#475569" }}>Leave a field blank to remove that platform.</div>
            </div>
            {[
              { key: "cf", label: "Codeforces", placeholder: "e.g. tourist", color: "#6366f1" },
              { key: "lc", label: "LeetCode",   placeholder: "e.g. neal_wu",  color: "#f59e0b" },
              { key: "cc", label: "CodeChef",   placeholder: "e.g. gennady",  color: "#22c55e" },
            ].map(({ key, label, placeholder, color }) => (
              <div key={key}>
                <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                <input
                  value={editForm[key]}
                  onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "#0f1117", border: `1px solid #2d3748`, borderRadius: 8,
                    padding: "10px 14px", fontSize: 14, color: "#e2e8f0", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = color}
                  onBlur={e => e.target.style.borderColor = "#2d3748"}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
              <button type="button" onClick={() => setEditOpen(false)} style={{
                padding: "9px 20px", borderRadius: 8, border: "1px solid #2d3748",
                background: "none", color: "#64748b", fontSize: 13, cursor: "pointer",
              }}>Cancel</button>
              <button type="submit" style={{
                padding: "9px 20px", borderRadius: 8, border: "none",
                background: "#6366f1", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
              }}>Save & Reload</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PlatformStat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

function getRatingColor(rating) {
  if (!rating) return "#94a3b8";
  if (rating >= 2400) return "#ff0000";
  if (rating >= 2100) return "#ff8c00";
  if (rating >= 1900) return "#aa00aa";
  if (rating >= 1600) return "#0000ff";
  if (rating >= 1400) return "#03a89e";
  if (rating >= 1200) return "#008000";
  return "#808080";
}

