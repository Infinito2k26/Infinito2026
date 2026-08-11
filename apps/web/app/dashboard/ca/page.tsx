"use client";

import { useState } from "react";
import  ReferralCodeDisplay  from "@/components/ca/ReferralCodeDisplay";
import  StatCard  from "@/components/ca/StatCard";
import LeaderboardWidget from "@/components/ca/LeaderboardWidget";
import { Users, Trophy, Target } from "lucide-react";

export default function CADashboardPage() {
  // TODO: Replace with TanStack Query hook (e.g., const { data } = useCAProfile())
    const [caData] = useState({
    referralCode: "INF-2K26-ALIGARH",
    referralCount: 14,
    targetCollege: "AMU Aligarh",
    rank: 3,
    });

    const shareUrl = `https://infinito.iitp.ac.in/register?ref=${caData.referralCode}`;

  // Smart Logic 1: The Copy Handler
    const handleCopyCode = async () => {
    try {
        await navigator.clipboard.writeText(caData.referralCode);
      // TODO: Fire your toast notification here: "Code copied to clipboard!"
        console.log("Copied!");
    } catch (err) {
        console.error("Failed to copy", err);
    }
    };

  // Smart Logic 2: The Native Web Share API Handler
    const handleShareLink = async () => {
    if (navigator.share) {
        try {
        await navigator.share({
            title: "Join me at Infinito 2K26!",
            text: `Use my referral code ${caData.referralCode} to register for Eastern India's largest sports fest.`,
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
            code={caData.referralCode}
            onCopy={handleCopyCode}
            onShare={handleShareLink}
          />
        </div>
        
        <div className="md:col-span-1">
            <StatCard 
            title="Target College" 
            value={caData.targetCollege} 
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
            value={`#${caData.rank}`} 
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