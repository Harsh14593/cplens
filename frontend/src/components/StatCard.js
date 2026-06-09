import styles from "./StatCard.module.css";

export default function StatCard({ label, value, color }) {
  return (
    <div className={styles.card}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value} style={{ color: color ?? "#e2e8f0" }}>{value}</span>
    </div>
  );
}
