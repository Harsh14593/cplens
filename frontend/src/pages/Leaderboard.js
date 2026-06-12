import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboard } from "../utils/progress";
import styles from "./Dashboard.module.css";

const MEDALS = ["🥇", "🥈", "🥉"];

function getRankStyle(rank) {
  if (rank === 0) return { color: "#fbbf24", fontWeight: 800 };
  if (rank === 1) return { color: "#94a3b8", fontWeight: 700 };
  if (rank === 2) return { color: "#cd7f32", fontWeight: 700 };
  return { color: "#475569", fontWeight: 500 };
}

export default function Leaderboard() {
  const navigate  = useNavigate();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard().then(data => { setRows(data); setLoading(false); });
  }, []);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 onClick={() => navigate("/")} className={styles.logo} style={{ cursor: "pointer" }}>
          CP<span>Lens</span>
        </h1>
        <div style={{ fontSize: 13, color: "#475569" }}>
          {rows.length} competitors ranked
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 40px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>Global Leaderboard</h2>
          <p style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>
            Ranked by CP Score — sign in and analyze your profile to appear here.
          </p>
        </div>

        {loading ? (
          <div className={styles.center}>
            <div className={styles.spinner} />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🏆</div>
            <div style={{ fontSize: 15 }}>No entries yet — be the first!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((row, i) => (
              <div
                key={row.uid}
                onClick={() => {
                  const p = new URLSearchParams();
                  if (row.cfHandle)   p.set("codeforces", row.cfHandle);
                  if (row.lcUsername) p.set("leetcode",   row.lcUsername);
                  if (row.ccUsername) p.set("codechef",   row.ccUsername);
                  navigate(`/u?${p.toString()}`);
                }}
                style={{
                  display: "grid",
                  gridTemplateColumns: "44px 44px 1fr auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  background: i < 3 ? "linear-gradient(135deg, #0f1117, #1a1f2e)" : "#0f1117",
                  border: `1px solid ${i < 3 ? row.tierColor + "40" : "#1e2330"}`,
                  borderLeft: `3px solid ${row.tierColor}`,
                  borderRadius: 12,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#1a1f2e"}
                onMouseLeave={e => e.currentTarget.style.background = i < 3 ? "linear-gradient(135deg, #0f1117, #1a1f2e)" : "#0f1117"}
              >
                {/* rank */}
                <div style={{ textAlign: "center", fontSize: i < 3 ? 22 : 14, ...getRankStyle(i) }}>
                  {i < 3 ? MEDALS[i] : `#${i + 1}`}
                </div>

                {/* avatar */}
                {row.photoURL ? (
                  <img src={row.photoURL} alt="" style={{ width: 36, height: 36, borderRadius: "50%", border: `2px solid ${row.tierColor}40` }} referrerPolicy="no-referrer" />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1e2330", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {(row.displayName || "?")[0]}
                  </div>
                )}

                {/* name + handles */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0" }}>{row.displayName || "Anonymous"}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {[row.cfHandle, row.lcUsername, row.ccUsername].filter(Boolean).join(" · ")}
                  </div>
                </div>

                {/* scores */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, textAlign: "right" }}>
                  <div style={{ display: "none", gap: 16 }} className="platform-ratings">
                    {row.cfRating && <div style={{ fontSize: 12 }}><span style={{ color: "#3b82f6", fontWeight: 700 }}>{row.cfRating}</span><div style={{ color: "#475569", fontSize: 10 }}>CF</div></div>}
                    {row.lcRating && <div style={{ fontSize: 12 }}><span style={{ color: "#f59e0b", fontWeight: 700 }}>{Math.round(row.lcRating)}</span><div style={{ color: "#475569", fontSize: 10 }}>LC</div></div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: row.tierColor }}>{row.cpScore}</div>
                    <div style={{ fontSize: 10, color: row.tierColor, opacity: 0.8, letterSpacing: "0.5px" }}>{row.tier?.toUpperCase()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
