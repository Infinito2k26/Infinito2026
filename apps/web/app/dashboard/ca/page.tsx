"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  ReferralCodeDisplay  from "@/components/ca/ReferralCodeDisplay";
import  StatCard  from "@/components/ca/StatCard";
import LeaderboardWidget from "@/components/ca/LeaderboardWidget";
import { Users, Trophy, Target } from "lucide-react";
import { api } from "@/lib/api";

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
                const data = await api.get('/ca/me');
                setCaData(data);
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
    <div className="max-w-5xl mx-auto space-y-8">
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Campus Ambassador Portal</h1>
        <p className="text-muted-foreground mt-2">
            Track your referrals, climb the leaderboard, and unlock your perks.
        </p>
        </div>

      {/* Top Row: The Action Center */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Passing the smart handlers down to the dumb UI */}
            <ReferralCodeDisplay
            code={caData.refCode}
            onCopy={handleCopyCode}
            onShare={handleShareLink}
          />
        </div>

        <div className="md:col-span-1">
            <StatCard
            title="Target College"
            value={caData.assignedCollegeName}
            icon={<Target className="h-5 w-5 text-gray-400" />}
            isTextValue={true}
          />
        </div>
        </div>

      {/* Middle Row: The Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard
            title="Total Referrals"
            value={caData.referralCount}
            icon={<Users className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
            title="Current Rank"
            value={caData.rank ? `#${caData.rank}` : '—'}
            icon={<Trophy className="h-5 w-5 text-yellow-500" />}
        />
        </div>

      {/* Bottom Row: The Competition */}
        <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Global Leaderboard</h2>
        {/* Pass an array of dummy leaderboard data down to the widget */}
        <LeaderboardWidget />
        </div>
    </div>
    );
}
