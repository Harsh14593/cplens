import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../utils/progress";
import styles from "./Leaderboard.module.css";

const TIER_COLORS = { platinum: "#a855f7", gold: "#f59e0b", silver: "#94a3b8", bronze: "#cd7f32" };
const ACHIEVEMENT_META = {
  streak_7: { icon: "🔥", tier: "bronze" }, streak_30: { icon: "🔥", tier: "silver" },
  streak_100: { icon: "🔥", tier: "gold" }, streak_365: { icon: "🔥", tier: "platinum" },
  cf_1200: { icon: "⚡", tier: "bronze" }, cf_1400: { icon: "⚡", tier: "silver" },
  cf_1600: { icon: "⚡", tier: "silver" }, cf_1900: { icon: "⚡", tier: "gold" },
  cf_2100: { icon: "⚡", tier: "platinum" },
  cf_10c: { icon: "🏁", tier: "bronze" }, cf_25c: { icon: "🏁", tier: "silver" }, cf_50c: { icon: "🏁", tier: "gold" },
  lc_50: { icon: "🧩", tier: "bronze" }, lc_100: { icon: "🧩", tier: "silver" },
  lc_250: { icon: "🧩", tier: "gold" }, lc_500: { icon: "🧩", tier: "platinum" },
  lc_top10: { icon: "🏆", tier: "silver" }, lc_top5: { icon: "🏆", tier: "gold" }, lc_top1: { icon: "🏆", tier: "platinum" },
  cc_3star: { icon: "⭐", tier: "bronze" }, cc_4star: { icon: "⭐", tier: "silver" }, cc_5star: { icon: "⭐", tier: "gold" },
  multi: { icon: "🌐", tier: "gold" },
  cp_1500: { icon: "💎", tier: "silver" }, cp_2000: { icon: "💎", tier: "gold" }, cp_2500: { icon: "💎", tier: "platinum" },
};

// pick top 4 badges by tier priority
function topBadges(earnedIds = [], max = 4) {
  const order = ["platinum", "gold", "silver", "bronze"];
  return [...earnedIds]
    .sort((a, b) => order.indexOf(ACHIEVEMENT_META[a]?.tier) - order.indexOf(ACHIEVEMENT_META[b]?.tier))
    .slice(0, max);
}

function AchievementPills({ earnedIds = [], count, max = 4 }) {
  const badges = topBadges(earnedIds, max);
  if (!count && !badges.length) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {badges.map(id => {
        const m = ACHIEVEMENT_META[id];
        if (!m) return null;
        return (
          <span key={id} style={{
            fontSize: 13, background: TIER_COLORS[m.tier] + "20",
            border: `1px solid ${TIER_COLORS[m.tier]}40`,
            borderRadius: 6, padding: "1px 5px",
          }}>{m.icon}</span>
        );
      })}
      {count > max && (
        <span style={{ fontSize: 10, color: "#475569" }}>+{count - max}</span>
      )}
    </div>
  );
}

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd
const PODIUM_HEIGHTS = { 0: 32, 1: 0, 2: 48 }; // padding-bottom for base block
const MEDAL_COLORS = { 0: "#fbbf24", 1: "#94a3b8", 2: "#cd7f32" };
const MEDAL_LABELS = { 0: "🥇", 1: "🥈", 2: "🥉" };
const BASE_HEIGHTS = { 0: 52, 1: 36, 2: 24 };

function PodiumCard({ row, rank, navigate }) {
  const color = row.tierColor || MEDAL_COLORS[rank];
  const handles = [row.cfHandle, row.lcUsername, row.ccUsername].filter(Boolean).join(" · ");

  function goToProfile() {
    const p = new URLSearchParams();
    if (row.cfHandle)   p.set("codeforces", row.cfHandle);
    if (row.lcUsername) p.set("leetcode",   row.lcUsername);
    if (row.ccUsername) p.set("codechef",   row.ccUsername);
    navigate(`/u?${p.toString()}`);
  }

  return (
    <div className={styles.podiumSlot} style={{ paddingBottom: PODIUM_HEIGHTS[rank] }}>
      <div className={styles.podiumCard} style={{ color, borderColor: color + "40" }} onClick={goToProfile}>
        <div className={styles.podiumRank}>{MEDAL_LABELS[rank]}</div>

        {row.photoURL ? (
          <img src={row.photoURL} alt="" className={styles.podiumAvatar}
            style={{ borderColor: color + "60" }} referrerPolicy="no-referrer" />
        ) : (
          <div className={styles.podiumAvatar} style={{ borderColor: color + "60", color }}>
            {(row.displayName || "?")[0]}
          </div>
        )}

        <div className={styles.podiumName}>{row.displayName || "Anonymous"}</div>
        <div className={styles.podiumHandles}>{handles}</div>
        <div className={styles.podiumScore} style={{ color }}>{row.cpScore}</div>
        <div className={styles.podiumTier} style={{ color }}>{row.tier}</div>
        {row.earnedIds?.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
            <AchievementPills earnedIds={row.earnedIds} count={row.achievementCount} max={3} />
          </div>
        )}
      </div>

      <div className={styles.podiumBase}
        style={{ height: BASE_HEIGHTS[rank], background: color + "22", borderColor: color + "40",
          border: `1px solid`, borderTop: "none", color }}>
        #{rank + 1}
      </div>
    </div>
  );
}

