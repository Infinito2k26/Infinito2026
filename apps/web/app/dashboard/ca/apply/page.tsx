"use client";

import { useEffect, useState } from "react";
import { CAHeroSection } from "@/components/ca/CAHeroSection";
import { CAApplicationForm } from "@/components/ca/CAApplicationForm";
import { PendingStateView } from "@/components/ca/PendingStateView";
import { RejectedStateView } from "@/components/ca/RejectedStateView";
import { api } from "@/lib/api";

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
            const data = await api.get('/ca/apply/me');
            setApplication(data);
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
            <div className="max-w-3xl mx-auto space-y-8">
                <CAHeroSection />
                <PendingStateView />
            </div>
        );
    }

    if (application?.status === 'REJECTED') {
        return (
            <div className="max-w-3xl mx-auto space-y-8">
                <CAHeroSection />
                <RejectedStateView
                    rejectionReason={application.rejectionReason}
                    onReapply={handleReapply}
                />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <CAHeroSection />

            <div className="bg-white/5 border border-white/10 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Submit Your Application</h2>
                {error && (
                    <div className="text-red-500 text-sm mb-4">{error}</div>
                )}
                <CAApplicationForm
                    onSubmit={handleApply}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}
