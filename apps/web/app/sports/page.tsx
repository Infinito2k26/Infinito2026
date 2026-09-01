import type { Metadata } from "next";
import PublicLayout from "@/components/layout/public-layout";
import SportsGrid from "@/components/sports/sports-grid";
import { SPORTS } from "@/lib/sports";
import styles from "./sports.module.css";

export const metadata: Metadata = {
    title: "Sports",
    description:
        "Every sport at Infinito 2026 — Ruins of Ragnarok. Team and individual events across boys, girls and open categories, 9–11 October at IIT Patna.",
};

export default function SportsPage() {
    return (
        <PublicLayout>
            <header className={styles.header}>
                <p className="eyebrow">The battlefield awaits</p>
                <h1 className={`${styles.title} glow`}>Choose your sport</h1>
                <p className={styles.description}>
                    Team and individual events across three categories. Pick your
                    ground, gather your side, and register before entries close.
                </p>
            </header>

            <SportsGrid sports={SPORTS} />
        </PublicLayout>
    );
}
