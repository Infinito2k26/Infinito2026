"use client";

import { useMemo, useState } from "react";
import PosterCard from "@/components/ui/poster-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Sport, SportCategory, SportType } from "@/lib/sports";
import page from "@/components/layout/page.module.css";
import styles from "./sports-grid.module.css";

type TypeFilter = "all" | SportType;
type CategoryFilter = "all" | SportCategory;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All sports" },
    { value: "team", label: "Team" },
    { value: "individual", label: "Individual" },
];

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "Boys", label: "Boys" },
    { value: "Girls", label: "Girls" },
    { value: "Open", label: "Open" },
];

export default function SportsGrid({ sports }: { sports: Sport[] }) {
    const [type, setType] = useState<TypeFilter>("all");
    const [category, setCategory] = useState<CategoryFilter>("all");

    const visible = useMemo(
        () =>
            sports.filter(
                (s) =>
                    (type === "all" || s.type === type) &&
                    (category === "all" || s.category === category),
            ),
        [sports, type, category],
    );

    const reset = () => {
        setType("all");
        setCategory("all");
    };

    return (
        <section className={page.body}>
            <div className={page.toolbar}>
                <div className={page.chips} role="group" aria-label="Filter by format">
                    {TYPE_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            className={`${page.chip} ${type === value ? page.chipActive : ""}`}
                            aria-pressed={type === value}
                            onClick={() => setType(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className={page.chips} role="group" aria-label="Filter by category">
                    {CATEGORY_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            className={`${page.chip} ${category === value ? page.chipActive : ""}`}
                            aria-pressed={category === value}
                            onClick={() => setCategory(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            <p className={page.count} aria-live="polite">
                {visible.length} {visible.length === 1 ? "sport" : "sports"}
            </p>

            {visible.length === 0 ? (
                <EmptyState
                    title="No sports match that"
                    description="Nothing is being contested under those filters. Try widening them."
                    action={{ label: "Clear filters", onClick: reset }}
                />
            ) : (
                <div className={styles.grid}>
                    {visible.map((sport, i) => (
                        <PosterCard
                            key={sport.id}
                            slug={sport.poster}
                            name={sport.name}
                            category={sport.category}
                            format={sport.format}
                            href={`/events?sport=${sport.id}`}
                            priority={i < 4}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
