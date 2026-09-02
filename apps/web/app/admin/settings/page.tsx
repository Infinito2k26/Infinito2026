"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-settings.module.css";

interface SiteSettings {
    upiVpa: string | null;
    upiPayeeName: string | null;
    paymentQrImageUrl: string | null;
    festStartAt: string | null;
    festEndAt: string | null;
    registrationCloseAt: string | null;
    dateRangeLabel: string | null;
}

// <input type="datetime-local"> has no timezone of its own — it's read/written
// against the browser's local time. Every admin on this team is in IST, same
// as the fest, so that's an acceptable simplification here.
function toDatetimeLocal(iso: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [paymentForm, setPaymentForm] = useState({ upiVpa: "", upiPayeeName: "" });
    const [qrImage, setQrImage] = useState<File | null>(null);
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentSaved, setPaymentSaved] = useState(false);

    const [festForm, setFestForm] = useState({
        festStartAt: "",
        festEndAt: "",
        registrationCloseAt: "",
        dateRangeLabel: "",
    });
    const [festSubmitting, setFestSubmitting] = useState(false);
    const [festError, setFestError] = useState<string | null>(null);
    const [festSaved, setFestSaved] = useState(false);

    const fetchSettings = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/settings");
            const data: SiteSettings = res.data;
            setSettings(data);
            setPaymentForm({
                upiVpa: data.upiVpa ?? "",
                upiPayeeName: data.upiPayeeName ?? "",
            });
            setFestForm({
                festStartAt: toDatetimeLocal(data.festStartAt),
                festEndAt: toDatetimeLocal(data.festEndAt),
                registrationCloseAt: toDatetimeLocal(data.registrationCloseAt),
                dateRangeLabel: data.dateRangeLabel ?? "",
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load settings.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const body = new FormData();
        if (paymentForm.upiVpa.trim()) body.append("upiVpa", paymentForm.upiVpa.trim());
        if (paymentForm.upiPayeeName.trim()) body.append("upiPayeeName", paymentForm.upiPayeeName.trim());
        if (qrImage) body.append("qrImage", qrImage);

        setPaymentSubmitting(true);
        setPaymentError(null);
        setPaymentSaved(false);
        try {
            await api.patch("/admin/settings/payment", body);
            setQrImage(null);
            setPaymentSaved(true);
            await fetchSettings();
        } catch (err) {
            setPaymentError(err instanceof ApiError ? err.message : "Failed to save payment settings.");
        } finally {
            setPaymentSubmitting(false);
        }
    };

    const handleFestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFestSubmitting(true);
        setFestError(null);
        setFestSaved(false);
        try {
            await api.patch("/admin/settings/fest-dates", {
                festStartAt: festForm.festStartAt ? new Date(festForm.festStartAt).toISOString() : undefined,
                festEndAt: festForm.festEndAt ? new Date(festForm.festEndAt).toISOString() : undefined,
                registrationCloseAt: festForm.registrationCloseAt
                    ? new Date(festForm.registrationCloseAt).toISOString()
                    : undefined,
                dateRangeLabel: festForm.dateRangeLabel.trim() || undefined,
            });
            setFestSaved(true);
            await fetchSettings();
        } catch (err) {
            setFestError(err instanceof ApiError ? err.message : "Failed to save fest dates.");
        } finally {
            setFestSubmitting(false);
        }
    };

    if (isLoading) return <SectionSpinner />;
    if (error) return <ErrorState description={error} onRetry={fetchSettings} />;

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Site Settings</h1>
                <p className={styles.subtitle}>
                    Payment details and fest dates shown across the site — changes here go live immediately, no deploy needed.
                </p>
            </div>

            <Card className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Payment</h2>
                <form className={styles.form} onSubmit={handlePaymentSubmit}>
                    <div className={styles.row}>
                        <Input
                            label="UPI VPA"
                            value={paymentForm.upiVpa}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, upiVpa: e.target.value }))}
                            hint="e.g. infinito@upi"
                        />
                        <Input
                            label="Payee name"
                            value={paymentForm.upiPayeeName}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, upiPayeeName: e.target.value }))}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="qr-image">QR code image</label>
                        {settings?.paymentQrImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={settings.paymentQrImageUrl} alt="Current UPI QR code" className={styles.qrPreview} />
                        )}
                        <input
                            id="qr-image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setQrImage(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {paymentError && <p className={styles.errorText}>{paymentError}</p>}
                    {paymentSaved && !paymentError && <p className={styles.savedText}>Saved.</p>}

                    <div className={styles.actions}>
                        <Button type="submit" variant="primary" loading={paymentSubmitting}>
                            Save payment settings
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className={styles.formCard}>
                <h2 className={styles.sectionTitle}>Fest Dates</h2>
                <form className={styles.form} onSubmit={handleFestSubmit}>
                    <div className={styles.row}>
                        <Input
                            label="Fest start"
                            type="datetime-local"
                            value={festForm.festStartAt}
                            onChange={(e) => setFestForm((f) => ({ ...f, festStartAt: e.target.value }))}
                            hint="Drives the landing-page countdown"
                        />
                        <Input
                            label="Fest end"
                            type="datetime-local"
                            value={festForm.festEndAt}
                            onChange={(e) => setFestForm((f) => ({ ...f, festEndAt: e.target.value }))}
                        />
                    </div>
                    <div className={styles.row}>
                        <Input
                            label="Registration closes"
                            type="datetime-local"
                            value={festForm.registrationCloseAt}
                            onChange={(e) => setFestForm((f) => ({ ...f, registrationCloseAt: e.target.value }))}
                        />
                        <Input
                            label="Displayed date range"
                            value={festForm.dateRangeLabel}
                            onChange={(e) => setFestForm((f) => ({ ...f, dateRangeLabel: e.target.value }))}
                            hint="e.g. 9-11 October 2026"
                        />
                    </div>

                    {festError && <p className={styles.errorText}>{festError}</p>}
                    {festSaved && !festError && <p className={styles.savedText}>Saved.</p>}

                    <div className={styles.actions}>
                        <Button type="submit" variant="primary" loading={festSubmitting}>
                            Save fest dates
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
