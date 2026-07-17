import React from 'react';
import Card from '@/components/ui/card';
import { Trophy, MousePointerClick, UserCheck } from 'lucide-react';
import styles from './leaderboard.module.css';

// ISR Configuration: Force Next.js to cache this page and refresh it in the background every 15 minutes.
// This is mandated by the hardening plan to survive traffic spikes.
export const revalidate = 900;

interface LeaderboardEntry {
    rank: number;
    ambassadorName: string;
    college: string;
    points: number;
    clicks: number;
    verifiedSignups: number;
}

// Mock data matching the GET /leaderboard/ca response shape
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
    { rank: 1, ambassadorName: "Rahul Sharma", college: "IIT Delhi", points: 2450, clicks: 840, verifiedSignups: 42 },
    { rank: 2, ambassadorName: "Priya Singh", college: "NIT Warangal", points: 2100, clicks: 610, verifiedSignups: 35 },
    { rank: 3, ambassadorName: "Aman Gupta", college: "BITS Pilani", points: 1950, clicks: 750, verifiedSignups: 28 },
    { rank: 4, ambassadorName: "Sneha Reddy", college: "VIT Vellore", points: 1600, clicks: 420, verifiedSignups: 21 },
    { rank: 5, ambassadorName: "Vikram Malhotra", college: "DTU", points: 1250, clicks: 315, verifiedSignups: 15 },
];

export default async function PublicLeaderboardPage() {
    // TODO: Replace with direct server-side fetch from the NestJS API
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/ca`, { next: { revalidate: 900 } });
    // const data = await response.json();
    const data = MOCK_LEADERBOARD;

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
                                    <tr key={entry.rank} className={styles.row}>
                                        <td className={styles.tdRank}>
                                            <span className={`${styles.rankBadge} ${entry.rank <= 3 ? styles[`rank${entry.rank}`] : ''}`}>
                                                {entry.rank}
                                            </span>
                                        </td>
                                        <td className={styles.tdName}>
                                            <div className={styles.nameWrapper}>
                                                <span className={styles.ambassadorName}>{entry.ambassadorName}</span>
                                                <span className={styles.collegeName}>{entry.college}</span>
                                            </div>
                                        </td>
                                        <td className={styles.tdMetrics}>{entry.clicks}</td>
                                        <td className={styles.tdMetrics}>{entry.verifiedSignups}</td>
                                        <td className={styles.tdPoints}>{entry.points}</td>
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