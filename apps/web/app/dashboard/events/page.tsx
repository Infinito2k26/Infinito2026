"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { formatFeeSummary } from "@/lib/format-event-fee";
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
                    {events.map((event) => (
                        <Link key={event.id} href={`/dashboard/events/${event.slug}`}>
                            <Card className={styles.eventCard}>
                                <div className={styles.cardHeader}>
                                    <span className={styles.categoryTag}>{event.sportCategory}</span>
                                    <Badge variant={event.registrationOpen ? "success" : "default"}>
                                        {event.registrationOpen ? "Registration Open" : "Closed"}
                                    </Badge>
                                </div>

                                <h2 className={styles.eventName}>{event.name}</h2>

                                <div className={styles.metaRow}>
                                    <CalendarDays size={14} />
                                    <span>
                                        {new Date(event.startDate).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>

                                {event.venue && (
                                    <div className={styles.metaRow}>
                                        <MapPin size={14} />
                                        <span>{event.venue}</span>
                                    </div>
                                )}

                                <div className={styles.feeRow}>{formatFeeSummary(event)}</div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