function TableRow({ row, rank, navigate }) {
  const handles = [row.cfHandle, row.lcUsername, row.ccUsername].filter(Boolean).join(" · ");

  function goToProfile() {
    const p = new URLSearchParams();
    if (row.cfHandle)   p.set("codeforces", row.cfHandle);
    if (row.lcUsername) p.set("leetcode",   row.lcUsername);
    if (row.ccUsername) p.set("codechef",   row.ccUsername);
    navigate(`/u?${p.toString()}`);
  }

  return (
    <div className={styles.tableRow} onClick={goToProfile}>
      <div className={styles.tableRank}>#{rank + 1}</div>

      {row.photoURL ? (
        <img src={row.photoURL} alt="" className={styles.tableAvatar} referrerPolicy="no-referrer" />
      ) : (
        <div className={styles.tableAvatarFallback}>
          {(row.displayName || "?")[0]}
        </div>
      )}

      <div className={styles.tableInfo}>
        <div className={styles.tableName}>{row.displayName || "Anonymous"}</div>
        <div className={styles.tableHandles} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{handles}</span>
          {row.earnedIds?.length > 0 && <AchievementPills earnedIds={row.earnedIds} count={row.achievementCount} max={4} />}
        </div>
      </div>

      <div className={styles.tableScores}>
        <div className={styles.platformRatings}>
          {row.cfRating && (
            <div className={styles.platformRating}>
              <div className={styles.platformRatingVal} style={{ color: "#6366f1" }}>{row.cfRating}</div>
              <div className={styles.platformRatingKey}>CF</div>
            </div>
          )}
          {row.lcRating && (
            <div className={styles.platformRating}>
              <div className={styles.platformRatingVal} style={{ color: "#f59e0b" }}>{Math.round(row.lcRating)}</div>
              <div className={styles.platformRatingKey}>LC</div>
            </div>
          )}
          {row.ccRating && (
            <div className={styles.platformRating}>
              <div className={styles.platformRatingVal} style={{ color: "#22c55e" }}>{row.ccRating}</div>
              <div className={styles.platformRatingKey}>CC</div>
            </div>
          )}
        </div>
        <div className={styles.cpScoreBlock}>
          <div className={styles.cpScoreVal} style={{ color: row.tierColor }}>{row.cpScore}</div>
          <div className={styles.cpScoreTier} style={{ color: row.tierColor }}>{row.tier}</div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard()
      .then(data => { setRows(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const showPodium = rows.length >= 3;
  const top3       = showPodium ? rows.slice(0, 3) : [];
  const rest       = showPodium ? rows.slice(3) : rows;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.logo} onClick={() => navigate("/")}>CP<span>Lens</span></h1>
        <div className={styles.headerMeta}>{rows.length} competitors ranked</div>
      </header>

      <main className={styles.main}>
        <h2 className={styles.pageTitle}>Global Leaderboard</h2>
        <p className={styles.pageSubtitle}>Ranked by CP Score — sign in and analyze your profile to appear here.</p>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : rows.length === 0 ? (
          <div className={styles.center}>
            <div style={{ fontSize: 40 }}>🏆</div>
            <div>No entries yet — be the first!</div>
          </div>
        ) : (
          <>
            {showPodium && (
              <div className={styles.podium}>
                {PODIUM_ORDER.map(i => top3[i] ? (
                  <PodiumCard key={i} row={top3[i]} rank={i} navigate={navigate} />
                ) : null)}
              </div>
            )}

            {rest.length > 0 && (
              <div className={styles.table}>
                {rest.map((row, i) => (
                  <TableRow key={row.uid} row={row} rank={i + (showPodium ? 3 : 0)} navigate={navigate} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
