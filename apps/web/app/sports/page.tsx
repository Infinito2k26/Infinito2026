import type { Metadata } from "next";
import PublicLayout from "@/components/layout/public-layout";
import PageHead from "@/components/layout/page-head";
import SportsGrid from "@/components/sports/sports-grid";
import { SPORTS } from "@/lib/sports";
import page from "@/components/layout/page.module.css";

export const metadata: Metadata = {
    title: "Sports",
    description:
        "Every sport at Infinito 2026 — Ruins of Ragnarok. Team and individual events across boys, girls and open categories, 9–11 October at IIT Patna.",
};

export default function SportsPage() {
    return (
        <PublicLayout>
            <PageHead eyebrow="The battlefield awaits" title="Choose your sport">
                <p className={page.lede}>
                    Team and individual events across three categories. Pick your
                    ground, gather your side, and register before entries close.
                </p>
            </PageHead>

            <SportsGrid sports={SPORTS} />
        </PublicLayout>
    );
}
