"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/card";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api";
import styles from "./admin-merch-products.module.css";

interface Product {
    id: string;
    name: string;
    description: string | null;
    price: string | number;
    sizesAvailable: string[];
    inStock: boolean;
    isPublished: boolean;
    imageUrls: string[];
}

const BLANK_FORM = { name: "", description: "", price: "", sizesAvailable: "", inStock: true, imageUrls: "" };

export default function AdminMerchProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(BLANK_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            const res = await api.get("/admin/merch/products");
            setProducts(res.data?.products ?? []);
        } catch (err) {
            console.error("Failed to load products", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const startEdit = (product: Product) => {
        setEditingId(product.id);
        setForm({
            name: product.name,
            description: product.description ?? "",
            price: String(product.price),
            sizesAvailable: product.sizesAvailable.join(", "),
            inStock: product.inStock,
            // ponytail: no upload endpoint for product images yet — admin
            // pastes external URLs, mirroring how Brand.logoUrl works today.
            imageUrls: product.imageUrls.join(", "),
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(BLANK_FORM);
    };

    const togglePublish = async (product: Product) => {
        setBusyId(product.id);
        try {
            await api.patch(`/admin/merch/products/${product.id}/publish`, { isPublished: !product.isPublished });
            await fetchProducts();
        } catch (err) {
            console.error("Failed to toggle publish state", err);
        } finally {
            setBusyId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.price) return;

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            price: Number(form.price),
            sizesAvailable: form.sizesAvailable.split(",").map((s) => s.trim()).filter(Boolean),
            inStock: form.inStock,
            imageUrls: form.imageUrls.split(",").map((s) => s.trim()).filter(Boolean),
        };

        setSubmitting(true);
        setApiError(null);
        try {
            if (editingId) {
                await api.patch(`/admin/merch/products/${editingId}`, payload);
            } else {
                await api.post("/admin/merch/products", payload);
            }
            cancelEdit();
            await fetchProducts();
        } catch (err) {
            setApiError(err instanceof ApiError ? err.message : "Failed to save product.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.page}>
            <div>
                <h1 className={styles.title}>Merch Products</h1>
                <p className={styles.subtitle}>
                    New products start as drafts — publish them from the table below once they&apos;re ready for the storefront.
                </p>
            </div>

            <Card className={styles.formCard}>
                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.row}>
                        <Input label="Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                        <Input label="Price (₹) *" type="number" min={0} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            className={styles.textarea}
                            rows={2}
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                        />
                    </div>
                    <Input
                        label="Sizes"
                        value={form.sizesAvailable}
                        onChange={(e) => setForm((f) => ({ ...f, sizesAvailable: e.target.value }))}
                        hint="Comma-separated, e.g. S, M, L, XL — leave blank for one-size"
                    />
                    <Input
                        label="Image URLs"
                        value={form.imageUrls}
                        onChange={(e) => setForm((f) => ({ ...f, imageUrls: e.target.value }))}
                        hint="Comma-separated"
                    />
                    <label className={styles.checkboxRow}>
                        <input type="checkbox" checked={form.inStock} onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))} />
                        In stock
                    </label>

                    {apiError && <p className={styles.errorText}>{apiError}</p>}

                    <div className={styles.actions}>
                        {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
                        <Button type="submit" variant="primary" loading={submitting}>
                            {editingId ? "Save changes" : "Add as draft"}
                        </Button>
                    </div>
                </form>
            </Card>

            <Card className={styles.tableCard} padding="none">
                {isLoading ? (
                    <p className={styles.emptyState}>Loading products...</p>
                ) : products.length === 0 ? (
                    <p className={styles.emptyState}>No products yet.</p>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr className={styles.headRow}>
                                <th className={styles.headCell}>Name</th>
                                <th className={styles.headCell}>Price</th>
                                <th className={styles.headCell}>Sizes</th>
                                <th className={styles.headCell}>In stock</th>
                                <th className={styles.headCell}>Published</th>
                                <th className={styles.headCell}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className={styles.bodyRow}>
                                    <td className={styles.cell}>{product.name}</td>
                                    <td className={styles.cell}>₹{Number(product.price)}</td>
                                    <td className={styles.cell}>{product.sizesAvailable.join(", ") || "—"}</td>
                                    <td className={styles.cell}>{product.inStock ? "Yes" : "No"}</td>
                                    <td className={styles.cell}>
                                        <Badge variant={product.isPublished ? "success" : "default"}>
                                            {product.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                    </td>
                                    <td className={styles.actionsCell}>
                                        <Button variant="outline" size="sm" onClick={() => startEdit(product)}>Edit</Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={busyId === product.id}
                                            onClick={() => togglePublish(product)}
                                        >
                                            {product.isPublished ? "Unpublish" : "Publish"}
                                        </Button>
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
