"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-team.module.css";

interface TeamMember {
    id: string;
    name: string;
    department: string;
    role: string | null;
    photoUrl: string | null;
    displayOrder: number;
}

const BLANK_FORM = { name: "", department: "", role: "", displayOrder: "0" };

export default function AdminTeamPage() {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [photo, setPhoto] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/team");
            const departments = res.data?.departments ?? [];
            setMembers(
                departments.flatMap((d: { members: TeamMember[] }) => d.members),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load team members.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const startEdit = (member: TeamMember) => {
        setEditingId(member.id);
        setForm({
            name: member.name,
            department: member.department,
            role: member.role ?? "",
            displayOrder: String(member.displayOrder),
        });
        setPhoto(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(BLANK_FORM);
        setPhoto(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.department.trim()) return;

        const body = new FormData();
        body.append("name", form.name.trim());
        body.append("department", form.department.trim());
        if (form.role.trim()) body.append("role", form.role.trim());
        body.append("displayOrder", form.displayOrder || "0");
        if (photo) body.append("photo", photo);

        setSubmitting(true);
        setApiError(null);
        try {
            if (editingId) {
                await api.patch(`/admin/team/${editingId}`, body);
            } else {
                await api.post("/admin/team", body);
            }
            cancelEdit();
            await fetchMembers();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to save team member.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this team member?")) return;
        try {
            await api.delete(`/admin/team/${id}`);
            await fetchMembers();
        } catch (err) {
            console.error("Failed to delete team member", err);
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Team</h1>
                <p className={styles.subtitle}>Manage the committee/team roster shown on /team.</p>
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
                            label="Department *"
                            value={form.department}
                            onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                            hint="e.g. Web Development"
                        />
                    </div>
                    <div className={styles.row}>
                        <Input
                            label="Role"
                            value={form.role}
                            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                        />
                        <Input
                            label="Display order"
                            type="number"
                            value={form.displayOrder}
                            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="photo">Photo</label>
                        <input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                        />
                    </div>

                    {apiError && <p className={styles.errorText}>{apiError}</p>}

                    <div className={styles.actions}>
                        {editingId && (
                            <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>
                        )}
                        <Button type="submit" variant="primary" loading={submitting}>
                            {editingId ? "Save changes" : "Add member"}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <SectionSpinner message="Loading team..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchMembers} />
                ) : members.length === 0 ? (
                    <p className={styles.emptyState}>No team members added yet.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Department</th>
                                <th className={styles.headCell}>Role</th>
                                <th className={styles.headCell}>Order</th>
                                <th className={styles.headCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>{member.name}</td>
                                    <td className={styles.cell}>{member.department}</td>
                                    <td className={styles.cell}>{member.role ?? "—"}</td>
                                    <td className={styles.cell}>{member.displayOrder}</td>
                                    <td className={styles.actionsCell}>
                                        <Button variant="outline" size="sm" onClick={() => startEdit(member)}>Edit</Button>
                                        <Button variant="outline" size="sm" onClick={() => handleDelete(member.id)}>Delete</Button>
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
