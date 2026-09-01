"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import styles from "./admin-teams.module.css";

interface AdminTeam {
    id: string;
    name: string;
    collegeName: string;
    declaredSize: number;
    inviteCode: string;
    captain: { name: string; email: string };
    event: { name: string };
    participants: { id: string }[];
    registration: { status: string } | null;
}

export default function AdminTeamsPage() {
    const [teams, setTeams] = useState<AdminTeam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeams = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/teams");
            setTeams(res?.data?.teams ?? []);
        } catch (err) {
            console.error("Failed to load teams", err);
            setError(err instanceof Error ? err.message : "Failed to load teams.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeams();
    }, []);

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Teams</h1>
                <p className={styles.subtitle}>Every registered team across all events.</p>
            </div>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <SectionSpinner message="Loading teams..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchTeams} />
                ) : teams.length === 0 ? (
                    <p className={styles.emptyState}>No teams registered yet.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Team</th>
                                <th className={styles.headCell}>Event</th>
                                <th className={styles.headCell}>Captain</th>
                                <th className={styles.headCell}>College</th>
                                <th className={styles.headCell}>Roster</th>
                                <th className={styles.headCell}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teams.map((team) => (
                                <tr key={team.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>{team.name}</td>
                                    <td className={styles.cell}>{team.event.name}</td>
                                    <td className={styles.cell}>{team.captain.name} ({team.captain.email})</td>
                                    <td className={styles.cell}>{team.collegeName}</td>
                                    <td className={styles.cell}>{team.participants.length} / {team.declaredSize}</td>
                                    <td className={styles.cell}>
                                        <Badge variant={team.registration ? "success" : "default"}>
                                            {team.registration ? team.registration.status.replace("_", " ") : "Not registered"}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}
