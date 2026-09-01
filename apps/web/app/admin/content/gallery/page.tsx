"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-gallery.module.css";

interface GalleryItem {
    id: string;
    imageUrl: string;
    caption: string | null;
}

export default function AdminGalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [caption, setCaption] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchItems = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/gallery?limit=100");
            setItems(res.data?.items ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load gallery items.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image) return;

        const body = new FormData();
        if (caption.trim()) body.append("caption", caption.trim());
        body.append("image", image);

        setSubmitting(true);
        setApiError(null);
        try {
            await api.post("/admin/gallery", body);
            setCaption("");
            setImage(null);
            await fetchItems();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to add photo.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this photo?")) return;
        try {
            await api.delete(`/admin/gallery/${id}`);
            await fetchItems();
        } catch (err) {
            console.error("Failed to delete gallery item", err);
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Gallery</h1>
                <p className={styles.subtitle}>Manage the photos shown on /gallery.</p>
            </div>

            <Card className={styles.formCard}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <Input
                        label="Caption"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                    />
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="image">Photo *</label>
                        <input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {apiError && <p className={styles.errorText}>{apiError}</p>}

                    <div className={styles.actions}>
                        <Button type="submit" variant="primary" loading={submitting} disabled={!image}>
                            Add photo
                        </Button>
                    </div>
                </form>
            </Card>

            {isLoading ? (
                <SectionSpinner message="Loading gallery..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchItems} />
            ) : items.length === 0 ? (
                <p className={styles.emptyState}>No photos added yet.</p>
            ) : (
                <div className={styles.grid}>
                    {items.map((item) => (
                        <Card key={item.id} className={styles.tile} padding="sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.imageUrl} alt={item.caption ?? ""} className={styles.image} />
                            {item.caption && <p className={styles.caption}>{item.caption}</p>}
                            <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                                Delete
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
