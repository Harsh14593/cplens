import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard, addFriend, removeFriend, getFriendUids, searchLeaderboard } from "../utils/progress";
import { useAuth } from "../contexts/AuthContext";
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
      {count > max && <span style={{ fontSize: 10, color: "#475569" }}>+{count - max}</span>}
    </div>
  );
}

const PODIUM_ORDER = [1, 0, 2];
const PODIUM_HEIGHTS = { 0: 32, 1: 0, 2: 48 };
const MEDAL_COLORS = { 0: "#fbbf24", 1: "#94a3b8", 2: "#cd7f32" };
const MEDAL_LABELS = { 0: "🥇", 1: "🥈", 2: "🥉" };
const BASE_HEIGHTS = { 0: 52, 1: 36, 2: 24 };

function goToProfile(row, navigate) {
  const p = new URLSearchParams();
  if (row.cfHandle)   p.set("codeforces", row.cfHandle);
  if (row.lcUsername) p.set("leetcode",   row.lcUsername);
  if (row.ccUsername) p.set("codechef",   row.ccUsername);
  navigate(`/u?${p.toString()}`);
}

function PodiumCard({ row, rank, navigate }) {
  const color = row.tierColor || MEDAL_COLORS[rank];
  const handles = [row.cfHandle, row.lcUsername, row.ccUsername].filter(Boolean).join(" · ");
  return (
    <div className={styles.podiumSlot} style={{ paddingBottom: PODIUM_HEIGHTS[rank] }}>
      <div className={styles.podiumCard} style={{ color, borderColor: color + "40" }} onClick={() => goToProfile(row, navigate)}>
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

function TableRow({ row, rank, navigate, action }) {
  const handles = [row.cfHandle, row.lcUsername, row.ccUsername].filter(Boolean).join(" · ");
  return (
    <div className={styles.tableRow} onClick={() => goToProfile(row, navigate)}>
      <div className={styles.tableRank}>#{rank + 1}</div>
      {row.photoURL ? (
        <img src={row.photoURL} alt="" className={styles.tableAvatar} referrerPolicy="no-referrer" />
      ) : (
        <div className={styles.tableAvatarFallback}>{(row.displayName || "?")[0]}</div>
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
        {action && (
          <div onClick={e => e.stopPropagation()}>{action}</div>
        )}
      </div>
    </div>
  );
}

// ── Friends tab ───────────────────────────────────────────────────────────────
function FriendsTab({ user, allRows, navigate }) {
  const [friendUids, setFriendUids] = useState(new Set());
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [query, setQuery]     = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null); // null = not searched yet
  const [pendingUids, setPendingUids] = useState(new Set()); // UIDs being toggled

  const loadFriends = useCallback(() => {
    if (!user) return;
    getFriendUids(user.uid)
      .then(uids => { setFriendUids(uids); setLoadingFriends(false); })
      .catch(() => setLoadingFriends(false));
  }, [user]);

  useEffect(() => { loadFriends(); }, [loadFriends]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setSearchResults(null);
    try {
      const results = await searchLeaderboard(query.trim());
      setSearchResults(results.filter(r => r.uid !== user.uid)); // exclude self
    } catch {
      setSearchResults([]);
    }
    setSearching(false);
  }

  async function toggleFriend(friendUid) {
    if (pendingUids.has(friendUid)) return;
    setPendingUids(p => new Set([...p, friendUid]));
    try {
      if (friendUids.has(friendUid)) {
        await removeFriend(user.uid, friendUid);
        setFriendUids(prev => { const s = new Set(prev); s.delete(friendUid); return s; });
      } else {
        await addFriend(user.uid, friendUid);
        setFriendUids(prev => new Set([...prev, friendUid]));
      }
    } catch {}
    setPendingUids(p => { const s = new Set(p); s.delete(friendUid); return s; });
  }

  // build ranked friend rows: self + friends, sorted by cpScore
  const myRow = user ? allRows.find(r => r.uid === user.uid) : null;
  const friendRows = allRows.filter(r => friendUids.has(r.uid));
  const boardRows = [...(myRow ? [myRow] : []), ...friendRows]
    .sort((a, b) => (b.cpScore ?? 0) - (a.cpScore ?? 0));

  function friendAction(uid) {
    const isFriend = friendUids.has(uid);
    const pending  = pendingUids.has(uid);
    return (
      <button
        onClick={() => toggleFriend(uid)}
        disabled={pending}
        className={isFriend ? styles.removeFriendBtn : styles.addFriendBtn}
      >
        {pending ? "…" : isFriend ? "Remove" : "+ Add"}
      </button>
    );
  }

  if (!user) {
    return (
      <div className={styles.center} style={{ minHeight: 300 }}>
        <div style={{ fontSize: 32 }}>👥</div>
        <div>Sign in to add friends and compare scores</div>
      </div>
    );
  }

  const showBoardPodium = boardRows.length >= 3;
  const top3 = showBoardPodium ? boardRows.slice(0, 3) : [];
  const rest = showBoardPodium ? boardRows.slice(3) : boardRows;

  return (
    <div>
      {/* search */}
      <form onSubmit={handleSearch} className={styles.searchBar}>
        <input
          className={styles.searchInput}
          placeholder="Search by CF / LC / CC handle…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button type="submit" className={styles.searchBtn} disabled={searching || !query.trim()}>
          {searching ? "…" : "Search"}
        </button>
      </form>

      {/* search results */}
      {searchResults !== null && (
        <div className={styles.searchResults}>
          {searchResults.length === 0 ? (
            <div className={styles.searchEmpty}>No one found with that handle. They may not have analyzed their profile yet.</div>
          ) : (
            searchResults.map(row => (
              <TableRow
                key={row.uid}
                row={row}
                rank={boardRows.findIndex(r => r.uid === row.uid)}
                navigate={navigate}
                action={friendAction(row.uid)}
              />
            ))
          )}
        </div>
      )}

      {/* friends leaderboard */}
      <div style={{ marginTop: searchResults !== null ? 32 : 0 }}>
        {loadingFriends ? (
          <div className={styles.center} style={{ minHeight: 200 }}><div className={styles.spinner} /></div>
        ) : boardRows.length === 0 ? (
          <div className={styles.center} style={{ minHeight: 200 }}>
            <div style={{ fontSize: 32 }}>👥</div>
            <div>Search for friends by handle and add them</div>
            <div style={{ fontSize: 12, color: "#374151" }}>Your own score will appear here too once you're on the leaderboard</div>
          </div>
        ) : (
          <>
            <div className={styles.friendsBoardTitle}>
              Friends Board <span>{boardRows.length} player{boardRows.length !== 1 ? "s" : ""}</span>
            </div>
            {showBoardPodium && (
              <div className={styles.podium}>
                {PODIUM_ORDER.map(i => top3[i] ? (
                  <PodiumCard key={i} row={top3[i]} rank={i} navigate={navigate} />
                ) : null)}
              </div>
            )}
            {rest.length > 0 && (
              <div className={styles.table}>
                {rest.map((row, i) => (
                  <TableRow
                    key={row.uid}
                    row={row}
                    rank={i + (showBoardPodium ? 3 : 0)}
                    navigate={navigate}
                    action={row.uid !== user?.uid ? friendAction(row.uid) : (
                      <span className={styles.youTag}>You</span>
                    )}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab]         = useState("global"); // "global" | "friends"
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
        <h2 className={styles.pageTitle}>Leaderboard</h2>
        <p className={styles.pageSubtitle}>Ranked by CP Score — sign in and analyze your profile to appear here.</p>

        {/* tab strip */}
        <div className={styles.tabs}>
          <button
            className={tab === "global" ? styles.tabActive : styles.tab}
            onClick={() => setTab("global")}
          >
            🌍 Global
          </button>
          <button
            className={tab === "friends" ? styles.tabActive : styles.tab}
            onClick={() => setTab("friends")}
          >
            👥 Friends
          </button>
        </div>

        {tab === "global" ? (
          loading ? (
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
          )
        ) : (
          <FriendsTab user={user} allRows={rows} navigate={navigate} />
        )}
      </main>
    </div>
  );
}
