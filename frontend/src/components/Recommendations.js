import styles from "./Recommendations.module.css";

const PLATFORM_COLOR = { codeforces: "#6366f1", leetcode: "#f59e0b", codechef: "#22c55e" };

export default function Recommendations({ recommendations, title }) {
  if (!recommendations?.length) return null;

  return (
    <div className={styles.card}>
      <h2>{title ?? "Recommended Problems"}</h2>
      <p className={styles.subtitle}>Handpicked from your weak topics — solve these next</p>
      <div className={styles.list}>
        {recommendations.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noreferrer" className={styles.problem}>
            <div className={styles.left}>
              <span className={styles.tag} style={{ borderColor: PLATFORM_COLOR[p.platform] ?? "#4f46e5", color: PLATFORM_COLOR[p.platform] ?? "#a5b4fc" }}>
                {p.tag}
              </span>
              <span className={styles.name}>{p.name}</span>
            </div>
            <div className={styles.right}>
              <span className={styles.rating} style={{ color: ratingColor(p) }}>
                {p.difficulty ?? p.rating ?? ""}
              </span>
              <span className={styles.arrow}>→</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ratingColor(p) {
  if (p.difficulty === "Easy") return "#22c55e";
  if (p.difficulty === "Medium") return "#f59e0b";
  if (p.difficulty === "Hard") return "#ef4444";
  const r = p.rating;
  if (!r || typeof r !== "number") return "#94a3b8";
  if (r >= 2000) return "#ff8c00";
  if (r >= 1600) return "#0000ff";
  if (r >= 1400) return "#03a89e";
  if (r >= 1200) return "#008000";
  return "#808080";
}
