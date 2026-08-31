import React from 'react';
import Card from '@/components/ui/card';
import { Trophy, MousePointerClick, UserCheck } from 'lucide-react';
import styles from './leaderboard.module.css';

// ISR Configuration: Force Next.js to cache this page and refresh it in the background every 15 minutes.
// This is mandated by the hardening plan to survive traffic spikes.
export const revalidate = 900;

interface LeaderboardEntry {
    rank: number;
    id: string;
    name: string;
    college: string;
    totalPoints: number;
    clickCount: number;
    referralCount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/leaderboard/ca`, { next: { revalidate: 900 } });
        if (!response.ok) return [];
        const body = await response.json();
        return body?.data ?? [];
    } catch {
        // The API may be unreachable during build-time prerendering (e.g. CI, or a
        // cold deploy) — degrade to an empty board rather than failing the build.
        // The next ISR revalidation (15 min) will pick up real data once it's up.
        return [];
    }
}

export default async function PublicLeaderboardPage() {
    const data = await fetchLeaderboard();

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div className={styles.titleIcon}>
                        <Trophy size={32} className={styles.trophyMain} />
                    </div>
                    <h1 className={styles.title}>Infinito 2K26 Leaderboard</h1>
                    <p className={styles.subtitle}>
                        The top Campus Ambassadors driving the fest. Rankings are updated every 15 minutes.
                    </p>
                </header>

                <Card className={styles.tableCard}>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.thRank}>Rank</th>
                                    <th className={styles.thName}>Ambassador</th>
                                    <th className={styles.thMetrics}>
                                        <div className={styles.metricHeader}>
                                            <MousePointerClick size={14} /> Clicks
                                        </div>
                                    </th>
                                    <th className={styles.thMetrics}>
                                        <div className={styles.metricHeader}>
                                            <UserCheck size={14} /> Sign-ups
                                        </div>
                                    </th>
                                    <th className={styles.thPoints}>Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((entry) => (
                                    <tr key={entry.id} className={styles.row}>
                                        <td className={styles.tdRank}>
                                            <span className={`${styles.rankBadge} ${entry.rank <= 3 ? styles[`rank${entry.rank}`] : ''}`}>
                                                {entry.rank}
                                            </span>
                                        </td>
                                        <td className={styles.tdName}>
                                            <div className={styles.nameWrapper}>
                                                <span className={styles.ambassadorName}>{entry.name}</span>
                                                <span className={styles.collegeName}>{entry.college}</span>
                                            </div>
                                        </td>
                                        <td className={styles.tdMetrics}>{entry.clickCount}</td>
                                        <td className={styles.tdMetrics}>{entry.referralCount}</td>
                                        <td className={styles.tdPoints}>{entry.totalPoints}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {data.length === 0 && (
                        <div className={styles.emptyState}>
                            <p>No ambassadors on the board yet. Check back soon!</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}