"use client";

import { useEffect, useState } from "react";

import PublicLayout from "@/components/layout/public-layout";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import styles from "./sponsors.module.css";

type SponsorTier = "TITLE" | "GOLD" | "SILVER" | "BRONZE" | "ASSOCIATE";

interface Sponsor {
    id: string;
    name: string;
    logoUrl: string | null;
    tier: SponsorTier;
}

const TIER_LABEL: Record<SponsorTier, string> = {
    TITLE: "Title Sponsor",
    GOLD: "Gold",
    SILVER: "Silver",
    BRONZE: "Bronze",
    ASSOCIATE: "Associate",
};

export default function SponsorsPage() {
    const [sponsors, setSponsors] = useState<Sponsor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSponsors = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/sponsors");
            setSponsors(res.data?.sponsors ?? []);
        } catch (err) {
            console.error("Failed to load sponsors", err);
            setError(err instanceof Error ? err.message : "Failed to load sponsors.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, []);

    return (
        <PublicLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1 className={styles.pageTitle}>Sponsors</h1>
                    <p className={styles.pageSubtitle}>
                        Infinito 2K26 is made possible by our sponsors.
                    </p>
                </header>

                {isLoading ? (
                    <SectionSpinner message="Loading sponsors..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchSponsors} />
                ) : sponsors.length === 0 ? (
                    <EmptyState
                        title="Sponsors coming soon"
                        description="Check back soon."
                    />
                ) : (
                    <div className={styles.grid}>
                        {sponsors.map((sponsor) => (
                            <Card key={sponsor.id} className={styles.sponsorCard}>
                                <Badge variant="info">{TIER_LABEL[sponsor.tier]}</Badge>
                                <div className={styles.logoWrap}>
                                    {sponsor.logoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={sponsor.logoUrl}
                                            alt={sponsor.name}
                                            className={styles.logo}
                                        />
                                    ) : (
                                        <span className={styles.logoFallback}>{sponsor.name}</span>
                                    )}
                                </div>
                                <p className={styles.sponsorName}>{sponsor.name}</p>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
