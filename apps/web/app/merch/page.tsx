"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PublicLayout from "@/components/layout/public-layout";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import { SectionSpinner } from "@/components/ui/section-spinner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/api";
import { useMerchCart } from "@/lib/merch-cart";
import styles from "./merch.module.css";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    sizesAvailable: string[];
    imageUrls: string[];
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: (size: string | undefined, quantity: number) => void }) {
    const [size, setSize] = useState<string | undefined>(product.sizesAvailable[0]);
    const [quantity, setQuantity] = useState(1);

    return (
        <Card className={styles.productCard}>
            <div className={styles.imageWrap}>
                {product.imageUrls[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.imageUrls[0]} alt={product.name} className={styles.image} />
                ) : (
                    <span className={styles.imageFallback}>{product.name}</span>
                )}
            </div>
            <p className={styles.productName}>{product.name}</p>
            <p className={styles.productPrice}>₹{Number(product.price)}</p>
            {product.description && <p className={styles.productDesc}>{product.description}</p>}

            {product.sizesAvailable.length > 0 && (
                <div className={styles.field}>
                    <label className={styles.label} htmlFor={`size-${product.id}`}>Size</label>
                    <select
                        id={`size-${product.id}`}
                        className={styles.select}
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                    >
                        {product.sizesAvailable.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            )}

            <div className={styles.qtyRow}>
                <label className={styles.label} htmlFor={`qty-${product.id}`}>Qty</label>
                <input
                    id={`qty-${product.id}`}
                    type="number"
                    min={1}
                    className={styles.qtyInput}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
            </div>

            <Button variant="primary" size="sm" onClick={() => onAdd(size, quantity)}>
                Add to cart
            </Button>
        </Card>
    );
}

export default function MerchPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const cart = useMerchCart();

    const fetchProducts = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.get("/merch/products");
            setProducts(res.data?.products ?? []);
        } catch (err) {
            console.error("Failed to load products", err);
            setError(err instanceof Error ? err.message : "Failed to load products.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <PublicLayout>
            <div className={styles.container}>
                <header className={styles.header}>
                    <div>
                        <h1 className={styles.pageTitle}>Merch</h1>
                        <p className={styles.pageSubtitle}>Official Infinito 2K26 merchandise.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/merch/checkout")}
                        disabled={cart.items.length === 0}
                    >
                        Cart ({cart.items.reduce((n, i) => n + i.quantity, 0)}) — ₹{cart.total}
                    </Button>
                </header>

                {isLoading ? (
                    <SectionSpinner message="Loading products..." />
                ) : error ? (
                    <ErrorState description={error} onRetry={fetchProducts} />
                ) : products.length === 0 ? (
                    <EmptyState title="No products yet" description="Check back soon." />
                ) : (
                    <div className={styles.grid}>
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAdd={(size, quantity) =>
                                    cart.addItem({
                                        productId: product.id,
                                        name: product.name,
                                        price: Number(product.price),
                                        size,
                                        quantity,
                                    })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </PublicLayout>
    );
}
