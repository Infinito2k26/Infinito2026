"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import styles from "./orders.module.css";

interface OrderItem {
    id: string;
    quantity: number;
    size: string | null;
    priceAtPurchase: string | number;
    product: { id: string; name: string };
}

interface MerchOrder {
    id: string;
    totalAmount: string | number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    PENDING_PAYMENT: "warning",
    CONFIRMED: "success",
    SHIPPED: "info",
    DELIVERED: "success",
    CANCELLED: "danger",
};

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<MerchOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/merch/orders/mine");
            setOrders(res.data?.orders ?? []);
        } catch (err) {
            console.error("Failed to load orders", err);
            setError(err instanceof Error ? err.message : "Failed to load orders.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.pageTitle}>My Orders</h1>
                <p className={styles.pageSubtitle}>Your merch order history.</p>
            </div>

            {isLoading ? (
                <SectionSpinner message="Loading orders..." />
            ) : error ? (
                <ErrorState description={error} onRetry={fetchOrders} />
            ) : orders.length === 0 ? (
                <EmptyState title="No orders yet" description="Visit the merch store to place your first order." />
            ) : (
                <div className={styles.list}>
                    {orders.map((order) => (
                        <Card key={order.id} className={styles.orderCard}>
                            <div className={styles.orderHeader}>
                                <span className={styles.orderDate}>
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                                <Badge variant={STATUS_VARIANT[order.status] ?? "default"}>
                                    {order.status.replace("_", " ")}
                                </Badge>
                            </div>
                            <ul className={styles.itemList}>
                                {order.items.map((item) => (
                                    <li key={item.id}>
                                        {item.product.name}
                                        {item.size ? ` (${item.size})` : ""} × {item.quantity}
                                    </li>
                                ))}
                            </ul>
                            <p className={styles.total}>Total: ₹{Number(order.totalAmount)}</p>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
