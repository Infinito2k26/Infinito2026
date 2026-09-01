"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-sponsors.module.css";

type SponsorTier = "TITLE" | "GOLD" | "SILVER" | "BRONZE" | "ASSOCIATE";

interface Brand {
    id: string;
    name: string;
    logoUrl: string | null;
    tier: SponsorTier | null;
    isPubliclyListed: boolean;
}

const BLANK_FORM = { name: "", logoUrl: "", tier: "", isPubliclyListed: true };

export default function AdminSponsorsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchBrands = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/brands");
            setBrands(res.data ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sponsors.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const startEdit = (brand: Brand) => {
        setEditingId(brand.id);
        setForm({
            name: brand.name,
            logoUrl: brand.logoUrl ?? "",
            tier: brand.tier ?? "",
            isPubliclyListed: brand.isPubliclyListed,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(BLANK_FORM);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        const payload = {
            name: form.name.trim(),
            logoUrl: form.logoUrl.trim() || undefined,
            tier: form.tier || undefined,
            isPubliclyListed: form.isPubliclyListed,
        };

        setSubmitting(true);
        setApiError(null);
        try {
            if (editingId) {
                await api.patch(`/admin/brands/${editingId}`, payload);
            } else {
                await api.post("/admin/brands", payload);
            }
            cancelEdit();
            await fetchBrands();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to save sponsor.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Sponsors</h1>
                <p className={styles.subtitle}>
                    Set a tier and make a brand publicly listed to show it on /sponsors.
                </p>
            </div>

            <Card className={styles.formCard}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.row}>
                        <Input
                            label="Name *"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                        <Input
                            label="Logo URL"
                            value={form.logoUrl}
                            onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
                        />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="tier">Tier</label>
                            <select
                                id="tier"
                                className={styles.select}
                                value={form.tier}
                                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
                            >
                                <option value="">— Not a public sponsor —</option>
                                <option value="TITLE">Title</option>
                                <option value="GOLD">Gold</option>
                                <option value="SILVER">Silver</option>
                                <option value="BRONZE">Bronze</option>
                                <option value="ASSOCIATE">Associate</option>
                            </select>
                        </div>
                        <label className={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={form.isPubliclyListed}
                                onChange={(e) => setForm((f) => ({ ...f, isPubliclyListed: e.target.checked }))}
                            />
                            Publicly listed
                        </label>
                    </div>

                    {apiError && <p className={styles.errorText}>{apiError}</p>}

                    <div className={styles.actions}>
                        {editingId && (
                            <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        )}
                        <Button type="submit" variant="primary" loading={submitting}>
                            {editingId ? "Save changes" : "Add sponsor / brand"}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <SectionSpinner message="Loading sponsors..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchBrands} />
                ) : brands.length === 0 ? (
                    <p className={styles.emptyState}>No brands yet.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Tier</th>
                                <th className={styles.headCell}>Publicly listed</th>
                                <th className={styles.headCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {brands.map((brand) => (
                                <tr key={brand.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>{brand.name}</td>
                                    <td className={styles.cell}>{brand.tier ?? "—"}</td>
                                    <td className={styles.cell}>{brand.isPubliclyListed ? "Yes" : "No"}</td>
                                    <td className={styles.actionsCell}>
                                        <Button variant="outline" size="sm" onClick={() => startEdit(brand)}>Edit</Button>
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
