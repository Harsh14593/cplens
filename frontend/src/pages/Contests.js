import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUpcomingContests } from "../api";
import styles from "./Dashboard.module.css";

function useCountdown(startTime) {
  const [diff, setDiff] = useState(startTime * 1000 - Date.now());
  useEffect(() => {
    const id = setInterval(() => setDiff(startTime * 1000 - Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return diff;
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(ts) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Countdown({ startTime }) {
  const diff = useCountdown(startTime);
  if (diff <= 0) return <span style={{ color: "#22c55e", fontWeight: 700 }}>Live now</span>;

  const totalSecs = Math.floor(diff / 1000);
  const d = Math.floor(totalSecs / 86400);
  const h = Math.floor((totalSecs % 86400) / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const color = d === 0 && h < 6 ? "#f59e0b" : "#94a3b8";

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
      {d > 0 && <span style={{ color, fontWeight: 700, fontSize: 15 }}>{d}<span style={{ fontSize: 10, color: "#475569", marginLeft: 1 }}>d</span></span>}
      <span style={{ color, fontWeight: 700, fontSize: 15 }}>{String(h).padStart(2,"0")}<span style={{ fontSize: 10, color: "#475569", marginLeft: 1 }}>h</span></span>
      <span style={{ color, fontWeight: 700, fontSize: 15 }}>{String(m).padStart(2,"0")}<span style={{ fontSize: 10, color: "#475569", marginLeft: 1 }}>m</span></span>
      <span style={{ color, fontWeight: 700, fontSize: 13 }}>{String(s).padStart(2,"0")}<span style={{ fontSize: 10, color: "#475569", marginLeft: 1 }}>s</span></span>
    </div>
  );
}

function ContestCard({ contest }) {
  const gcalUrl = () => {
    const start = new Date(contest.startTime * 1000);
    const end   = new Date((contest.startTime + contest.duration) * 1000);
    const fmt   = d => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(contest.name)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(contest.url)}`;
  };

  return (
    <div style={{
      background: "#0f1117", borderRadius: 12,
      border: `1px solid #1e2330`, borderLeft: `3px solid ${contest.color}`,
      padding: "20px 24px", display: "grid",
      gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
    }}>
      <div>
        {/* platform badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: contest.color,
            background: contest.color + "18", padding: "2px 10px",
            borderRadius: 99, letterSpacing: "0.5px",
          }}>
            {contest.platform.toUpperCase()}
          </span>
          <span style={{ fontSize: 11, color: "#475569" }}>
            {formatDuration(contest.duration)}
          </span>
        </div>

        {/* contest name */}
        <a href={contest.url} target="_blank" rel="noreferrer" style={{
          fontSize: 15, fontWeight: 700, color: "#e2e8f0",
          textDecoration: "none", display: "block", marginBottom: 6,
        }}
          onMouseEnter={e => e.target.style.color = contest.color}
          onMouseLeave={e => e.target.style.color = "#e2e8f0"}
        >
          {contest.name}
        </a>

        {/* start time */}
        <div style={{ fontSize: 12, color: "#475569" }}>{formatDate(contest.startTime)}</div>
      </div>

      {/* right: countdown + actions */}
      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
        <Countdown startTime={contest.startTime} />
        <div style={{ display: "flex", gap: 8 }}>
          <a href={gcalUrl()} target="_blank" rel="noreferrer" style={{
            fontSize: 11, padding: "5px 12px", borderRadius: 7,
            background: "#1e2330", border: "1px solid #2d3748",
            color: "#64748b", textDecoration: "none",
          }}>
            + Calendar
          </a>
          <a href={contest.url} target="_blank" rel="noreferrer" style={{
            fontSize: 11, padding: "5px 12px", borderRadius: 7,
            background: contest.color + "20", border: `1px solid ${contest.color}50`,
            color: contest.color, textDecoration: "none", fontWeight: 600,
          }}>
            Register →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Contests() {
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");

  useEffect(() => {
    getUpcomingContests()
      .then(r => setContests(r.data))
      .finally(() => setLoading(false));
  }, []);

  const platforms = ["all", "Codeforces", "LeetCode"];
  const visible   = filter === "all" ? contests : contests.filter(c => c.platform === filter);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 onClick={() => navigate("/")} className={styles.logo} style={{ cursor: "pointer" }}>
          CP<span>Lens</span>
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          {platforms.map(p => (
            <button key={p} onClick={() => setFilter(p)} style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              cursor: "pointer", border: "1px solid #2d3748",
              background: filter === p ? "#1a1f35" : "#1e2330",
              color: filter === p ? "#6366f1" : "#64748b",
              transition: "all 0.15s",
            }}>
              {p === "all" ? "All" : p}
            </button>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 40px 40px" }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#e2e8f0", margin: 0 }}>Upcoming Contests</h2>
          <p style={{ color: "#475569", fontSize: 13, marginTop: 6 }}>
            Codeforces + LeetCode · auto-refreshes on page load
          </p>
        </div>

        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : visible.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#475569" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
            <div>No upcoming contests found.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {visible.map(c => <ContestCard key={`${c.platform}-${c.id}`} contest={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}
