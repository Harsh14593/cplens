import styles from "./PlatformCard.module.css";

export default function PlatformCard({ platform, color, stats }) {
  return (
    <div className={styles.card} style={{ borderTopColor: color }}>
      <h3 className={styles.platform} style={{ color }}>{platform}</h3>
      <div className={styles.stats}>
        {stats.map((s, i) => (
          <div key={i} className={styles.stat}>
            <span className={styles.label}>{s.label}</span>
            <span className={styles.value} style={{ color: s.color ?? "#e2e8f0" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
