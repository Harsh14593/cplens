import styles from "./Recommendations.module.css";

export default function Recommendations({ recommendations }) {
  if (!recommendations?.length) return null;

  return (
    <div className={styles.card}>
      <h2>Recommended Problems</h2>
      <p className={styles.subtitle}>Handpicked from your weak topics — solve these next</p>
      <div className={styles.list}>
        {recommendations.map((p, i) => (
          <a key={i} href={p.url} target="_blank" rel="noreferrer" className={styles.problem}>
            <div className={styles.left}>
              <span className={styles.tag}>{p.tag}</span>
              <span className={styles.name}>{p.name}</span>
            </div>
            <div className={styles.right}>
              <span className={styles.rating} style={{ color: ratingColor(p.rating) }}>
                {p.rating ?? "?"}
              </span>
              <span className={styles.arrow}>→</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

function ratingColor(r) {
  if (!r) return "#94a3b8";
  if (r >= 2000) return "#ff8c00";
  if (r >= 1600) return "#0000ff";
  if (r >= 1400) return "#03a89e";
  if (r >= 1200) return "#008000";
  return "#808080";
}
