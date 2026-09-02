"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Spinner from "@/components/ui/spinner";
import HomeContent, { type FestDates } from "@/components/home/home-content";
import { FEST_DATES } from "@/lib/sports";

// Landing tab for a logged-in standard user — the "Home" link in the sidebar
// (desktop) and bottom nav (mobile). Renders the same banner/content as the
// public "/" page (see apps/web/app/page.tsx) rather than bouncing straight
// to /dashboard/events, so there's an actual page to land on. Admins and
// campus ambassadors still get sent to their own areas.
export default function DashboardHome() {
  const router = useRouter();
  const [showHome, setShowHome] = useState(false);
  const [festDates, setFestDates] = useState<FestDates>(FEST_DATES);

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      try {
        const res = await api.get("/auth/me");
        const user = res.data;

        if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
          router.replace("/admin");
        } else if (user?.role === "CAMPUS_AMBASSADOR") {
          router.replace("/dashboard/ca");
        } else {
          setShowHome(true);
        }
      } catch {
        // Any error fetching profile indicates invalid session
        router.replace("/login");
      }
    };

    checkRoleAndRedirect();
  }, [router]);

  useEffect(() => {
    if (!showHome) return;
    api
      .get("/settings")
      .then((res) => {
        const data = res?.data;
        if (data?.festStartAt) {
          setFestDates({
            start: data.festStartAt,
            label: data.dateRangeLabel || FEST_DATES.label,
          });
        }
      })
      .catch(() => {
        // Keep the hardcoded fallback.
      });
  }, [showHome]);

  if (!showHome) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg-primary)",
        }}
      >
        <Spinner size="lg" />
      </div>
    );
  }

  return <HomeContent festDates={festDates} />;
}
