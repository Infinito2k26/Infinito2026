"use client";

import { useEffect, useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import styles from "./rulebook-manager.module.css";

interface Rulebook {
    id: string;
    title: string;
    version: string | null;
    fileUrl: string;
}

export default function RulebookManager({ eventId }: { eventId: string }) {
    const [rulebooks, setRulebooks] = useState<Rulebook[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [title, setTitle] = useState("");
    const [version, setVersion] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const fetchRulebooks = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/admin/events/${eventId}/rulebooks`);
            setRulebooks(res.data?.rulebooks ?? []);
        } catch (err) {
            console.error("Failed to load rulebooks", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRulebooks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        if (!fileUrl.trim() && !file) {
            setFormError("Paste a link or choose a file to upload.");
            return;
        }
        if (fileUrl.trim() && file) {
            setFormError("Provide either a link or a file, not both.");
            return;
        }

        const body = new FormData();
        body.append("title", title.trim());
        if (version.trim()) body.append("version", version.trim());
        if (fileUrl.trim()) body.append("fileUrl", fileUrl.trim());
        if (file) body.append("file", file);

        setSubmitting(true);
        setFormError(null);
        try {
            await api.post(`/admin/events/${eventId}/rulebooks`, body);
            setTitle("");
            setVersion("");
            setFileUrl("");
            setFile(null);
            await fetchRulebooks();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "Failed to add rulebook.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this rulebook?")) return;
        try {
            await api.delete(`/admin/rulebooks/${id}`);
            await fetchRulebooks();
        } catch (err) {
            console.error("Failed to delete rulebook", err);
        }
    };

    return (
        <div className={styles.wrapper}>
            <h3 className={styles.heading}>Rulebooks</h3>

            {isLoading ? (
                <p className={styles.hint}>Loading...</p>
            ) : rulebooks.length === 0 ? (
                <p className={styles.hint}>No rulebooks attached yet.</p>
            ) : (
                <ul className={styles.list}>
                    {rulebooks.map((rb) => (
                        <li key={rb.id} className={styles.listItem}>
                            <a href={rb.fileUrl} target="_blank" rel="noopener noreferrer">
                                {rb.title}{rb.version ? ` (${rb.version})` : ""}
                            </a>
                            <Button variant="outline" size="sm" onClick={() => handleDelete(rb.id)}>
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.row}>
                    <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Input label="Version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1" />
                </div>
                <Input
                    label="Paste a link (e.g. Google Drive)"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    disabled={!!file}
                />
                <div className={styles.field}>
                    <label className={styles.label} htmlFor="rulebook-file">Or upload a PDF</label>
                    <input
                        id="rulebook-file"
                        type="file"
                        accept="application/pdf"
                        disabled={!!fileUrl.trim()}
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                </div>

                {formError && <p className={styles.errorText}>{formError}</p>}

                <Button type="submit" variant="outline" loading={submitting}>Add rulebook</Button>
            </form>
        </div>
    );
}
