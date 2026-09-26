"use client";

import { useEffect, useState } from "react";

import PublicLayout from "@/components/layout/public-layout";
import PageHead from "@/components/layout/page-head";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import page from "@/components/layout/page.module.css";
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

// Until a photo is uploaded, the portrait shows the member's initials.
const initials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]!.toUpperCase())
        .join("");

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
            <PageHead eyebrow="Who runs it" title="Team">
                <p className={page.lede}>The people behind Infinito 2K26.</p>
            </PageHead>

            <div className={page.body}>
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
                            <h2 className={page.groupLabel}>{dept.department}</h2>
                            <ul className={styles.roster}>
                                {dept.members.map((member) => (
                                    <li key={member.id} className={styles.member}>
                                        <div className={styles.portrait}>
                                            {member.photoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={member.photoUrl}
                                                    alt={member.name}
                                                    className={styles.photo}
                                                />
                                            ) : (
                                                <span className={styles.initials} aria-hidden="true">
                                                    {initials(member.name)}
                                                </span>
                                            )}
                                        </div>
                                        <p className={styles.memberName}>{member.name}</p>
                                        {member.role && <p className={styles.memberRole}>{member.role}</p>}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </div>
        </PublicLayout>
    );
}
