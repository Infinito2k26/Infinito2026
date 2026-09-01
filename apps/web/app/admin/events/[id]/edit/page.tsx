"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventForm, { type EventFormState } from "@/components/admin/event-form";
import RulebookManager from "@/components/admin/rulebook-manager";
import Card from "@/components/ui/card";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api } from "@/lib/api";
import styles from "../../new/new-event.module.css";

interface AdminEvent {
    name: string;
    slug: string;
    broadCategory: EventFormState["broadCategory"];
    sportCategory: string;
    description: string | null;
    pointOfContactName: string | null;
    pointOfContactPhone: string | null;
    registrationType: EventFormState["registrationType"];
    genderCategory: EventFormState["genderCategory"];
    teamSizeMin: number | null;
    teamSizeMax: number | null;
    maxSubstitutes: number | null;
    viceCaptainRequired: boolean;
    coachAllowed: boolean;
    feeStructure: EventFormState["feeStructure"];
    feeFlat: string | null;
    feePerHead: string | null;
    feeMale: string | null;
    feeFemale: string | null;
    startDate: string;
    endDate: string | null;
    venue: string | null;
    hasAccommodation: boolean;
    accommodationRate: string | null;
    messOnlyRate: string | null;
    prizePool: string | null;
    capacity: number | null;
}

// datetime-local needs "YYYY-MM-DDTHH:mm" in the viewer's local time — slicing
// the UTC ISO string directly would silently shift the displayed time by the
// timezone offset, so this reconstructs it from the Date's local components.
function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function eventToForm(event: AdminEvent): EventFormState {
    return {
        name: event.name,
        slug: event.slug,
        broadCategory: event.broadCategory,
        sportCategory: event.sportCategory,
        description: event.description ?? "",
        pointOfContactName: event.pointOfContactName ?? "",
        pointOfContactPhone: event.pointOfContactPhone ?? "",
        registrationType: event.registrationType,
        genderCategory: event.genderCategory,
        teamSizeMin: event.teamSizeMin?.toString() ?? "",
        teamSizeMax: event.teamSizeMax?.toString() ?? "",
        maxSubstitutes: event.maxSubstitutes?.toString() ?? "",
        viceCaptainRequired: event.viceCaptainRequired,
        coachAllowed: event.coachAllowed,
        feeStructure: event.feeStructure,
        feeFlat: event.feeFlat ?? "",
        feePerHead: event.feePerHead ?? "",
        feeMale: event.feeMale ?? "",
        feeFemale: event.feeFemale ?? "",
        startDate: toDatetimeLocal(event.startDate),
        endDate: event.endDate ? toDatetimeLocal(event.endDate) : "",
        venue: event.venue ?? "",
        hasAccommodation: event.hasAccommodation,
        accommodationRate: event.accommodationRate ?? "",
        messOnlyRate: event.messOnlyRate ?? "",
        prizePool: event.prizePool ?? "",
        capacity: event.capacity?.toString() ?? "",
    };
}

export default function EditEventPage() {
    const params = useParams<{ id: string }>();
    const [initialForm, setInitialForm] = useState<EventFormState | null>(null);
    const [eventName, setEventName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchEvent = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/events/${params.id}`);
            const event = res.data as AdminEvent;
            setEventName(event.name);
            setInitialForm(eventToForm(event));
        } catch (err) {
            console.error("Failed to load event", err);
            setError(err instanceof Error ? err.message : "Failed to load event.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEvent();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Edit Event</h1>
                <p className={styles.subtitle}>
                    {eventName || "Update the details below, then save."}
                </p>
            </div>

            {isLoading ? (
                <SectionSpinner message="Loading event..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchEvent} />
            ) : initialForm ? (
                <>
                    <EventForm mode="edit" eventId={params.id} initialForm={initialForm} />
                    <Card>
                        <RulebookManager eventId={params.id} />
                    </Card>
                </>
            ) : null}
        </div>
    );
}
