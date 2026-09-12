"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

export default function ClearCartOnLoad() {
    const { clearCart } = useCart();

    useEffect(() => {
        clearCart();
        localStorage.removeItem("cart");
    }, []);
    return null;
}