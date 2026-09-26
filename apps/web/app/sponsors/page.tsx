"use client";

import { useEffect, useState } from "react";

import PublicLayout from "@/components/layout/public-layout";
import PageHead from "@/components/layout/page-head";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import page from "@/components/layout/page.module.css";
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
            <PageHead eyebrow="Made possible by" title="Sponsors">
                <p className={page.lede}>Infinito 2K26 is made possible by our sponsors.</p>
            </PageHead>

            <div className={page.body}>
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
                    <ul className={styles.grid}>
                        {sponsors.map((sponsor) => (
                            <li key={sponsor.id} className={styles.sponsor}>
                                <p
                                    className={`${styles.tier} ${sponsor.tier === "TITLE" ? styles.tierTitle : ""}`}
                                >
                                    {TIER_LABEL[sponsor.tier]}
                                </p>
                                <div className={styles.plate}>
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
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </PublicLayout>
    );
}
