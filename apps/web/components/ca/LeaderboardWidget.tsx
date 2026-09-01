"use client"

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { SectionSpinner } from "@/components/ui/section-spinner";
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
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/leaderboard/ca');
      setLeaderboard(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
      setError(err instanceof Error ? err.message : "Failed to load the leaderboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!data) {
        fetchLeaderboard();
    } else {
        setLeaderboard(data);
        setIsLoading(false);
    }
  }, [data]);

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Top Campus Ambassadors</h2>
        <p className={styles.subtitle}>Drive referrals and climb the leaderboard</p>
      </div>

      {isLoading ? (
        <SectionSpinner message="Loading leaderboard..." />
      ) : error ? (
        <ErrorState description={error} onRetry={fetchLeaderboard} />
      ) : leaderboard.length === 0 ? (
        <EmptyState title="No referrals yet" description="Be the first to climb the leaderboard." />
      ) : (
        <ul className={styles.list}>
        {leaderboard.map((entry) => (
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
      )}
    </div>
  )
}

