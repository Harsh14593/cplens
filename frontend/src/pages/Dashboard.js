import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { analyzeCodeforces, analyzeLeetcode, getCFUser, getCFContests, getRecommendations, analyzeCodechef } from "../api";
import RatingChart from "../components/RatingChart";
import WeakTags from "../components/WeakTags";
import Insights from "../components/Insights";
import StatCard from "../components/StatCard";
import Recommendations from "../components/Recommendations";
import DifficultyChart from "../components/DifficultyChart";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cfHandle = params.get("codeforces");
  const lcUsername = params.get("leetcode");
  const ccUsername = params.get("codechef");

  const [data, setData] = useState({ cf: null, lc: null, cc: null, user: null, contests: null, recs: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = await Promise.allSettled([
          cfHandle ? analyzeCodeforces(cfHandle) : Promise.resolve(null),
          lcUsername ? analyzeLeetcode(lcUsername) : Promise.resolve(null),
          cfHandle ? getCFUser(cfHandle) : Promise.resolve(null),
          cfHandle ? getCFContests(cfHandle) : Promise.resolve(null),
          cfHandle ? getRecommendations(cfHandle) : Promise.resolve(null),
          ccUsername ? analyzeCodechef(ccUsername) : Promise.resolve(null),
        ]);
        setData({
          cf: results[0].value?.data ?? null,
          lc: results[1].value?.data ?? null,
          user: results[2].value?.data ?? null,
          contests: results[3].value?.data ?? null,
          recs: results[4].value?.data ?? null,
          cc: results[5].value?.data ?? null,
        });
      } catch (e) {
        setError("Failed to fetch data. Check your handles and try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [cfHandle, lcUsername]);

  if (loading) return <div className={styles.center}><div className={styles.spinner} /><p>Analyzing your profile...</p></div>;
  if (error) return <div className={styles.center}><p>{error}</p></div>;

  const allInsights = [
    ...(data.cf?.insights ?? []),
    ...(data.lc?.insights ?? []),
    ...(data.cc?.insights ?? []),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 onClick={() => navigate("/")} className={styles.logo}>CP<span>Lens</span></h1>
        {data.user && (
          <div className={styles.userInfo}>
            <span className={styles.handle}>{data.user.handle}</span>
            <span className={styles.rating} style={{ color: getRatingColor(data.user.rating) }}>
              {data.user.rating ?? "Unrated"}
            </span>
          </div>
        )}
      </header>

      <main className={styles.main}>
        {data.user && (
          <div className={styles.statRow}>
            <StatCard label="Current Rating" value={data.user.rating ?? "—"} color={getRatingColor(data.user.rating)} />
            <StatCard label="Max Rating" value={data.user.maxRating ?? "—"} color={getRatingColor(data.user.maxRating)} />
            <StatCard label="Rank" value={data.user.rank ?? "—"} />
            <StatCard label="Contests" value={data.contests?.length ?? "—"} />
          </div>
        )}

        {allInsights.length > 0 && <Insights insights={allInsights} />}

        {data.recs?.recommendations?.length > 0 && (
          <Recommendations recommendations={data.recs.recommendations} />
        )}

        <div className={styles.grid}>
          {data.cf?.rating_trend?.length > 0 && (
            <div className={styles.card}>
              <h2>Rating History</h2>
              <RatingChart data={data.cf.rating_trend} />
            </div>
          )}
          {data.cf?.difficulty_breakdown && Object.keys(data.cf.difficulty_breakdown).filter(k => k !== "unrated").length > 0 && (
            <div className={styles.card}>
              <h2>Accuracy by Difficulty</h2>
              <DifficultyChart data={data.cf.difficulty_breakdown} />
            </div>
          )}
          {data.cf?.weak_tags?.length > 0 && (
            <div className={styles.card}>
              <h2>Weak Topics (Codeforces)</h2>
              <WeakTags tags={data.cf.weak_tags} />
            </div>
          )}
          {data.lc?.weak_tags?.length > 0 && (
            <div className={styles.card}>
              <h2>Weak Topics (LeetCode)</h2>
              <WeakTags tags={data.lc.weak_tags.map(t => ({ tag: t, accuracy: 0 }))} />
            </div>
          )}
          {data.cc && (
            <div className={styles.card}>
              <h2>CodeChef Profile</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
                {data.cc.rating && <div style={{ fontSize: 32, fontWeight: 700, color: "#f59e0b" }}>{data.cc.rating} <span style={{ fontSize: 16, color: "#94a3b8" }}>{data.cc.stars}</span></div>}
                {data.cc.global_rank && <div style={{ color: "#94a3b8", fontSize: 14 }}>Global Rank: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{data.cc.global_rank}</span></div>}
                {data.cc.country_rank && <div style={{ color: "#94a3b8", fontSize: 14 }}>Country Rank: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{data.cc.country_rank}</span></div>}
                {data.cc.problems_solved && <div style={{ color: "#94a3b8", fontSize: 14 }}>Problems Solved: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{data.cc.problems_solved}</span></div>}
              </div>
            </div>
          )}
        </div>
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
