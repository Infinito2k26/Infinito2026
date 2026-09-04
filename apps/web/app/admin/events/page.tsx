"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import styles from "./admin-events.module.css";

interface AdminEvent {
    id: string;
    name: string;
    sportCategory: string;
    registrationType: string;
    isPublished: boolean;
    registrationOpen: boolean;
    capacity: number | null;
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<AdminEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchEvents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // ponytail: limit=100 covers a full fest catalogue with no pagination UI; add real paging if event count ever exceeds that.
            const res = await api.get("/admin/events?limit=100");
            setEvents(res?.data?.events ?? []);
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

    const togglePublish = async (event: AdminEvent) => {
        setBusyId(event.id);
        try {
            await api.patch(`/admin/events/${event.id}/publish`, { isPublished: !event.isPublished });
            await fetchEvents();
        } catch (err) {
            console.error("Failed to toggle publish state", err);
        } finally {
            setBusyId(null);
        }
    };

    const toggleRegistration = async (event: AdminEvent) => {
        setBusyId(event.id);
        try {
            await api.patch(`/admin/events/${event.id}`, { registrationOpen: !event.registrationOpen });
            await fetchEvents();
        } catch (err) {
            console.error("Failed to toggle registration state", err);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Events</h1>
                    <p className={styles.subtitle}>
                        Publish/registration toggles below — create a new event from a template or blank.
                    </p>
                </div>
                <Link href="/admin/events/new">
                    <Button variant="primary">+ Create Event</Button>
                </Link>
            </div>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <SectionSpinner message="Loading events..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchEvents} />
                ) : events.length === 0 ? (
                    <p className={styles.emptyState}>No events created yet.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Sport</th>
                                <th className={styles.headCell}>Type</th>
                                <th className={styles.headCell}>Published</th>
                                <th className={styles.headCell}>Registration</th>
                                <th className={styles.headCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((event) => (
                                <tr key={event.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>{event.name}</td>
                                    <td className={styles.cell}>{event.sportCategory}</td>
                                    <td className={styles.cell}>{event.registrationType}</td>
                                    <td className={styles.cell}>
                                        <Badge variant={event.isPublished ? "success" : "default"}>
                                            {event.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                    </td>
                                    <td className={styles.cell}>
                                        <Badge variant={event.registrationOpen ? "success" : "default"}>
                                            {event.registrationOpen ? "Open" : "Closed"}
                                        </Badge>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <Link href={`/admin/events/${event.id}/edit`}>
                                            <Button variant="outline" size="sm" className={styles.toggleBtn}>
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={styles.toggleBtn}
                                            disabled={busyId === event.id}
                                            onClick={() => togglePublish(event)}
                                        >
                                            {event.isPublished ? "Unpublish" : "Publish"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={styles.toggleBtn}
                                            disabled={busyId === event.id}
                                            onClick={() => toggleRegistration(event)}
                                        >
                                            {event.registrationOpen ? "Close Reg." : "Open Reg."}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );
}
