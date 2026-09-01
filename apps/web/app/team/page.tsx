"use client";

import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";

import PublicLayout from "@/components/layout/public-layout";
import Card from "@/components/ui/card";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import styles from "./team.module.css";

interface TeamMember {
    id: string;
    name: string;
    role: string | null;
    photoUrl: string | null;
}

interface Department {
    department: string;
    members: TeamMember[];
}

export default function TeamPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTeam = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/team");
            setDepartments(res.data?.departments ?? []);
        } catch (err) {
            console.error("Failed to load team", err);
            setError(err instanceof Error ? err.message : "Failed to load the team.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTeam();
    }, []);

    return (
        <PublicLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>Team</h1>
                    <p className={styles.pageSubtitle}>
                        The people behind Infinito 2K26.
                    </p>
                </header>

                {isLoading ? (
                    <SectionSpinner message="Loading team..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchTeam} />
                ) : departments.length === 0 ? (
                    <EmptyState
                        title="Team not published yet"
                        description="Check back soon."
                    />
                ) : (
                    departments.map((dept) => (
                        <section key={dept.department} className={styles.section}>
                            <h2 className={styles.deptTitle}>{dept.department}</h2>
                            <div className={styles.grid}>
                                {dept.members.map((member) => (
                                    <Card key={member.id} className={styles.memberCard}>
                                        <div className={styles.photoWrap}>
                                            {member.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={member.photoUrl}
                                                    alt={member.name}
                                                    className={styles.photo}
                                                />
                                            ) : (
                                                <UserCircle size={40} className={styles.photoFallback} />
                                            )}
                                        </div>
                                        <p className={styles.memberName}>{member.name}</p>
                                        {member.role && <p className={styles.memberRole}>{member.role}</p>}
                                    </Card>
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </div>
        </PublicLayout>
    );
}
