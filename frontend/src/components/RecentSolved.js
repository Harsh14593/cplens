import styles from "./RecentSolved.module.css";

export default function RecentSolved({ problems }) {
  return (
    <ul className={styles.list}>
      {problems.map((p, i) => (
        <li key={i} className={styles.item}>
          <span className={styles.dot} />
          <a
            href={`https://leetcode.com/problems/${p.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className={styles.link}
          >
            {p}
          </a>
        </li>
      ))}
    </ul>
  );
}
