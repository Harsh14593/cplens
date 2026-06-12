import styles from "./PlatformCard.module.css";

export default function PlatformCard({ platform, color, stats, delta }) {
  return (
    <div className={styles.card} style={{ borderTopColor: color }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 className={styles.platform} style={{ color, margin: 0 }}>{platform}</h3>
        {delta !== null && delta !== undefined && (
          <span style={{ fontSize: 12, fontWeight: 700, color: delta >= 0 ? "#22c55e" : "#ef4444" }}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}
          </span>
        )}
      </div>
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
