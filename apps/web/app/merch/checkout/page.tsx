"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import UpiPaymentSection from "@/components/registration/UpiPaymentSection";
import { api, ApiError } from "@/lib/api";
import { useMerchCart } from "@/lib/merch-cart";
import styles from "./checkout.module.css";

interface MerchOrder {
    id: string;
    totalAmount: string | number;
}

export default function MerchCheckoutPage() {
    const router = useRouter();
    const cart = useMerchCart();

    const [shippingName, setShippingName] = useState("");
    const [shippingPhone, setShippingPhone] = useState("");
    const [shippingAddress, setShippingAddress] = useState("");
    const [shippingPincode, setShippingPincode] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [order, setOrder] = useState<MerchOrder | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingPincode.trim()) {
            return;
        }

        setSubmitting(true);
        setApiError(null);
        try {
            const res = await api.post("/merch/orders", {
                shippingName: shippingName.trim(),
                shippingPhone: shippingPhone.trim(),
                shippingAddress: shippingAddress.trim(),
                shippingPincode: shippingPincode.trim(),
                items: cart.items.map((i) => ({
                    productId: i.productId,
                    size: i.size,
                    quantity: i.quantity,
                })),
            });
            setOrder(res.data as MerchOrder);
            cart.clear();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to place order.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!cart.loaded) return null;

    if (!order && cart.items.length === 0) {
        return (
            <AuthGuard>
                <div className={styles.container}>
                    <Card className={styles.card}>
                        <p>Your cart is empty.</p>
                        <Button variant="primary" onClick={() => router.push("/merch")}>Browse Merch</Button>
                    </Card>
                </div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <div className={styles.container}>
                <Card className={styles.card}>
                    <h1 className={styles.title}>Checkout</h1>

                    {!order ? (
                        <>
                            <ul className={styles.cartList}>
                                {cart.items.map((item) => (
                                    <li key={`${item.productId}-${item.size ?? ""}`} className={styles.cartRow}>
                                        <span>{item.name}{item.size ? ` (${item.size})` : ""} × {item.quantity}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className={styles.total}>Total: ₹{cart.total}</p>

                            <form className={styles.form} onSubmit={handleSubmit}>
                                <Input label="Full name *" value={shippingName} onChange={(e) => setShippingName(e.target.value)} />
                                <Input label="Phone *" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} />
                                <Input label="Address *" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                                <Input label="Pincode *" value={shippingPincode} onChange={(e) => setShippingPincode(e.target.value)} />

                                {apiError && <p className={styles.errorText}>{apiError}</p>}

                                <Button type="submit" variant="primary" size="lg" loading={submitting}>
                                    Place order
                                </Button>
                            </form>
                        </>
                    ) : (
                        <UpiPaymentSection
                            amountDue={Number(order.totalAmount)}
                            vpa={process.env.NEXT_PUBLIC_UPI_VPA ?? ""}
                            payeeName={process.env.NEXT_PUBLIC_UPI_PAYEE_NAME}
                            onSubmit={(formData) => api.post(`/merch/orders/${order.id}/payment`, formData)}
                            onSubmitted={() => router.push("/dashboard/orders")}
                        />
                    )}
                </Card>
            </div>
        </AuthGuard>
    );
}
