import { useEffect, useState } from "react";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    size?: string;
    quantity: number;
}

const STORAGE_KEY = "infinito_merch_cart";

function readCart(): CartItem[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
        return [];
    }
}

// ponytail: no backend cart entity or context provider — a cart only
// becomes real once POST /merch/orders is called (registration has no
// "draft" state either), and localStorage is read independently by
// whichever page mounts this hook, so no cross-page provider is needed.
export function useMerchCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setItems(readCart());
        setLoaded(true);
    }, []);

    useEffect(() => {
        if (!loaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // localStorage unavailable (private mode, etc.) — cart just won't persist.
        }
    }, [items, loaded]);

    const addItem = (item: CartItem) => {
        setItems((prev) => {
            const existingIndex = prev.findIndex(
                (i) => i.productId === item.productId && i.size === item.size,
            );
            if (existingIndex >= 0) {
                const next = [...prev];
                const existing = next[existingIndex] as CartItem;
                next[existingIndex] = { ...existing, quantity: existing.quantity + item.quantity };
                return next;
            }
            return [...prev, item];
        });
    };

    const updateQuantity = (productId: string, size: string | undefined, quantity: number) => {
        setItems((prev) =>
            quantity <= 0
                ? prev.filter((i) => !(i.productId === productId && i.size === size))
                : prev.map((i) =>
                      i.productId === productId && i.size === size ? { ...i, quantity } : i,
                  ),
        );
    };

    const removeItem = (productId: string, size?: string) => {
        setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
    };

    const clear = () => setItems([]);

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return { items, addItem, updateQuantity, removeItem, clear, total, loaded };
}
