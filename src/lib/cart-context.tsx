"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type CartItem = {
    variantId: string;
    productId: string;
    name: string;
    price: number;
    size: number | null;
    length: number | null;
    quantity: number;
    imageUrl: string | null;
    stock: number;
    isCustom?: boolean;
};

type CartContextType = {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (variantId: string) => void;
    updateQuantity: (variantId: string, quantity: number) => void;
    clearCart: () => void; 
    isLoaded: boolean;
};

const CartContext = createContext<CartContextType | undefined> (undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem("cart");
        if(stored) setItems(JSON.parse(stored));
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if(!isLoaded) return;
        localStorage.setItem("cart", JSON.stringify(items) )
    }, [items, isLoaded]);


    function addItem(newItem: CartItem) {
        setItems((prev) => {
            const existing = prev.find((i) => i.variantId === newItem.variantId);
            if (existing) {
                const next = Math.min(existing.quantity + newItem.quantity, newItem.stock);
                return prev.map((i) =>
                    i.variantId === newItem.variantId ? { ...i, quantity: next, stock: newItem.stock } : i
                );
            }
            return [...prev, { ...newItem, quantity: Math.min(newItem.quantity, newItem.stock) }];
        });
    }

    function removeItem(variantId: string) {
        setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    }

    function updateQuantity(variantId: string, quantity: number) {
        setItems((prev) => 
            prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
        );
    }

    function clearCart(){
        setItems([]);
        localStorage.removeItem("cart");
    }

    return (
        <CartContext.Provider value={{items, addItem, isLoaded, removeItem, updateQuantity, clearCart}}>
            {children}
        </CartContext.Provider>
    )
}


export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within CartProvider");
    return context;
}