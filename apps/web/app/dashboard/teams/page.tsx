"use client";

import React, { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import styles from "./teams.module.css";

interface MyTeam {
    id: string;
    name: string;
    declaredSize: number;
    inviteCode: string;
    event: { id: string; name: string; slug: string };
    participants: { id: string }[];
    registration: { id: string; status: string } | null;
}

export default function TeamsPage() {
    const [teams, setTeams] = useState<MyTeam[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeams = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get('/teams/mine');
            setTeams(res?.data ?? []);
        } catch (err) {
            console.error("Failed to load teams", err);
            setError(err instanceof Error ? err.message : "Failed to load your teams.");
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
                <p className={styles.subtitle}>
                    Teams you captain. Join one instead using the invite code your captain shared with you.
                </p>
            </div>

            {isLoading ? (
                <SectionSpinner message="Loading teams..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchTeams} />
            ) : teams.length === 0 ? (
                <EmptyState
                    title="No teams yet"
                    description="You haven't created any teams. Create one from an event's registration page."
                />
            ) : (
                <div className={styles.grid}>
                    {teams.map((team) => (
                        <Card key={team.id} className={styles.teamCard}>
                            <h2 className={styles.teamName}>{team.name}</h2>
                            <span className={styles.eventName}>{team.event.name}</span>

                            <div className={styles.metaRow}>
                                <span>{team.participants.length} / {team.declaredSize} roster spots filled</span>
                                <Badge variant={team.registration ? "success" : "default"}>
                                    {team.registration ? team.registration.status.replace('_', ' ') : "Not registered"}
                                </Badge>
                            </div>

                            <div className={styles.metaRow}>
                                <span>Invite code</span>
                                <span className={styles.inviteCode}>{team.inviteCode}</span>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
