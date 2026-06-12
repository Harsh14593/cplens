import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../utils/progress";
import styles from "./Leaderboard.module.css";

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
        <div className={styles.tableHandles}>{handles}</div>
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

  const top3   = rows.slice(0, 3);
  const rest   = rows.slice(3);

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
            {top3.length >= 2 && (
              <div className={styles.podium}>
                {PODIUM_ORDER.map(i => top3[i] ? (
                  <PodiumCard key={i} row={top3[i]} rank={i} navigate={navigate} />
                ) : null)}
              </div>
            )}

            {rest.length > 0 && (
              <div className={styles.table}>
                {rest.map((row, i) => (
                  <TableRow key={row.uid} row={row} rank={i + 3} navigate={navigate} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
