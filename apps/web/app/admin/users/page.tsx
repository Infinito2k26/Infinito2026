"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/card";
import { api } from "@/lib/api";
import styles from "./admin-users.module.css";

type UserRole =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MODERATOR"
    | "VOLUNTEER"
    | "CAMPUS_AMBASSADOR"
    | "BRAND"
    | "PARTICIPANT";

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    college: string | null;
    isIITP: boolean;
    isEmailVerified: boolean;
    bannedAt: string | null;
    createdAt: string;
}

interface UsersListResponse {
    users: UserRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const ROLE_OPTIONS: { value: UserRole | ""; label: string }[] = [
    { value: "", label: "All roles" },
    { value: "SUPER_ADMIN", label: "Super Admin" },
    { value: "ADMIN", label: "Admin" },
    { value: "MODERATOR", label: "Moderator" },
    { value: "VOLUNTEER", label: "Volunteer" },
    { value: "CAMPUS_AMBASSADOR", label: "Campus Ambassador" },
    { value: "BRAND", label: "Brand" },
    { value: "PARTICIPANT", label: "Participant" },
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [pagination, setPagination] = useState<UsersListResponse["pagination"] | null>(null);
    const [search, setSearch] = useState("");
    const [role, setRole] = useState<UserRole | "">("");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handle = setTimeout(() => {
            const fetchUsers = async () => {
                setIsLoading(true);
                try {
                    const query = new URLSearchParams({ page: String(page), limit: "20" });
                    if (search.trim()) query.set("search", search.trim());
                    if (role) query.set("role", role);

                    const res = await api.get(`/admin/users?${query.toString()}`);
                    const data = res?.data as UsersListResponse | undefined;
                    setUsers(data?.users ?? []);
                    setPagination(data?.pagination ?? null);
                } catch (err) {
                    console.error("Failed to load users", err);
                } finally {
                    setIsLoading(false);
                }
            };

            fetchUsers();
        }, 300);

        return () => clearTimeout(handle);
    }, [search, role, page]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Users</h1>
                <p className={styles.pageSubtitle}>
                    Find any user by name, email, or college, and manage their role or status.
                </p>
            </div>

            <div className={styles.filterRow}>
                <input
                    className={styles.searchInput}
                    placeholder="Search by name, email, or college..."
                    value={search}
                    onChange={(e) => {
                        setPage(1);
                        setSearch(e.target.value);
                    }}
                />
                <select
                    className={styles.filterSelect}
                    value={role}
                    onChange={(e) => {
                        setPage(1);
                        setRole(e.target.value as UserRole | "");
                    }}
                >
                    {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <p className={styles.emptyState}>Loading users...</p>
                ) : users.length === 0 ? (
                    <p className={styles.emptyState}>No users found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Email</th>
                                <th className={styles.headCell}>Role</th>
                                <th className={styles.headCell}>College</th>
                                <th className={styles.headCell}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>
                                        <Link href={`/admin/users/${user.id}`} className={styles.nameLink}>
                                            {user.name}
                                        </Link>
                                    </td>
                                    <td className={styles.cell}>{user.email}</td>
                                    <td className={styles.cell}>{user.role.replace("_", " ")}</td>
                                    <td className={styles.cell}>{user.college ?? "—"}</td>
                                    <td className={styles.cell}>
                                        {user.bannedAt ? (
                                            <span className={`${styles.badge} ${styles.badgeBanned}`}>Banned</span>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Card>

            {pagination && pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Previous
                    </button>
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </span>
                    <button
                        type="button"
                        className={styles.pageBtn}
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
