"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-user-detail.module.css";

type UserRole =
    | "SUPER_ADMIN"
    | "ADMIN"
    | "MODERATOR"
    | "VOLUNTEER"
    | "CAMPUS_AMBASSADOR"
    | "BRAND"
    | "PARTICIPANT";

const ROLE_OPTIONS: UserRole[] = [
    "SUPER_ADMIN",
    "ADMIN",
    "MODERATOR",
    "VOLUNTEER",
    "CAMPUS_AMBASSADOR",
    "BRAND",
    "PARTICIPANT",
];

interface UserDetail {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    college: string | null;
    isIITP: boolean;
    isIITPVerified: boolean;
    isEmailVerified: boolean;
    bannedAt: string | null;
    brandId: string | null;
    createdAt: string;
    registrations: {
        id: string;
        status: string;
        createdAt: string;
        event: { id: string; name: string };
        payments: { id: string; status: string; amount: string }[];
    }[];
    captainedTeams: { id: string; name: string; eventId: string; collegeName: string }[];
    caProfile: { id: string; refCode: string; assignedCollegeName: string; referralCount: number; totalPoints: number } | null;
    caApplications: { id: string; targetCollege: string; status: string; createdAt: string }[];
    credentials: {
        id: string;
        scanCount: number;
        lastScannedAt: string | null;
        scanLogs: { id: string; gate: string; direction: string; result: string; createdAt: string }[];
    }[];
    merchOrders: { id: string; status: string; paymentStatus: string; totalAmount: string; createdAt: string }[];
}

