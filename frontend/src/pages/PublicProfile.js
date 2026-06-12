import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { analyzeCodeforces, analyzeLeetcode, analyzeCodechef, getCFUser, getCFContests } from "../api";
import { computeCPScore } from "../components/CPScore";
import { TIERS } from "../components/CPScore";
import PlatformCard from "../components/PlatformCard";
import SkillRadar from "../components/SkillRadar";
import ActivityHeatmap from "../components/ActivityHeatmap";
import LCProblemsChart from "../components/LCProblemsChart";
import CCRatingChart from "../components/CCRatingChart";
import RatingChart from "../components/RatingChart";
import LCContestChart from "../components/LCContestChart";
import Achievements from "../components/Achievements";
import styles from "./PublicProfile.module.css";
import { getRatingColor } from "../utils/cfColors";

export default function PublicProfile() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();
  const cfHandle  = params.get("codeforces");
  const lcUsername = params.get("leetcode");
  const ccUsername = params.get("codechef");

  const [data, setData]       = useState({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    async function fetchAll() {
      const results = await Promise.allSettled([
        cfHandle   ? analyzeCodeforces(cfHandle)   : Promise.resolve(null),
        lcUsername ? analyzeLeetcode(lcUsername)   : Promise.resolve(null),
        cfHandle   ? getCFUser(cfHandle)           : Promise.resolve(null),
        cfHandle   ? getCFContests(cfHandle)       : Promise.resolve(null),
        ccUsername ? analyzeCodechef(ccUsername)   : Promise.resolve(null),
      ]);
      setData({
        cf:       results[0].value?.data ?? null,
        lc:       results[1].value?.data ?? null,
        user:     results[2].value?.data ?? null,
        contests: results[3].value?.data ?? null,
        cc:       results[4].value?.data ?? null,
      });
      setLoading(false);
    }
    fetchAll();
  }, [cfHandle, lcUsername, ccUsername]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className={styles.center}>
      <div className={styles.spinner} />
      <p>Loading profile...</p>
    </div>
  );

  const score = computeCPScore({ user: data.user, lc: data.lc, cc: data.cc });
  const tier  = score !== null ? (TIERS.find(t => score >= t.min) ?? TIERS[TIERS.length - 1]) : null;
  const primaryHandle = cfHandle || lcUsername || ccUsername;

  const heroBadges = [
    data.user?.rank && { label: data.user.rank, color: getRatingColor(data.user.rating) },
    data.user?.rating && { label: `CF ${data.user.rating}`, color: "#6366f1" },
    data.lc?.contest_ranking?.topPercentage && { label: `Top ${data.lc.contest_ranking.topPercentage.toFixed(1)}% LC`, color: "#f59e0b" },
    data.cc?.stars && { label: `${data.cc.stars} CC`, color: "#22c55e" },
  ].filter(Boolean);

  return (
    <div className={styles.page}>
      {/* header */}
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => navigate("/")}>CP<span>Lens</span></h1>
        <div className={styles.headerRight}>
          <button className={styles.shareBtn} onClick={copyLink}>
            {copied ? "✓ Copied!" : "Copy Link"}
          </button>
          <button className={styles.analyzeBtn} onClick={() => navigate("/")}>
            Analyze your profile →
          </button>
        </div>
      </header>

      {/* hero banner */}
      {(data.user || score !== null) && (
        <div className={styles.heroBanner}>
          <div className={styles.heroInner}
            style={{ background: `linear-gradient(135deg, ${tier?.color ?? "#6366f1"}08, #1a1f2e)`, borderColor: (tier?.color ?? "#6366f1") + "30", color: tier?.color ?? "#6366f1" }}>

            {data.user?.titlePhoto ? (
              <img src={data.user.titlePhoto.replace("http://", "https://")} alt=""
                className={styles.heroAvatar} style={{ borderColor: (tier?.color ?? "#6366f1") + "60" }} />
            ) : (
              <div className={styles.heroAvatarFallback} style={{ borderColor: (tier?.color ?? "#6366f1") + "60", color: tier?.color ?? "#6366f1" }}>
                {primaryHandle?.[0]?.toUpperCase()}
              </div>
            )}

            <div className={styles.heroInfo}>
              <div className={styles.heroHandle}>{primaryHandle}</div>
              <div className={styles.heroBadges}>
                {heroBadges.map((b, i) => (
                  <span key={i} className={styles.heroBadge}
                    style={{ color: b.color, borderColor: b.color + "40", background: b.color + "10" }}>
                    {b.label}
                  </span>
                ))}
              </div>
            </div>

            {score !== null && (
              <div className={styles.heroRight}>
                <div className={styles.heroScoreLabel}>CP Score</div>
                <div className={styles.heroScore} style={{ color: tier?.color ?? "#6366f1" }}>{score}</div>
                <div className={styles.heroTier} style={{ color: tier?.color ?? "#6366f1" }}>{tier?.label}</div>
              </div>
            )}
          </div>
        </div>
      )}

      <main className={styles.main}>

        {/* achievements */}
        <div className={styles.card} style={{ marginBottom: 24 }}>
          <h2>Achievements</h2>
          <Achievements data={data} cpScore={computeCPScore({ user: data.user, lc: data.lc, cc: data.cc })} />
        </div>

        {/* platform cards */}
        <div className={styles.platformRow}>
          {data.user && (
            <PlatformCard platform="Codeforces" color="#6366f1" stats={[
              { label: "Rating",     value: data.user.rating ?? "—", color: getRatingColor(data.user.rating) },
              { label: "Rank",       value: data.user.rank ?? "—" },
              { label: "Max Rating", value: data.user.maxRating ?? "—", color: getRatingColor(data.user.maxRating) },
              { label: "Contests",   value: data.contests?.length ?? "—" },
            ]} />
          )}
          {data.lc?.contest_ranking && (
            <PlatformCard platform="LeetCode" color="#f59e0b" stats={[
              { label: "Contest Rating", value: Math.round(data.lc.contest_ranking.rating) },
              { label: "Global Rank",    value: `#${data.lc.contest_ranking.globalRanking?.toLocaleString()}` },
              { label: "Top %",          value: `${data.lc.contest_ranking.topPercentage?.toFixed(1)}%` },
              { label: "Contests",       value: data.lc.contest_ranking.attendedContestsCount ?? "—" },
            ]} />
          )}
          {data.cc && (
            <PlatformCard platform="CodeChef" color="#22c55e" stats={[
              { label: "Rating",   value: data.cc.rating ?? "—" },
              { label: "Stars",    value: data.cc.stars ?? "—" },
              { label: "Global Rank", value: data.cc.global_rank ?? "—" },
              { label: "Contests", value: data.cc.contests_participated ?? "—" },
            ]} />
          )}
        </div>

        {/* skill radar + LC problems side by side */}
        <div className={styles.grid}>
          {(data.cf?.tag_analysis || data.lc?.tag_counts) && (
            <div className={styles.card}>
              <h2>Skill Map</h2>
              <SkillRadar cfTagStats={data.cf?.tag_analysis} lcTagCounts={data.lc?.tag_counts} />
            </div>
          )}
          {data.lc?.profile?.ac_stats && (
            <div className={styles.card}>
              <h2>Problems Solved</h2>
              <LCProblemsChart stats={data.lc.profile.ac_stats} />
            </div>
          )}
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
          {data.cc?.rating_history?.length > 0 && (() => {
            const cfHas = data.cf?.rating_trend?.length > 0;
            const lcHas = data.lc?.contest_history?.length > 0;
            const isOdd = cfHas && lcHas;
            return (
              <div className={styles.card} style={isOdd ? { gridColumn: "1 / -1" } : {}}>
                <h2>CodeChef Rating History</h2>
                <CCRatingChart data={data.cc.rating_history} />
              </div>
            );
          })()}
        </div>

        {/* heatmap full width */}
        {(data.cf?.activity || data.lc?.activity) && (
          <div className={styles.card} style={{ marginTop: 24 }}>
            <h2>Submission Activity</h2>
            <ActivityHeatmap
              cfActivity={data.cf?.activity}
              lcActivity={data.lc?.activity}
              ccRatingHistory={data.cc?.rating_history}
            />
          </div>
        )}

        {/* CTA */}
        <div className={styles.cta}>
          <p>Want to see your own CP analysis?</p>
          <button onClick={() => navigate("/")}>Analyze My Profile →</button>
        </div>
      </main>
    </div>
  );
}
