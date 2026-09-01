import React from 'react';
import PublicLayout from '@/components/layout/public-layout';
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
    const podium = data.slice(0, 3);
    const rest = data.slice(3);
    // Visual order: 2nd, 1st, 3rd, so the top ambassador stands tallest in the centre.
    const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean) as LeaderboardEntry[];

    return (
        <PublicLayout>
            <div className={styles.pageWrapper}>
                <div className={styles.container}>
                    <header className={styles.header}>
                        <p className="eyebrow">The champions&apos; column</p>
                        <h1 className={`${styles.title} glow`}>Leaderboard</h1>
                        <p className={styles.subtitle}>
                            The top Campus Ambassadors driving Infinito 2026. Rankings update every 15
                            minutes.
                        </p>
                    </header>

                    {data.length === 0 ? (
                        <Card className={styles.tableCard}>
                            <div className={styles.emptyState}>
                                <p>No ambassadors on the board yet. Check back soon!</p>
                            </div>
                        </Card>
                    ) : (
                        <>
                            {podium.length > 0 && (
                                <div className={styles.podium}>
                                    {podiumOrder.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`${styles.podiumSpot} ${styles[`podiumRank${entry.rank}`] ?? ''}`}
                                        >
                                            {entry.rank === 1 && (
                                                <Trophy size={22} className={styles.podiumTrophy} aria-hidden="true" />
                                            )}
                                            <span className={styles.podiumRankNumber}>{entry.rank}</span>
                                            <span className={styles.podiumName}>{entry.name}</span>
                                            <span className={styles.podiumCollege}>{entry.college}</span>
                                            <span className={styles.podiumPoints}>{entry.totalPoints} pts</span>
                                            <div className={styles.podiumBase} aria-hidden="true" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {rest.length > 0 && (
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
                                                {rest.map((entry) => (
                                                    <tr key={entry.id} className={styles.row}>
                                                        <td className={styles.tdRank}>
                                                            <span className={styles.rankBadge}>{entry.rank}</span>
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
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PublicLayout>
    );
}