export default function AdminUserDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [user, setUser] = useState<UserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedRole, setSelectedRole] = useState<UserRole | "">("");
    const [roleSubmitting, setRoleSubmitting] = useState(false);
    const [roleError, setRoleError] = useState<string | null>(null);

    const [statusSubmitting, setStatusSubmitting] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    const fetchUser = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/users/${params.id}`);
            const data: UserDetail = res.data;
            setUser(data);
            setSelectedRole(data.role);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load user.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.id]);

    const handleRoleSave = async () => {
        if (!user || !selectedRole || selectedRole === user.role) return;
        if (!confirm(`Change ${user.name}'s role to ${selectedRole}?`)) return;

        setRoleSubmitting(true);
        setRoleError(null);
        try {
            await api.patch(`/admin/users/${user.id}/role`, { role: selectedRole });
            await fetchUser();
        } catch (err) {
            setRoleError(err instanceof ApiError ? err.message : "Failed to change role.");
        } finally {
            setRoleSubmitting(false);
        }
    };

    const handleToggleBan = async () => {
        if (!user) return;
        const banning = !user.bannedAt;
        const verb = banning ? "Ban" : "Unban";
        if (!confirm(`${verb} ${user.name}? This immediately revokes their active session.`)) return;

        setStatusSubmitting(true);
        setStatusError(null);
        try {
            await api.patch(`/admin/users/${user.id}/status`, { banned: banning });
            await fetchUser();
        } catch (err) {
            setStatusError(err instanceof ApiError ? err.message : "Failed to update status.");
        } finally {
            setStatusSubmitting(false);
        }
    };

    if (isLoading) return <SectionSpinner />;
    if (error || !user) return <ErrorState description={error ?? "User not found."} onRetry={fetchUser} />;

    return (
        <div className={styles.page}>
            <button type="button" className={styles.backLink} onClick={() => router.push("/admin/users")}>
                ← Back to Users
            </button>

            <Card className={styles.summaryCard}>
                <div className={styles.summaryHead}>
                    <div>
                        <h1 className={styles.title}>{user.name}</h1>
                        <p className={styles.subtitle}>{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
                    </div>
                    {user.bannedAt ? (
                        <span className={`${styles.badge} ${styles.badgeBanned}`}>Banned</span>
                    ) : (
                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                    )}
                </div>

                <dl className={styles.factGrid}>
                    <div><dt>College</dt><dd>{user.college ?? "—"}</dd></div>
                    <div><dt>IITP verified</dt><dd>{user.isIITPVerified ? "Yes" : "No"}</dd></div>
                    <div><dt>Email verified</dt><dd>{user.isEmailVerified ? "Yes" : "No"}</dd></div>
                    <div><dt>Joined</dt><dd>{new Date(user.createdAt).toLocaleDateString()}</dd></div>
                    {user.brandId && <div><dt>Brand</dt><dd>{user.brandId}</dd></div>}
                </dl>

                <div className={styles.actionsRow}>
                    <div className={styles.roleAction}>
                        <label className={styles.label} htmlFor="role-select">Role</label>
                        <select
                            id="role-select"
                            className={styles.roleSelect}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        >
                            {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>{r.replace("_", " ")}</option>
                            ))}
                        </select>
                        <Button
                            variant="secondary"
                            size="sm"
                            loading={roleSubmitting}
                            disabled={selectedRole === user.role}
                            onClick={handleRoleSave}
                        >
                            Save role
                        </Button>
                    </div>
                    <Button
                        variant={user.bannedAt ? "primary" : "secondary"}
                        size="sm"
                        loading={statusSubmitting}
                        onClick={handleToggleBan}
                    >
                        {user.bannedAt ? "Unban user" : "Ban user"}
                    </Button>
                </div>
                {roleError && <p className={styles.errorText}>{roleError}</p>}
                {statusError && <p className={styles.errorText}>{statusError}</p>}
            </Card>

            <Card className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Registrations ({user.registrations.length})</h2>
                {user.registrations.length === 0 ? (
                    <p className={styles.emptyState}>No registrations.</p>
                ) : (
                    <ul className={styles.list}>
                        {user.registrations.map((reg) => (
                            <li key={reg.id} className={styles.listItem}>
                                <span>{reg.event.name}</span>
                                <span className={styles.listMeta}>{reg.status}</span>
                                <span className={styles.listMeta}>
                                    {reg.payments[0]?.status ?? "—"} · ₹{reg.payments[0]?.amount ?? "0"}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            {user.captainedTeams.length > 0 && (
                <Card className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Teams captained ({user.captainedTeams.length})</h2>
                    <ul className={styles.list}>
                        {user.captainedTeams.map((team) => (
                            <li key={team.id} className={styles.listItem}>
                                <span>{team.name}</span>
                                <span className={styles.listMeta}>{team.collegeName}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {(user.caProfile || user.caApplications.length > 0) && (
                <Card className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Campus Ambassador</h2>
                    {user.caProfile && (
                        <p className={styles.caSummary}>
                            {user.caProfile.refCode} — {user.caProfile.assignedCollegeName} ·{" "}
                            {user.caProfile.referralCount} referrals · {user.caProfile.totalPoints} points
                        </p>
                    )}
                    {user.caApplications.length > 0 && (
                        <ul className={styles.list}>
                            {user.caApplications.map((app) => (
                                <li key={app.id} className={styles.listItem}>
                                    <span>{app.targetCollege}</span>
                                    <span className={styles.listMeta}>{app.status}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            <Card className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>Credentials &amp; scans</h2>
                {user.credentials.length === 0 ? (
                    <p className={styles.emptyState}>No QR credential issued yet.</p>
                ) : (
                    user.credentials.map((cred) => (
                        <div key={cred.id} className={styles.credentialBlock}>
                            <p className={styles.listMeta}>
                                Scanned {cred.scanCount} time(s)
                                {cred.lastScannedAt ? ` · last ${new Date(cred.lastScannedAt).toLocaleString()}` : ""}
                            </p>
                            {cred.scanLogs.length > 0 && (
                                <ul className={styles.list}>
                                    {cred.scanLogs.map((log) => (
                                        <li key={log.id} className={styles.listItem}>
                                            <span>{log.gate} · {log.direction}</span>
                                            <span className={styles.listMeta}>
                                                {log.result} · {new Date(log.createdAt).toLocaleString()}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))
                )}
            </Card>

            {user.merchOrders.length > 0 && (
                <Card className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>Merch orders ({user.merchOrders.length})</h2>
                    <ul className={styles.list}>
                        {user.merchOrders.map((order) => (
                            <li key={order.id} className={styles.listItem}>
                                <span>₹{order.totalAmount}</span>
                                <span className={styles.listMeta}>{order.status} · {order.paymentStatus}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
        </div>
    );
}
