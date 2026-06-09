import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { analyzeCodeforces, analyzeLeetcode, getCFUser, getCFContests } from "../api";
import RatingChart from "../components/RatingChart";
import WeakTags from "../components/WeakTags";
import Insights from "../components/Insights";
import StatCard from "../components/StatCard";
import styles from "./Dashboard.module.css";

export default function Dashboard() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cfHandle = params.get("codeforces");
  const lcUsername = params.get("leetcode");

  const [data, setData] = useState({ cf: null, lc: null, user: null, contests: null });
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
        ]);
        setData({
          cf: results[0].value?.data ?? null,
          lc: results[1].value?.data ?? null,
          user: results[2].value?.data ?? null,
          contests: results[3].value?.data ?? null,
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

        <div className={styles.grid}>
          {data.cf?.rating_trend?.length > 0 && (
            <div className={styles.card}>
              <h2>Rating History</h2>
              <RatingChart data={data.cf.rating_trend} />
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
