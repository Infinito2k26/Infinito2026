"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { EVENT_TEMPLATES, type EventTemplate } from "@/lib/event-templates";
import styles from "./event-form.module.css";

function slugify(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export interface EventFormState {
    name: string;
    slug: string;
    broadCategory: EventTemplate["broadCategory"];
    sportCategory: string;
    description: string;
    pointOfContactName: string;
    pointOfContactPhone: string;
    registrationType: EventTemplate["registrationType"];
    genderCategory: EventTemplate["genderCategory"];
    teamSizeMin: string;
    teamSizeMax: string;
    maxSubstitutes: string;
    viceCaptainRequired: boolean;
    coachAllowed: boolean;
    feeStructure: EventTemplate["feeStructure"];
    feeFlat: string;
    feePerHead: string;
    feeMale: string;
    feeFemale: string;
    startDate: string;
    endDate: string;
    venue: string;
    hasAccommodation: boolean;
    accommodationRate: string;
    messOnlyRate: string;
    prizePool: string;
    capacity: string;
}

export const BLANK_EVENT_FORM: EventFormState = {
    name: "", slug: "", broadCategory: "OUTDOOR", sportCategory: "",
    description: "", pointOfContactName: "", pointOfContactPhone: "",
    registrationType: "TEAM", genderCategory: "OPEN",
    teamSizeMin: "", teamSizeMax: "", maxSubstitutes: "",
    viceCaptainRequired: false, coachAllowed: false,
    feeStructure: "FLAT", feeFlat: "", feePerHead: "", feeMale: "", feeFemale: "",
    startDate: "", endDate: "", venue: "",
    hasAccommodation: false, accommodationRate: "", messOnlyRate: "",
    prizePool: "", capacity: "",
};

function templateToForm(t: EventTemplate): EventFormState {
    return {
        name: t.name, slug: t.slug, broadCategory: t.broadCategory, sportCategory: t.sportCategory,
        description: t.description ?? "", pointOfContactName: t.pointOfContactName ?? "",
        pointOfContactPhone: t.pointOfContactPhone ?? "",
        registrationType: t.registrationType, genderCategory: t.genderCategory,
        teamSizeMin: t.teamSizeMin?.toString() ?? "", teamSizeMax: t.teamSizeMax?.toString() ?? "",
        maxSubstitutes: t.maxSubstitutes?.toString() ?? "",
        viceCaptainRequired: t.viceCaptainRequired ?? false, coachAllowed: t.coachAllowed ?? false,
        feeStructure: t.feeStructure, feeFlat: t.feeFlat?.toString() ?? "",
        feePerHead: t.feePerHead?.toString() ?? "", feeMale: t.feeMale?.toString() ?? "",
        feeFemale: t.feeFemale?.toString() ?? "",
        startDate: t.startDate, endDate: "", venue: t.venue ?? "",
        hasAccommodation: t.hasAccommodation ?? false, accommodationRate: t.accommodationRate?.toString() ?? "",
        messOnlyRate: "", prizePool: t.prizePool?.toString() ?? "", capacity: "",
    };
}

interface EventFormProps {
    mode: "create" | "edit";
    eventId?: string;
    initialForm?: EventFormState;
}

export default function EventForm({ mode, eventId, initialForm }: EventFormProps) {
    const router = useRouter();
    const [form, setForm] = useState<EventFormState>(initialForm ?? BLANK_EVENT_FORM);
    const [slugTouched, setSlugTouched] = useState(mode === "edit");
    const [templateIndex, setTemplateIndex] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const set = <K extends keyof EventFormState>(key: K, value: EventFormState[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    const applyTemplate = (indexStr: string) => {
        setTemplateIndex(indexStr);
        if (indexStr === "") {
            setForm(BLANK_EVENT_FORM);
            setSlugTouched(false);
            return;
        }
        const template = EVENT_TEMPLATES[Number(indexStr)];
        if (!template) return;
        setForm(templateToForm(template));
        setSlugTouched(true);
    };

    const onNameChange = (value: string) => {
        set("name", value);
        if (!slugTouched) set("slug", slugify(value));
    };

    const onSlugChange = (value: string) => {
        setSlugTouched(true);
        set("slug", value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};
        if (!form.name.trim()) nextErrors.name = "Required";
        if (!form.slug.trim()) nextErrors.slug = "Required";
        if (!form.sportCategory.trim()) nextErrors.sportCategory = "Required";
        if (!form.startDate) nextErrors.startDate = "Required";

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;

        const toNumber = (v: string) => (v.trim() === "" ? undefined : Number(v));

        const payload = {
            name: form.name.trim(),
            slug: form.slug.trim(),
            broadCategory: form.broadCategory,
            sportCategory: form.sportCategory.trim(),
            description: form.description.trim() || undefined,
            pointOfContactName: form.pointOfContactName.trim() || undefined,
            pointOfContactPhone: form.pointOfContactPhone.trim() || undefined,
            registrationType: form.registrationType,
            genderCategory: form.genderCategory,
            teamSizeMin: toNumber(form.teamSizeMin),
            teamSizeMax: toNumber(form.teamSizeMax),
            maxSubstitutes: toNumber(form.maxSubstitutes),
            viceCaptainRequired: form.registrationType === "TEAM" ? form.viceCaptainRequired : undefined,
            coachAllowed: form.registrationType === "TEAM" ? form.coachAllowed : undefined,
            feeStructure: form.feeStructure,
            feeFlat: form.feeStructure === "FLAT" ? toNumber(form.feeFlat) : undefined,
            feePerHead: form.feeStructure === "PER_HEAD" ? toNumber(form.feePerHead) : undefined,
            feeMale: form.feeStructure === "GENDER_BASED" ? toNumber(form.feeMale) : undefined,
            feeFemale: form.feeStructure === "GENDER_BASED" ? toNumber(form.feeFemale) : undefined,
            startDate: new Date(form.startDate).toISOString(),
            endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
            venue: form.venue.trim() || undefined,
            hasAccommodation: form.hasAccommodation,
            accommodationRate: form.hasAccommodation ? toNumber(form.accommodationRate) : undefined,
            messOnlyRate: form.hasAccommodation ? toNumber(form.messOnlyRate) : undefined,
            prizePool: toNumber(form.prizePool),
            capacity: toNumber(form.capacity),
        };

        setSubmitting(true);
        setApiError(null);
        try {
            if (mode === "edit") {
                await api.patch(`/admin/events/${eventId}`, payload);
            } else {
                await api.post("/admin/events", payload);
            }
            router.push("/admin/events");
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : `Failed to ${mode === "edit" ? "save" : "create"} event.`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card className={styles.formCard}>
            {mode === "create" && (
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="template">Start from a template</label>
                    <select
                        id="template"
                        className={styles.select}
                        value={templateIndex}
                        onChange={(e) => applyTemplate(e.target.value)}
                    >
                        <option value="">— Blank event —</option>
                        {EVENT_TEMPLATES.map((t, i) => (
                            <option key={t.slug} value={i}>{t.label}</option>
                        ))}
                    </select>
                </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.sectionTitle}>Identity</div>
                <Input label="Event name *" value={form.name} onChange={(e) => onNameChange(e.target.value)} error={errors.name} />
                <Input label="Slug *" value={form.slug} onChange={(e) => onSlugChange(e.target.value)} error={errors.slug} hint="Used in the public URL — /events/<slug>" />

                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="broadCategory">Broad category</label>
                        <select id="broadCategory" className={styles.select} value={form.broadCategory} onChange={(e) => set("broadCategory", e.target.value as EventFormState["broadCategory"])}>
                            <option value="OUTDOOR">Outdoor</option>
                            <option value="INDOOR">Indoor</option>
                            <option value="ESPORTS">Esports</option>
                            <option value="CULTURAL">Cultural</option>
                            <option value="TECHNICAL">Technical</option>
                        </select>
                    </div>
                    <Input label="Sport category *" value={form.sportCategory} onChange={(e) => set("sportCategory", e.target.value)} error={errors.sportCategory} className={styles.rowInput} />
                </div>

                <div className={styles.field}>
                    <label className={styles.label} htmlFor="description">Description</label>
                    <textarea id="description" className={styles.textarea} rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
                </div>

                <div className={styles.row}>
                    <Input label="Point of contact name" value={form.pointOfContactName} onChange={(e) => set("pointOfContactName", e.target.value)} />
                    <Input label="Point of contact phone" value={form.pointOfContactPhone} onChange={(e) => set("pointOfContactPhone", e.target.value)} />
                </div>

                <div className={styles.sectionTitle}>Registration</div>
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="registrationType">Registration type</label>
                        <select id="registrationType" className={styles.select} value={form.registrationType} onChange={(e) => set("registrationType", e.target.value as EventFormState["registrationType"])}>
                            <option value="TEAM">Team</option>
                            <option value="INDIVIDUAL">Individual</option>
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="genderCategory">Gender category</label>
                        <select id="genderCategory" className={styles.select} value={form.genderCategory} onChange={(e) => set("genderCategory", e.target.value as EventFormState["genderCategory"])}>
                            <option value="OPEN">Open</option>
                            <option value="MEN">Men</option>
                            <option value="WOMEN">Women</option>
                        </select>
                    </div>
                </div>

                {form.registrationType === "TEAM" && (
                    <>
                        <div className={styles.row}>
                            <Input label="Team size min" type="number" min={1} value={form.teamSizeMin} onChange={(e) => set("teamSizeMin", e.target.value)} />
                            <Input label="Team size max" type="number" min={1} value={form.teamSizeMax} onChange={(e) => set("teamSizeMax", e.target.value)} />
                            <Input label="Max substitutes" type="number" min={0} value={form.maxSubstitutes} onChange={(e) => set("maxSubstitutes", e.target.value)} />
                        </div>
                        <label className={styles.checkboxRow}>
                            <input type="checkbox" checked={form.viceCaptainRequired} onChange={(e) => set("viceCaptainRequired", e.target.checked)} />
                            Vice-captain required
                        </label>
                        <label className={styles.checkboxRow}>
                            <input type="checkbox" checked={form.coachAllowed} onChange={(e) => set("coachAllowed", e.target.checked)} />
                            Coach allowed
                        </label>
                    </>
                )}

                <div className={styles.sectionTitle}>Fee</div>
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="feeStructure">Fee structure</label>
                    <select id="feeStructure" className={styles.select} value={form.feeStructure} onChange={(e) => set("feeStructure", e.target.value as EventFormState["feeStructure"])}>
                        <option value="FLAT">Flat (per team / individual)</option>
                        <option value="PER_HEAD">Per head</option>
                        <option value="GENDER_BASED">Gender-based</option>
                    </select>
                </div>
                {form.feeStructure === "FLAT" && (
                    <Input label="Flat fee (₹)" type="number" min={0} value={form.feeFlat} onChange={(e) => set("feeFlat", e.target.value)} />
                )}
                {form.feeStructure === "PER_HEAD" && (
                    <Input label="Fee per head (₹)" type="number" min={0} value={form.feePerHead} onChange={(e) => set("feePerHead", e.target.value)} />
                )}
                {form.feeStructure === "GENDER_BASED" && (
                    <div className={styles.row}>
                        <Input label="Men's fee (₹)" type="number" min={0} value={form.feeMale} onChange={(e) => set("feeMale", e.target.value)} />
                        <Input label="Women's fee (₹)" type="number" min={0} value={form.feeFemale} onChange={(e) => set("feeFemale", e.target.value)} />
                    </div>
                )}

                <div className={styles.sectionTitle}>Schedule &amp; venue</div>
                <div className={styles.row}>
                    <Input label="Start date/time *" type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} error={errors.startDate} />
                    <Input label="End date/time" type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
                </div>
                <Input label="Venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} />

                <label className={styles.checkboxRow}>
                    <input type="checkbox" checked={form.hasAccommodation} onChange={(e) => set("hasAccommodation", e.target.checked)} />
                    Accommodation / mess-only add-ons available
                </label>
                {form.hasAccommodation && (
                    <div className={styles.row}>
                        <Input label="Accommodation rate (₹/day/head)" type="number" min={0} value={form.accommodationRate} onChange={(e) => set("accommodationRate", e.target.value)} />
                        <Input label="Mess-only rate (₹/day/head)" type="number" min={0} value={form.messOnlyRate} onChange={(e) => set("messOnlyRate", e.target.value)} />
                    </div>
                )}

                <div className={styles.sectionTitle}>Other</div>
                <div className={styles.row}>
                    <Input label="Prize pool (₹)" type="number" min={0} value={form.prizePool} onChange={(e) => set("prizePool", e.target.value)} />
                    <Input label="Capacity" type="number" min={0} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} hint="Leave blank for unlimited" />
                </div>

                {apiError && <p className={styles.errorText}>{apiError}</p>}

                <div className={styles.actions}>
                    <Button type="button" variant="outline" onClick={() => router.push("/admin/events")}>Cancel</Button>
                    <Button type="submit" variant="primary" loading={submitting}>
                        {mode === "edit" ? "Save changes" : "Create as draft"}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
