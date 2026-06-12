import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Home.module.css";

export default function Home() {
  const [handles, setHandles] = useState({ codeforces: "", leetcode: "", codechef: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!handles.codeforces && !handles.leetcode && !handles.codechef) return;
    setLoading(true);
    const params = new URLSearchParams(handles).toString();
    navigate(`/dashboard?${params}`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>CP<span>Lens</span></h1>
        <p className={styles.subtitle}>Find out exactly why you're stuck — and how to break through.</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Codeforces Handle</label>
            <input
              type="text"
              placeholder="e.g. tourist"
              value={handles.codeforces}
              onChange={(e) => setHandles({ ...handles, codeforces: e.target.value })}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>LeetCode Username</label>
            <input
              type="text"
              placeholder="e.g. neal_wu"
              value={handles.leetcode}
              onChange={(e) => setHandles({ ...handles, leetcode: e.target.value })}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>CodeChef Username</label>
            <input
              type="text"
              placeholder="e.g. gennady.korotkevich"
              value={handles.codechef}
              onChange={(e) => setHandles({ ...handles, codechef: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze My Profile →"}
          </button>
        </form>
        <p className={styles.hint}>Enter at least one handle to get started</p>
        <p className={styles.hint}>or <a href="/compare" style={{ color: "#6366f1", textDecoration: "none" }}>compare two players →</a></p>
      </div>
    </div>
  );
}
