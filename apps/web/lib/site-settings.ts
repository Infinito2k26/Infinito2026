"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

interface SiteSettings {
    upiVpa: string | null;
    upiPayeeName: string | null;
    paymentQrImageUrl: string | null;
}

/**
 * Payment details editable from /admin/settings (SiteSettings). Falls back to
 * the build-time NEXT_PUBLIC_UPI_* env vars when nothing's been set yet, so a
 * fresh deploy with no admin edit isn't blank.
 */
export function useSitePaymentSettings() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        api
            .get("/settings")
            .then((res) => setSettings(res.data))
            .catch(() => {
                // Settings are optional — the env-var fallback below covers it.
            });
    }, []);

    return {
        vpa: settings?.upiVpa || process.env.NEXT_PUBLIC_UPI_VPA || "",
        payeeName: settings?.upiPayeeName || process.env.NEXT_PUBLIC_UPI_PAYEE_NAME,
        qrImageUrl: settings?.paymentQrImageUrl || undefined,
    };
}
