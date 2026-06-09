import styles from "./WeakTags.module.css";

export default function WeakTags({ tags }) {
  return (
    <div className={styles.list}>
      {tags.map((t, i) => (
        <div key={i} className={styles.tag}>
          <span className={styles.name}>{t.tag}</span>
          <div className={styles.barWrap}>
            <div className={styles.bar} style={{ width: `${Math.round((t.accuracy ?? 0) * 100)}%` }} />
          </div>
          <span className={styles.pct}>{t.accuracy != null ? `${Math.round(t.accuracy * 100)}%` : "—"}</span>
        </div>
      ))}
    </div>
  );
}
