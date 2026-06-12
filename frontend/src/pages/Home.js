import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, getCountFromServer } from "firebase/firestore";
import styles from "./Home.module.css";

const FEATURES = [
  { icon: "🏆", title: "CP Score",          desc: "Composite 0–3000 score and tier ranking across Codeforces, LeetCode, and CodeChef." },
  { icon: "🤖", title: "AI Study Plan",     desc: "Gemini-powered weekly plan built around your weak topics and current rating." },
  { icon: "📊", title: "Activity Heatmap",  desc: "GitHub-style 365-day submission grid merged across all three platforms." },
  { icon: "📈", title: "Progress Tracker",  desc: "Daily rating snapshots stored in Firestore with sparkline charts and all-time deltas." },
  { icon: "⚔️", title: "Head-to-Head",      desc: "Compare two coders side-by-side — stat bars, dual skill radar, shareable URL." },
  { icon: "📅", title: "Contest Calendar",  desc: "Upcoming CF + LC contests with live countdown timers and Google Calendar export." },
];

export default function Home() {
  const { user, handles, login, saveHandles } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ codeforces: "", leetcode: "", codechef: "" });
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    if (handles?.cf || handles?.lc || handles?.cc) {
      const p = new URLSearchParams();
      if (handles.cf) p.set("codeforces", handles.cf);
      if (handles.lc) p.set("leetcode",   handles.lc);
      if (handles.cc) p.set("codechef",   handles.cc);
      navigate(`/dashboard?${p.toString()}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handles]);

  useEffect(() => {
    getCountFromServer(collection(db, "leaderboard"))
      .then(snap => setUserCount(snap.data().count))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.codeforces && !form.leetcode && !form.codechef) return;
    if (user) await saveHandles(form.codeforces, form.leetcode, form.codechef);
    const p = new URLSearchParams();
    if (form.codeforces) p.set("codeforces", form.codeforces);
    if (form.leetcode)   p.set("leetcode",   form.leetcode);
    if (form.codechef)   p.set("codechef",   form.codechef);
    navigate(`/dashboard?${p.toString()}`);
  }

  return (
    <div className={styles.page}>
      {/* navbar */}
      <nav className={styles.nav}>
        <span className={styles.navLogo}>CP<span>Lens</span></span>
        <div className={styles.navLinks}>
          <a href="/leaderboard" className={styles.navLink}>Leaderboard</a>
          <a href="/contests"    className={styles.navLink}>Contests</a>
          <a href="/compare"     className={styles.navLink}>Compare</a>
        </div>
      </nav>

      {/* hero */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>Codeforces · LeetCode · CodeChef</div>
        <h1 className={styles.title}>Your competitive programming<br />career, in one dashboard.</h1>
        <p className={styles.subtitle}>
          Unified analytics, AI-powered study plans, and a global leaderboard — all from your existing handles.
        </p>

        {/* live stats */}
        <div className={styles.stats}>
          {userCount !== null && (
            <div className={styles.statPill}>
              <span className={styles.statNum}>{userCount.toLocaleString()}</span>
              <span className={styles.statLabel}>profiles analyzed</span>
            </div>
          )}
          <div className={styles.statPill}>
            <span className={styles.statNum}>3</span>
            <span className={styles.statLabel}>platforms supported</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statNum}>10+</span>
            <span className={styles.statLabel}>analytics features</span>
          </div>
        </div>

        {/* auth */}
        {user ? (
          <div className={styles.userInfo}>
            <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
            <span className={styles.userName}>Hey, {user.displayName?.split(" ")[0]}</span>
          </div>
        ) : (
          <button className={styles.googleBtn} onClick={login}>
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        )}

        {/* form */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputRow}>
            <div className={styles.inputGroup}>
              <label>Codeforces</label>
              <input type="text" placeholder="e.g. tourist"
                value={form.codeforces} onChange={e => setForm({ ...form, codeforces: e.target.value })} />
            </div>
            <div className={styles.inputGroup}>
              <label>LeetCode</label>
              <input type="text" placeholder="e.g. neal_wu"
                value={form.leetcode} onChange={e => setForm({ ...form, leetcode: e.target.value })} />
            </div>
            <div className={styles.inputGroup}>
              <label>CodeChef</label>
              <input type="text" placeholder="e.g. gennady"
                value={form.codechef} onChange={e => setForm({ ...form, codechef: e.target.value })} />
            </div>
          </div>
          <button type="submit">{user ? "Save & Analyze →" : "Analyze My Profile →"}</button>
          {user
            ? <p className={styles.hint} style={{ color: "#22c55e" }}>✓ Signed in — handles saved automatically</p>
            : <p className={styles.hint}>Sign in with Google to save your handles across sessions</p>
          }
        </form>
      </section>

      {/* features grid */}
      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Everything you need to level up</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{f.icon}</div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        Built with FastAPI · React · Firebase · Gemini &nbsp;·&nbsp;
        <a href="https://github.com/Harsh14593/cplens" target="_blank" rel="noreferrer" style={{ color: "#6366f1", textDecoration: "none" }}>GitHub ↗</a>
      </footer>
    </div>
  );
}
