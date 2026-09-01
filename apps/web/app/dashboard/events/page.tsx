"use client";

import React, { useEffect, useState } from "react";
import { CalendarDays, MapPin } from "lucide-react";

import PosterCard from "@/components/ui/poster-card";
import SportIcon from "@/components/ui/sport-icon";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatFeeSummary } from "@/lib/format-event-fee";
import { findSportForEventName } from "@/lib/sports";
import type { EventSummary } from "@/lib/types/event";

import styles from "./events.module.css";

interface EventsListResponse {
    events: EventSummary[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function EventsPage() {
    const [events, setEvents] = useState<EventSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/events");
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

    if (isLoading) {
        return <SectionSpinner message="Loading events..." />;
    }

    if (error) {
        return <ErrorState description={error} onRetry={fetchEvents} />;
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.pageTitle}>Events</h1>
                <p className={styles.pageSubtitle}>
                    Discover and register for upcoming events and competitions.
                </p>
            </header>

            {events.length === 0 ? (
                <EmptyState
                    title="No events published yet"
                    description="Check back soon — the event schedule will be published shortly."
                />
            ) : (
                <div className={styles.grid}>
                    {events.map((event, i) => {
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
                                <div className={styles.fallbackStrip}>
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
                                    <div className={styles.fallbackFooter}>
                                        <Badge variant={event.registrationOpen ? "success" : "default"}>
                                            {event.registrationOpen ? "Open" : "Closed"}
                                        </Badge>
                                        <span className={styles.fallbackFee}>{formatFeeSummary(event)}</span>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
