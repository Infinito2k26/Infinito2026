"use client";

import { useEffect, useState } from "react";

import PublicLayout from "@/components/layout/public-layout";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import styles from "./gallery.module.css";

interface GalleryItem {
    id: string;
    imageUrl: string;
    caption: string | null;
}

export default function GalleryPage() {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGallery = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/gallery?limit=100");
            setItems(res.data?.items ?? []);
        } catch (err) {
            console.error("Failed to load gallery", err);
            setError(err instanceof Error ? err.message : "Failed to load the gallery.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    return (
        <PublicLayout>
            <header className={styles.header}>
                <p className="eyebrow">From the fest</p>
                <h1 className={`${styles.pageTitle} glow`}>Gallery</h1>
                <p className={styles.pageSubtitle}>
                    Moments from Infinito 2K26.
                </p>
            </header>

            {isLoading ? (
                <SectionSpinner message="Loading gallery..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchGallery} />
            ) : items.length === 0 ? (
                <EmptyState
                    title="No photos yet"
                    description="Check back once the fest is underway."
                />
            ) : (
                <div className={styles.grid}>
                    {items.map((item) => (
                        <figure key={item.id} className={styles.tile}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.imageUrl}
                                alt={item.caption ?? ""}
                                className={styles.image}
                            />
                            {item.caption && (
                                <figcaption className={styles.caption}>{item.caption}</figcaption>
                            )}
                        </figure>
                    ))}
                </div>
            )}
        </PublicLayout>
    );
}
