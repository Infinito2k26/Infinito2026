"use client"

import styles from "./LeaderboardWidget.module.css";
interface LeaderboardEntry {
  rank: number;
  name: string;
  college: string;
  referrals: number;
}

interface LeaderboardWidgetProps {
  data?: Array<{ rank: number; name: string; college: string; referrals: number }>;
}
// Temporary local fixture used when no `data` prop is supplied.
// Replace with API data once backend integration is complete.
const MOCK_DATA: LeaderboardEntry[]=[
  { rank: 1, name: "Aditi Sharma", college: "IIT Bombay", referrals: 128 },
  { rank: 2, name: "Rohan Mehta", college: "BITS Pilani", referrals: 111 },
  { rank: 3, name: "Sneha Iyer", college: "NIT Trichy", referrals: 97 },
  { rank: 4, name: "Karan Patel", college: "VIT Vellore", referrals: 84 },
  { rank: 5, name: "Priya Nair", college: "Delhi University", referrals: 76 },
];

/**
 * Returns the appropriate list item class.
 * Mirrors the styling logic used for table rows.
 */
function getListItemClass(rank: number) {
  const base = styles.listItem ?? "";
  const modifier = styles[`listItem--rank-${rank}`] ?? "";

  return modifier ? `${base} ${modifier}` : base;
}

export default function LeaderboardWidget({ data }: LeaderboardWidgetProps) {
  const rows = data && data.length > 0 ? data : MOCK_DATA;

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Campus Ambassadors</h2>
        <p className={styles.subtitle}>Drive referrals and climb the leaderboard</p>
     </div>

      <ul className={styles.list}>
        {rows.map((entry) => (
          <li key={entry.rank} className={getListItemClass(entry.rank)}>
            <span className={styles.rankBadge}>
               {entry.rank}
             </span>
            <div className={styles.listInfo}>
              <span className={styles.name}>{entry.name}</span>
              <span className={styles.college}>{entry.college}</span>
            </div>
            <span className={styles.referrals}>{entry.referrals}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

