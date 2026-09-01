"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/card";
import styles from "./admin-registrations.module.css";

type RegistrationStatus =
    | "PENDING_PAYMENT"
    | "CONFIRMED"
    | "WAITLISTED"
    | "CANCELLED"
    | "REFUNDED";

interface RegistrationRow {
    id: string;
    status: RegistrationStatus;
    isIITP: boolean;
    createdAt: string;
    event: { id: string; name: string };
    user: { id: string; name: string; email: string } | null;
    team: { id: string; name: string; captain: { name: string; email: string } } | null;
    payments: { id: string; status: string; amount: string }[];
}

interface RegistrationsListResponse {
    registrations: RegistrationRow[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_OPTIONS: { value: RegistrationStatus | ""; label: string }[] = [
    { value: "", label: "All statuses" },
    { value: "PENDING_PAYMENT", label: "Pending Payment" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "WAITLISTED", label: "Waitlisted" },
    { value: "CANCELLED", label: "Cancelled" },
    { value: "REFUNDED", label: "Refunded" },
];

function StatusBadge({ status }: { status: RegistrationStatus }) {
    const badgeClass = {
        CONFIRMED: styles.badgeConfirmed,
        PENDING_PAYMENT: styles.badgePending,
        WAITLISTED: styles.badgeWaitlisted,
        CANCELLED: styles.badgeCancelled,
        REFUNDED: styles.badgeRefunded,
    }[status];

    return <span className={`${styles.badge} ${badgeClass}`}>{status.replace("_", " ")}</span>;
}

function registrantLabel(row: RegistrationRow): string {
    if (row.user) {
        return `${row.user.name} (${row.user.email})`;
    }
    if (row.team) {
        return `${row.team.name} — captain ${row.team.captain.name}`;
    }
    return "Unknown registrant";
}

export default function AdminRegistrationsPage() {
    const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
    const [pagination, setPagination] = useState<RegistrationsListResponse["pagination"] | null>(null);
    const [status, setStatus] = useState<RegistrationStatus | "">("");
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRegistrations = async () => {
            setIsLoading(true);
            try {
                const query = new URLSearchParams({ page: String(page), limit: "20" });
                if (status) query.set("status", status);

                const res = await api.get(`/admin/registrations?${query.toString()}`);
                const data = res?.data as RegistrationsListResponse | undefined;
                setRegistrations(data?.registrations ?? []);
                setPagination(data?.pagination ?? null);
            } catch (err) {
                console.error("Failed to load registrations", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRegistrations();
    }, [status, page]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>Registrations</h1>
                <p className={styles.pageSubtitle}>
                    Every registration across all events, with live payment status.
                </p>
            </div>

            <div className={styles.filterRow}>
                <label htmlFor="status-filter" className={styles.filterLabel}>
                    Status
                </label>
                <select
                    id="status-filter"
                    className={styles.filterSelect}
                    value={status}
                    onChange={(e) => {
                        setPage(1);
                        setStatus(e.target.value as RegistrationStatus | "");
                    }}
                >
                    {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <p className={styles.emptyState}>Loading registrations...</p>
                ) : registrations.length === 0 ? (
                    <p className={styles.emptyState}>No registrations found.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Registered</th>
                                <th className={styles.headCell}>Event</th>
                                <th className={styles.headCell}>Registrant</th>
                                <th className={styles.headCell}>Status</th>
                                <th className={styles.headCell}>Payment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {registrations.map((row) => (
                                <tr key={row.id} className={styles.bodyRow}>
                                    <td className={styles.cellNowrap}>
                                        {new Date(row.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className={styles.cell}>{row.event.name}</td>
                                    <td className={styles.cell}>{registrantLabel(row)}</td>
                                    <td className={styles.cell}>
                                        <StatusBadge status={row.status} />
                                    </td>
                                    <td className={styles.cell}>
                                        {row.payments[0]?.status ?? "—"}
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
