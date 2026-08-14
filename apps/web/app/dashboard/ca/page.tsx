"use client";

import { useState, useEffect } from "react";
import ReferralCodeDisplay from "@/components/ca/ReferralCodeDisplay";
import StatCard from "@/components/ca/StatCard";
import LeaderboardWidget from "@/components/ca/LeaderboardWidget";
import { Users, Trophy, Target, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";

export default function CADashboardPage() {
    const router = useRouter();
    const [caData, setCaData] = useState({
        referralCode: "",
        referralCount: 0,
        targetCollege: "",
        rank: 0,
    });

    const handleLogout = async () => {
        try {
            await api.delete('/auth/logout');
        } catch (e) {
            console.error(e);
        } finally {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('infinito_token');
                router.push('/login');
            }
        }
    };

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.get('/auth/me');
                if (data && data.profile) {
                    setCaData({
                        referralCode: data.profile.referralCode || "",
                        referralCount: data.profile.referralCount || 0,
                        targetCollege: data.profile.targetCollege || "Not Assigned",
                        rank: data.profile.rank || 0,
                    });
                }
            } catch (error) {
                console.error("Failed to load profile:", error);
            }
        };
        fetchProfile();
    }, []);

    const shareUrl = `https://infinito.iitp.ac.in/register?ref=${caData.referralCode}`;

  // Smart Logic 1: The Copy Handler
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold tracking-tight">CA Portal</h1>
                <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center gap-2">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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