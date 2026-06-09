import styles from "./Insights.module.css";

export default function Insights({ insights }) {
  return (
    <div className={styles.box}>
      <h2 className={styles.title}>Key Insights</h2>
      <ul className={styles.list}>
        {insights.map((insight, i) => (
          <li key={i} className={styles.item}>
            <span className={styles.bullet}>→</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
