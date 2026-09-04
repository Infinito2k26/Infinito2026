"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, MapPin, Search } from "lucide-react";

import PublicLayout from "@/components/layout/public-layout";
import PosterCard from "@/components/ui/poster-card";
import SportIcon from "@/components/ui/sport-icon";
import Input from "@/components/ui/input";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatFeeSummary } from "@/lib/format-event-fee";
import { findSportForEventName, SPORTS } from "@/lib/sports";
import type { EventSummary } from "@/lib/types/event";

import styles from "./events.module.css";

interface EventsListResponse {
    events: EventSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

type StatusFilter = "all" | "open" | "closed";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "closed", label: "Closed" },
];

export default function EventsPage() {
    const searchParams = useSearchParams();
    // /sports links here as ?sport=<id> — reuse the same name-substring match
    // findSportForEventName() uses elsewhere in this file, so a "Cricket"
    // click pre-fills the search box with "Cricket" instead of landing on
    // the full unfiltered list.
    const sportParam = searchParams.get("sport");
    const initialQuery = sportParam
        ? (SPORTS.find((s) => s.id === sportParam)?.name ?? "")
        : "";

    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [query, setQuery] = useState(initialQuery);
    const [status, setStatus] = useState<StatusFilter>("all");

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // ponytail: limit=100 covers a full fest catalogue with no pagination UI; add real paging if event count ever exceeds that.
            const res = await api.get("/events?limit=100");
            const data = res.data as EventsListResponse;
            setEvents(data.events ?? []);
        } catch (err) {
            console.error("Failed to load events", err);
            setError(err instanceof Error ? err.message : "Failed to load events.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, []);

    const visible = useMemo(() => {
        return events.filter((event) => {
            if (status === "open" && !event.registrationOpen) return false;
            if (status === "closed" && event.registrationOpen) return false;
            if (query && !event.name.toLowerCase().includes(query.toLowerCase())) return false;
            return true;
        });
    }, [events, status, query]);

    const resetFilters = () => {
        setQuery("");
        setStatus("all");
    };

    return (
        <PublicLayout>
            <header className={styles.header}>
                <p className="eyebrow">9–11 October, IIT Patna</p>
                <h1 className={`${styles.title} glow`}>Events</h1>
                <p className={styles.description}>
                    Every event open for entry this edition. Pick one, check the fee and slots, and
                    log in to register.
                </p>
                <p className={styles.description}>
                    Before you register, please read the{" "}
                    <a href="/registration-guidelines">Registration Guidelines</a>.
                </p>
            </header>

            <div className={styles.controls}>
                <div className={styles.search}>
                    <Search size={16} className={styles.searchIcon} aria-hidden="true" />
                    <Input
                        aria-label="Search events"
                        placeholder="Search events..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filterGroup} role="group" aria-label="Filter by registration status">
                    {STATUS_FILTERS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            className={`${styles.filter} ${status === value ? styles.filterActive : ""}`}
                            aria-pressed={status === value}
                            onClick={() => setStatus(value)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <SectionSpinner message="Loading events..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchEvents} />
            ) : visible.length === 0 ? (
                <EmptyState
                    title="These ruins are empty"
                    description={
                        events.length === 0
                            ? "Check back soon — the event schedule will be published shortly."
                            : "Nothing matches those filters. Try widening them."
                    }
                    action={events.length > 0 ? { label: "Clear filters", onClick: resetFilters } : undefined}
                />
            ) : (
                <div className={styles.grid}>
                    {visible.map((event, i) => {
                        const matched = findSportForEventName(event.name);
                        const date = new Date(event.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                        });

                        if (matched) {
                            return (
                                <PosterCard
                                    key={event.id}
                                    slug={matched.poster}
                                    name={event.name}
                                    category={event.sportCategory}
                                    format={formatFeeSummary(event)}
                                    date={date}
                                    href={`/dashboard/events/${event.slug}`}
                                    priority={i < 4}
                                />
                            );
                        }

                        return (
                            <a
                                key={event.id}
                                href={`/dashboard/events/${event.slug}`}
                                className={styles.fallbackCard}
                            >
                                <div className={styles.fallbackArt}>
                                    <SportIcon sport={event.name} size={40} />
                                </div>
                                <div className={styles.strip}>
                                    <span className={styles.fallbackName}>{event.name}</span>
                                    <div className={styles.fallbackMeta}>
                                        <span className={styles.fallbackDetail}>
                                            <CalendarDays size={13} /> {date}
                                        </span>
                                        {event.venue && (
                                            <span className={styles.fallbackDetail}>
                                                <MapPin size={13} /> {event.venue}
                                            </span>
                                        )}
                                    </div>
                                    <span className={styles.fallbackFee}>{formatFeeSummary(event)}</span>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </PublicLayout>
    );
}
