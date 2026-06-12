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

export default function Dashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cfHandle = params.get("codeforces");
  const lcUsername = params.get("leetcode");
  const ccUsername = params.get("codechef");

  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }
  const [data, setData] = useState({ cf: null, lc: null, cc: null, user: null, contests: null, cfRecs: null, lcRecs: null, ccRecs: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

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
        setData({
          cf: results[0].value?.data ?? null,
          lc: results[1].value?.data ?? null,
          user: results[2].value?.data ?? null,
          contests: results[3].value?.data ?? null,
          cfRecs: results[4].value?.data ?? null,
          cc: results[5].value?.data ?? null,
          lcRecs: results[6].value?.data ?? null,
          ccRecs: results[7].value?.data ?? null,
        });
      } catch (e) {
        setError("Failed to fetch data. Check your handles and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [cfHandle, lcUsername, ccUsername]);

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
    { key: "overview", label: "Overview" },
    ...(cfHandle ? [{ key: "codeforces", label: "Codeforces" }] : []),
    ...(lcUsername ? [{ key: "leetcode", label: "LeetCode" }] : []),
    ...(ccUsername ? [{ key: "codechef", label: "CodeChef" }] : []),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 onClick={() => navigate("/")} className={styles.logo}>CP<span>Lens</span></h1>
        <div className={styles.platformBadges}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 4 }}>
              <img src={user.photoURL} alt="" style={{ width: 26, height: 26, borderRadius: "50%", border: "2px solid #2d3748" }} referrerPolicy="no-referrer" />
              <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#64748b", fontSize: 12, cursor: "pointer" }}>Sign out</button>
            </div>
          )}
          <button onClick={shareProfile} style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "1px solid #2d3748", background: copied ? "#1a2e1a" : "#1e2330",
            color: copied ? "#22c55e" : "#94a3b8", transition: "all 0.2s",
          }}>
            {copied ? "✓ Copied!" : "Share →"}
          </button>
          {data.user && (
            <span className={styles.badge} style={{ color: getRatingColor(data.user.rating) }}>
              CF {data.user.rating ?? "—"} · {data.user.rank}
            </span>
          )}
          {data.lc?.contest_ranking && (
            <span className={styles.badge} style={{ color: "#f59e0b" }}>
              LC {Math.round(data.lc.contest_ranking.rating ?? 0)} · Top {data.lc.contest_ranking.topPercentage?.toFixed(1)}%
            </span>
          )}
          {data.cc?.rating && (
            <span className={styles.badge} style={{ color: "#f59e0b" }}>
              CC {data.cc.rating} · {data.cc.stars}
            </span>
          )}
        </div>
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
                  stats={[
                    { label: "Rating", value: data.user.rating ?? "—", color: getRatingColor(data.user.rating) },
                    { label: "Rank", value: data.user.rank ?? "—" },
                    { label: "Max Rating", value: data.user.maxRating ?? "—", color: getRatingColor(data.user.maxRating) },
                    { label: "Contests", value: data.contests?.length ?? "—" },
                  ]}
                />
              )}
              {data.lc?.contest_ranking && (
                <PlatformCard
                  platform="LeetCode"
                  color="#f59e0b"
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
                  stats={[
                    { label: "Rating", value: data.cc.rating ?? "—" },
                    { label: "Stars", value: data.cc.stars ?? "—" },
                    { label: "Global Rank", value: data.cc.global_rank ?? "—" },
                    { label: "Contests", value: data.cc.contests_participated ?? "—" },
                  ]}
                />
              )}
            </div>

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
              {data.cf?.activity && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Submission Activity</h2>
                  <ActivityHeatmap cfActivity={data.cf?.activity} lcActivity={data.lc?.activity} ccRatingHistory={data.cc?.rating_history} />
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "codeforces" && (
          <>
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
                  <p style={{ fontSize: 12, color: "#64748b", margin: "-12px 0 4px" }}>Accuracy per topic bucket based on all your submissions</p>
                  <SkillRadar cfTagStats={data.cf?.tag_analysis} lcTagCounts={data.lc?.tag_counts} />
                </div>
              )}
              {data.cf?.weak_tags?.length > 0 && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Weak Topics</h2>
                  <WeakTags tags={data.cf.weak_tags} />
                </div>
              )}
              {data.cf?.activity && (
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2>Submission Activity</h2>
                  <ActivityHeatmap cfActivity={data.cf?.activity} lcActivity={data.lc?.activity} ccRatingHistory={data.cc?.rating_history} />
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
              {data.lc?.weak_tags?.length > 0 && (
                <div className={styles.card} style={{ minHeight: 380 }}>
                  <h2>Skill Gaps</h2>
                  <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 20px", lineHeight: 1.6 }}>
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
          <div className={styles.grid}>
            {data.cc && (
              <div className={styles.card}>
                <h2>Profile</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 12 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: "#22c55e" }}>
                    {data.cc.rating} <span style={{ fontSize: 20, color: "#94a3b8" }}>{data.cc.stars}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {data.cc.global_rank && <div><div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Global Rank</div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.cc.global_rank}</div></div>}
                    {data.cc.country_rank && <div><div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Country Rank</div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.cc.country_rank}</div></div>}
                    {data.cc.contests_participated && <div><div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Contests</div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.cc.contests_participated}</div></div>}
                    {data.cc.problems_solved > 0 && <div><div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>Problems Solved</div><div style={{ fontSize: 20, fontWeight: 700 }}>{data.cc.problems_solved}</div></div>}
                  </div>
                </div>
              </div>
            )}
            {data.cc?.rating_history?.length > 0 && (
              <div className={styles.card}>
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
        )}

      </main>
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

function diffColor(d) {
  if (d === "Easy") return "#22c55e";
  if (d === "Medium") return "#f59e0b";
  return "#ef4444";
}
