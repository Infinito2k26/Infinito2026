"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { CalendarDays, FileText, MapPin, Phone, Trophy, Users } from "lucide-react";

import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import buttonStyles from "@/components/ui/button.module.css";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { NotFound } from "@/components/ui/not-found";
import { api, ApiError } from "@/lib/api";
import { formatFeeSummary } from "@/lib/format-event-fee";
import { findSportForEventName } from "@/lib/sports";
import type { EventDetail } from "@/lib/types/event";

import styles from "./event-detail.module.css";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function EventDetailPage() {
    const params = useParams<{ slug: string }>();
    const router = useRouter();

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [rulebooks, setRulebooks] = useState<{ id: string; title: string; version: string | null; fileUrl: string }[]>([]);

    const fetchEvent = async () => {
        setIsLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const res = await api.get(`/events/${params.slug}`);
            setEvent(res.data as EventDetail);
            api
                .get(`/events/${params.slug}/rulebooks`)
                .then((r) => setRulebooks(r.data?.rulebooks ?? []))
                .catch(() => setRulebooks([]));
        } catch (err) {
            if (err instanceof ApiError && err.status === 404) {
                setNotFound(true);
            } else {
                console.error("Failed to load event", err);
                setError(err instanceof Error ? err.message : "Failed to load event.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.slug]);

    if (isLoading) {
        return <SectionSpinner message="Loading event..." />;
    }

    if (notFound) {
        return <NotFound />;
    }

    if (error || !event) {
        return <ErrorState description={error ?? "Event not found."} onRetry={fetchEvent} />;
    }

    const poster = findSportForEventName(event.name);

    return (
        <div className={styles.container}>
            {poster && (
                <div className={styles.posterBanner}>
                    <Image
                        src={`/event-${poster.poster}.jpg`}
                        alt={`${event.name} at Infinito 2026 — Ruins of Ragnarok`}
                        width={1600}
                        height={2000}
                        sizes="(max-width: 768px) 100vw, 800px"
                        quality={78}
                        priority
                        className={styles.posterImage}
                    />
                </div>
            )}

            <Card className={styles.headerCard}>
                <div className={styles.headerTop}>
                    <span className={styles.categoryTag}>{event.sportCategory}</span>
                    <Badge variant={event.registrationOpen ? "success" : "default"}>
                        {event.registrationOpen ? "Registration Open" : "Registration Closed"}
                    </Badge>
                </div>

                <h1 className={styles.eventName}>{event.name}</h1>

                {event.description && <p className={styles.description}>{event.description}</p>}

                <div className={styles.metaGrid}>
                    <div className={styles.metaItem}>
                        <CalendarDays size={16} />
                        <span>
                            {formatDate(event.startDate)}
                            {event.endDate ? ` – ${formatDate(event.endDate)}` : ""}
                        </span>
                    </div>
                    {event.venue && (
                        <div className={styles.metaItem}>
                            <MapPin size={16} />
                            <span>{event.venue}</span>
                        </div>
                    )}
                    {event.registrationType === "TEAM" && (
                        <div className={styles.metaItem}>
                            <Users size={16} />
                            <span>
                                Team size: {event.teamSizeMin ?? "?"}–{event.teamSizeMax ?? "?"}
                            </span>
                        </div>
                    )}
                    {event.prizePool != null && Number(event.prizePool) > 0 && (
                        <div className={styles.metaItem}>
                            <Trophy size={16} />
                            <span>
                                Prize pool: {new Intl.NumberFormat("en-IN", {
                                    style: "currency",
                                    currency: "INR",
                                    maximumFractionDigits: 0,
                                }).format(Number(event.prizePool))}
                            </span>
                        </div>
                    )}
                    {(event.pointOfContactName || event.pointOfContactPhone) && (
                        <div className={styles.metaItem}>
                            <Phone size={16} />
                            <span>
                                POC: {event.pointOfContactName}
                                {event.pointOfContactName && event.pointOfContactPhone ? " · " : ""}
                                {event.pointOfContactPhone && (
                                    <a href={`tel:${event.pointOfContactPhone}`}>
                                        {event.pointOfContactPhone}
                                    </a>
                                )}
                            </span>
                        </div>
                    )}
                </div>

                <div className={styles.feeBanner}>
                    <span className={styles.feeLabel}>Registration fee</span>
                    <span className={styles.feeValue}>{formatFeeSummary(event)}</span>
                </div>

                {event.hasAccommodation && (
                    <p className={styles.accommodationNote}>
                        Accommodation and mess-only add-ons are available for this event.
                    </p>
                )}

                {rulebooks.length > 0 && (
                    <div className={styles.rulebookLinks}>
                        {rulebooks.map((rb) => (
                            <a
                                key={rb.id}
                                href={rb.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${buttonStyles.button} ${buttonStyles.outline} ${buttonStyles.lg} ${styles.rulebookBtn}`}
                            >
                                <FileText size={18} />
                                View Rulebook{rb.version ? ` (${rb.version})` : ""}
                            </a>
                        ))}
                    </div>
                )}

                <Button
                    variant="primary"
                    size="lg"
                    className={styles.registerBtn}
                    disabled={!event.registrationOpen}
                    onClick={() => router.push(`/dashboard/events/${event.slug}/register`)}
                >
                    {event.registrationOpen ? "Register" : "Registration Closed"}
                </Button>
            </Card>
        </div>
    );
}
