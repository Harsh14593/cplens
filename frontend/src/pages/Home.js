import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import styles from "./Home.module.css";

export default function Home() {
  const { user, handles, login, saveHandles } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ codeforces: "", leetcode: "", codechef: "" });

  // auto-redirect if user already has saved handles
  useEffect(() => {
    if (handles?.cf || handles?.lc || handles?.cc) {
      const p = new URLSearchParams();
      if (handles.cf) p.set("codeforces", handles.cf);
      if (handles.lc) p.set("leetcode",   handles.lc);
      if (handles.cc) p.set("codechef",   handles.cc);
      navigate(`/dashboard?${p.toString()}`);
    }
  }, [handles]);

  // pre-fill form if logged in but no handles yet
  useEffect(() => {
    if (user && !handles) {
      // leave form empty for first-time users
    }
  }, [user, handles]);

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
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.topBar}>
          {user ? (
            <div className={styles.userInfo}>
              <img src={user.photoURL} alt="" className={styles.avatar} referrerPolicy="no-referrer" />
              <span className={styles.userName}>{user.displayName?.split(" ")[0]}</span>
            </div>
          ) : (
            <button className={styles.googleBtn} onClick={login}>
              <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        <h1 className={styles.title}>CP<span>Lens</span></h1>
        <p className={styles.subtitle}>Find out exactly why you're stuck — and how to break through.</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Codeforces Handle</label>
            <input type="text" placeholder="e.g. tourist"
              value={form.codeforces} onChange={e => setForm({ ...form, codeforces: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>LeetCode Username</label>
            <input type="text" placeholder="e.g. neal_wu"
              value={form.leetcode} onChange={e => setForm({ ...form, leetcode: e.target.value })} />
          </div>
          <div className={styles.inputGroup}>
            <label>CodeChef Username</label>
            <input type="text" placeholder="e.g. gennady.korotkevich"
              value={form.codechef} onChange={e => setForm({ ...form, codechef: e.target.value })} />
          </div>
          <button type="submit">
            {user ? "Save & Analyze →" : "Analyze My Profile →"}
          </button>
        </form>

        {user && (
          <p className={styles.hint} style={{ color: "#22c55e" }}>
            ✓ Signed in — your handles will be saved for next time
          </p>
        )}
        {!user && (
          <p className={styles.hint}>
            <span style={{ color: "#64748b" }}>Sign in with Google to save your handles</span>
          </p>
        )}
        <p className={styles.hint}>
          or <a href="/compare" style={{ color: "#6366f1", textDecoration: "none" }}>compare two players →</a>
        </p>
      </div>
    </div>
  );
}
