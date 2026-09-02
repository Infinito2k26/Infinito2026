"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-roles.module.css";

const SERVICES = [
    "EVENTS",
    "REGISTRATIONS",
    "PAYMENTS",
    "MERCH",
    "TEAMS",
    "CONTENT",
    "IDENTITY",
    "SETTINGS",
    "CA",
    "LEADS",
    "LEADERBOARD",
    "UPLOADS",
    "ADMIN_USERS",
] as const;

type AdminServiceKey = (typeof SERVICES)[number];

interface RolePermission {
    service: AdminServiceKey;
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
}

interface CustomRole {
    id: string;
    name: string;
    description: string | null;
    permissions: RolePermission[];
    _count: { users: number };
}

type PermissionState = Record<AdminServiceKey, { canRead: boolean; canWrite: boolean; canDelete: boolean }>;

const emptyPermissions = (): PermissionState =>
    Object.fromEntries(
        SERVICES.map((service) => [service, { canRead: false, canWrite: false, canDelete: false }])
    ) as PermissionState;

const permissionsToState = (permissions: RolePermission[]): PermissionState => {
    const state = emptyPermissions();
    for (const p of permissions) {
        state[p.service] = { canRead: p.canRead, canWrite: p.canWrite, canDelete: p.canDelete };
    }
    return state;
};

const stateToPermissions = (state: PermissionState): RolePermission[] =>
    SERVICES.map((service) => ({ service, ...state[service] }));

export default function AdminRolesPage() {
    const [roles, setRoles] = useState<CustomRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [permissions, setPermissions] = useState<PermissionState>(emptyPermissions());
    const [formError, setFormError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchRoles = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/roles");
            setRoles((res?.data as CustomRole[]) ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load roles.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const openCreateModal = () => {
        setEditingRole(null);
        setName("");
        setDescription("");
        setPermissions(emptyPermissions());
        setFormError(null);
        setModalOpen(true);
    };

    const openEditModal = (role: CustomRole) => {
        setEditingRole(role);
        setName(role.name);
        setDescription(role.description ?? "");
        setPermissions(permissionsToState(role.permissions));
        setFormError(null);
        setModalOpen(true);
    };

    const togglePermission = (service: AdminServiceKey, field: "canRead" | "canWrite" | "canDelete") => {
        setPermissions((prev) => ({
            ...prev,
            [service]: { ...prev[service], [field]: !prev[service][field] },
        }));
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            setFormError("Name is required.");
            return;
        }

        setSubmitting(true);
        setFormError(null);
        try {
            const payload = {
                name: name.trim(),
                description: description.trim() || undefined,
                permissions: stateToPermissions(permissions),
            };

            if (editingRole) {
                await api.patch(`/admin/roles/${editingRole.id}`, payload);
            } else {
                await api.post("/admin/roles", payload);
            }

            setModalOpen(false);
            await fetchRoles();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "Failed to save role.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editingRole) return;
        if (!confirm(`Delete the "${editingRole.name}" role? This cannot be undone.`)) return;

        setSubmitting(true);
        setFormError(null);
        try {
            await api.delete(`/admin/roles/${editingRole.id}`);
            setModalOpen(false);
            await fetchRoles();
        } catch (err) {
            setFormError(err instanceof ApiError ? err.message : "Failed to delete role.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <SectionSpinner />;
    if (error) return <ErrorState description={error} onRetry={fetchRoles} />;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerText}>
                    <h1 className={styles.pageTitle}>Roles</h1>
                    <p className={styles.pageSubtitle}>
                        Create scoped admin roles with read/write/delete access to specific services, then assign
                        them to users from their user detail page.
                    </p>
                </div>
                <Button variant="primary" size="sm" onClick={openCreateModal}>
                    New role
                </Button>
            </div>

            <Card className={styles.tableCard} padding="none">
                {roles.length === 0 ? (
                    <p className={styles.emptyState}>No custom roles yet. Create one to get started.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Services</th>
                                <th className={styles.headCell}>Users</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr key={role.id} className={styles.bodyRow} onClick={() => openEditModal(role)}>
                                    <td className={styles.cell}>
                                        <div className={styles.nameLink}>{role.name}</div>
                                        {role.description && (
                                            <div className={styles.description}>{role.description}</div>
                                        )}
                                    </td>
                                    <td className={styles.cell}>
                                        <div className={styles.serviceBadges}>
                                            {role.permissions
                                                .filter((p) => p.canRead || p.canWrite || p.canDelete)
                                                .map((p) => (
                                                    <span key={p.service} className={styles.serviceBadge}>
                                                        {p.service}
                                                    </span>
                                                ))}
                                        </div>
                                    </td>
                                    <td className={styles.cell}>{role._count.users}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingRole ? "Edit role" : "New role"}>
                <div className={styles.formGrid}>
                    <Input
                        label="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Registration Team"
                    />
                    <Input
                        label="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What this role is for"
                    />

                    <div>
                        <span className={styles.label}>Permissions</span>
                        <table className={styles.permissionTable}>
                            <thead>
                                <tr>
                                    <th>Service</th>
                                    <th>Read</th>
                                    <th>Write</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SERVICES.map((service) => (
                                    <tr key={service}>
                                        <td>{service}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={permissions[service].canRead}
                                                onChange={() => togglePermission(service, "canRead")}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={permissions[service].canWrite}
                                                onChange={() => togglePermission(service, "canWrite")}
                                            />
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={permissions[service].canDelete}
                                                onChange={() => togglePermission(service, "canDelete")}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {formError && <p className={styles.errorText}>{formError}</p>}

                    <div className={styles.modalActions}>
                        <div>
                            {editingRole && (
                                <Button variant="danger" size="sm" loading={submitting} onClick={handleDelete}>
                                    Delete role
                                </Button>
                            )}
                        </div>
                        <div className={styles.modalActionsRight}>
                            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" size="sm" loading={submitting} onClick={handleSubmit}>
                                {editingRole ? "Save changes" : "Create role"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
