"use client";

import { useEffect, useState } from "react";
import { CAHeroSection } from "@/components/ca/CAHeroSection";
import { CAApplicationForm } from "@/components/ca/CAApplicationForm";
import { PendingStateView } from "@/components/ca/PendingStateView";
import { RejectedStateView } from "@/components/ca/RejectedStateView";
import { api } from "@/lib/api";
import styles from "./apply.module.css";

interface CAApplication {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    rejectionReason: string | null;
    targetCollege: string;
}

export default function CAApplyPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [application, setApplication] = useState<CAApplication | null>(null);
    const [error, setError] = useState("");

    const fetchApplication = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/ca/apply/me');
            setApplication(res.data);
        } catch (err) {
            console.error("Failed to load application status", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplication();
    }, []);

    const handleApply = async (data: { targetCollege: string }) => {
        setIsSubmitting(true);
        setError("");

        try {
            await api.post('/ca/apply', data);
            await fetchApplication();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to submit application";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReapply = () => {
        setApplication(null);
    };

    if (isLoading) {
        return null;
    }

    if (application?.status === 'PENDING') {
        return (
            <div className={styles.page}>
                <CAHeroSection />
                <PendingStateView />
            </div>
        );
    }

    if (application?.status === 'REJECTED') {
        return (
            <div className={styles.page}>
                <CAHeroSection />
                <RejectedStateView
                    rejectionReason={application.rejectionReason}
                    onReapply={handleReapply}
                />
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <CAHeroSection />

            <div className={styles.formCard}>
                <h2 className={styles.formTitle}>Submit Your Application</h2>
                {error && (
                    <div className={styles.errorText}>{error}</div>
                )}
                <CAApplicationForm
                    onSubmit={handleApply}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}
