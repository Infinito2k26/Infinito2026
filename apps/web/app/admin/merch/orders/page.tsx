"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { api } from "@/lib/api";
import styles from "./admin-merch-orders.module.css";

interface OrderItem {
    id: string;
    quantity: number;
    size: string | null;
    product: { id: string; name: string };
}

interface AdminOrder {
    id: string;
    totalAmount: string | number;
    status: "PENDING_PAYMENT" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentStatus: "INITIATED" | "RECONCILIATION_PENDING" | "SUCCESS" | "FAILED";
    screenshotUrl: string | null;
    transactionId: string | null;
    rejectionReason: string | null;
    createdAt: string;
    user: { id: string; name: string; email: string };
    items: OrderItem[];
}

const STATUS_TABS = [
    { label: "Pending Payment", status: "PENDING_PAYMENT" },
    { label: "Confirmed", status: "CONFIRMED" },
    { label: "Shipped", status: "SHIPPED" },
    { label: "Delivered", status: "DELIVERED" },
    { label: "Cancelled", status: "CANCELLED" },
] as const;

function buyerLabel(user: AdminOrder["user"]): string {
    return `${user.name} (${user.email})`;
}

export default function AdminMerchOrdersPage() {
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<(typeof STATUS_TABS)[number]["status"]>("PENDING_PAYMENT");
    const [busyId, setBusyId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/admin/merch/orders?status=${statusFilter}`);
            setOrders(res?.data?.orders ?? []);
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const verify = async (orderId: string, status: "SUCCESS" | "FAILED", reason?: string) => {
        setBusyId(orderId);
        try {
            await api.patch(`/admin/merch/orders/${orderId}/verify`, { status, rejectionReason: reason });
            setRejectingId(null);
            setRejectionReason("");
            await fetchOrders();
        } catch (err) {
            console.error("Failed to verify order payment", err);
        } finally {
            setBusyId(null);
        }
    };

    const updateStatus = async (orderId: string, status: "SHIPPED" | "DELIVERED" | "CANCELLED") => {
        setBusyId(orderId);
        try {
            await api.patch(`/admin/merch/orders/${orderId}/status`, { status });
            await fetchOrders();
        } catch (err) {
            console.error("Failed to update order status", err);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Merch Orders</h1>
                <p className={styles.subtitle}>Review payments and fulfil orders.</p>
            </div>

            <div className={styles.tabRow}>
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab.status}
                        type="button"
                        className={statusFilter === tab.status ? styles.tabActive : styles.tab}
                        onClick={() => setStatusFilter(tab.status)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <p className={styles.emptyState}>Loading orders...</p>
            ) : orders.length === 0 ? (
                <p className={styles.emptyState}>No orders in this status.</p>
            ) : (
                <div className={styles.list}>
                    {orders.map((order) => (
                        <Card key={order.id} className={styles.orderCard}>
                            <div className={styles.cardTop}>
                                <span className={styles.buyer}>{buyerLabel(order.user)}</span>
                                <span className={styles.amount}>₹{Number(order.totalAmount)}</span>
                            </div>

                            <ul className={styles.itemList}>
                                {order.items.map((item) => (
                                    <li key={item.id}>
                                        {item.product.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}
                                    </li>
                                ))}
                            </ul>

                            {order.screenshotUrl && (
                                <a href={order.screenshotUrl} target="_blank" rel="noopener noreferrer" className={styles.screenshotLink}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={order.screenshotUrl} alt="Payment screenshot" className={styles.screenshotThumb} />
                                </a>
                            )}
                            {order.transactionId && (
                                <p className={styles.txn}>Transaction ID: {order.transactionId}</p>
                            )}
                            {order.rejectionReason && (
                                <p className={styles.rejection}><strong>Rejected:</strong> {order.rejectionReason}</p>
                            )}

                            {order.status === "PENDING_PAYMENT" && order.paymentStatus === "RECONCILIATION_PENDING" && (
                                rejectingId === order.id ? (
                                    <div className={styles.rejectForm}>
                                        <textarea
                                            className={styles.textarea}
                                            rows={2}
                                            placeholder="Reason for rejection..."
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                        />
                                        <div className={styles.actions}>
                                            <Button variant="outline" size="sm" onClick={() => setRejectingId(null)}>Cancel</Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={rejectionReason.trim().length < 5 || busyId === order.id}
                                                onClick={() => verify(order.id, "FAILED", rejectionReason.trim())}
                                            >
                                                Confirm Reject
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.actions}>
                                        <Button variant="outline" size="sm" disabled={busyId === order.id} onClick={() => setRejectingId(order.id)}>
                                            Reject
                                        </Button>
                                        <Button variant="primary" size="sm" loading={busyId === order.id} onClick={() => verify(order.id, "SUCCESS")}>
                                            Approve
                                        </Button>
                                    </div>
                                )
                            )}

                            {order.status === "CONFIRMED" && (
                                <div className={styles.actions}>
                                    <Button variant="outline" size="sm" disabled={busyId === order.id} onClick={() => updateStatus(order.id, "CANCELLED")}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" size="sm" loading={busyId === order.id} onClick={() => updateStatus(order.id, "SHIPPED")}>
                                        Mark Shipped
                                    </Button>
                                </div>
                            )}

                            {order.status === "SHIPPED" && (
                                <div className={styles.actions}>
                                    <Button variant="primary" size="sm" loading={busyId === order.id} onClick={() => updateStatus(order.id, "DELIVERED")}>
                                        Mark Delivered
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
