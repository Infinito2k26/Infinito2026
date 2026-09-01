"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  ReferralCodeDisplay  from "@/components/ca/ReferralCodeDisplay";
import  StatCard  from "@/components/ca/StatCard";
import LeaderboardWidget from "@/components/ca/LeaderboardWidget";
import { Users, Trophy, Target } from "lucide-react";
import { api } from "@/lib/api";
import styles from "./ca-dashboard.module.css";

interface CAProfile {
    refCode: string;
    referralCount: number;
    assignedCollegeName: string;
    rank: number | null;
}

export default function CADashboardPage() {
    const router = useRouter();
    const [caData, setCaData] = useState<CAProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/ca/me');
                setCaData(res.data);
            } catch (err: unknown) {
                const status = (err as { status?: number })?.status;
                if (status === 404) {
                    router.push('/dashboard/ca/onboard');
                    return;
                }
                console.error("Failed to load CA profile", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const shareUrl = caData ? `https://infinito.iitp.ac.in/register?ref=${caData.refCode}` : '';

  // Smart Logic 1: The Copy Handler
    const handleCopyCode = async () => {
    if (!caData) return;
    try {
        await navigator.clipboard.writeText(caData.refCode);
        console.log("Copied!");
    } catch (err) {
        console.error("Failed to copy", err);
    }
    };

  // Smart Logic 2: The Native Web Share API Handler
    const handleShareLink = async () => {
    if (!caData) return;
    if (navigator.share) {
        try {
        await navigator.share({
            title: "Join me at Infinito 2K26!",
            text: `Use my referral code ${caData.refCode} to register for Eastern India's largest sports fest.`,
            url: shareUrl,
        });
        } catch (err) {
        console.error("Share failed", err);
        }
    } else {
      // Fallback for desktop browsers that don't support native share
        await navigator.clipboard.writeText(shareUrl);
        console.log("Link copied as fallback!");
    }
    };

    if (isLoading) {
        return null;
    }

    if (!caData) {
        return null;
    }

    return (
    <div className={styles.page}>
        <div>
        <h1 className={styles.title}>Campus Ambassador Portal</h1>
        <p className={styles.subtitle}>
            Track your referrals, climb the leaderboard, and unlock your perks.
        </p>
        </div>

      {/* Top Row: The Action Center */}
        <div className={styles.actionRow}>
        <div className={styles.referralCol}>
          {/* Passing the smart handlers down to the dumb UI */}
            <ReferralCodeDisplay
            code={caData.refCode}
            onCopy={handleCopyCode}
            onShare={handleShareLink}
          />
        </div>

        <div>
            <StatCard
            title="Target College"
            value={caData.assignedCollegeName}
            icon={<Target size={20} />}
            isTextValue={true}
          />
        </div>
        </div>

      {/* Middle Row: The Metrics */}
        <div className={styles.metricsRow}>
        <StatCard
            title="Total Referrals"
            value={caData.referralCount}
            icon={<Users size={20} />}
        />
        <StatCard
            title="Current Rank"
            value={caData.rank ? `#${caData.rank}` : '—'}
            icon={<Trophy size={20} />}
        />
        </div>

      {/* Bottom Row: The Competition */}
        <div className={styles.leaderboardSection}>
        <h2 className={styles.leaderboardTitle}>Global Leaderboard</h2>
        <LeaderboardWidget />
        </div>
    </div>
    );
}
