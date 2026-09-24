import PublicLayout from "@/components/layout/public-layout";
import HomeContent, { type FestDates } from "@/components/home/home-content";
import AshEmbers from "@/components/home/ash-embers";
import { FEST_DATES } from "@/lib/sports";

// ON/OFF SWITCH — embers and ash drifting over the whole landing page
// (components/home/ash-embers.tsx). Set to false to turn them off; nothing is
// rendered and no animation runs. Visitors who ask for reduced motion never
// see them either way.
const ASH_EMBERS = true;

// SiteSettings' fest dates (admin-editable, /admin/settings) override the
// hardcoded FEST_DATES fallback once an admin sets them — see
// .claude/plans/local-admin-power-up-email-verification.md Phase 1.
async function getFestDates(): Promise<FestDates> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
    const res = await fetch(`${apiUrl}/settings`, { next: { revalidate: 60 } });
    if (!res.ok) return FEST_DATES;
    const json = await res.json();
    const data = json?.data;
    if (!data?.festStartAt) return FEST_DATES;
    return {
      start: data.festStartAt as string,
      label: (data.dateRangeLabel as string | null) || FEST_DATES.label,
    };
  } catch {
    return FEST_DATES;
  }
}

// The landing page is the one dark page — match the browser chrome to it.
export const viewport = {
  themeColor: "#0e0c0b",
  colorScheme: "dark",
};

export default async function Home() {
  const festDates = await getFestDates();

  return (
    <PublicLayout tone="dark">
      <HomeContent festDates={festDates} underNav />
      {ASH_EMBERS && <AshEmbers />}
    </PublicLayout>
  );
}
