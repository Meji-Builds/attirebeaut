"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";


type AddToCartButtonProps = {
    variantId: string;
    productId: string;
    productName: string;
    price: number;
    size: number | null;
    length: number| null;
};


export default function AddToCartButton({
    variantId,
    productId,
    productName,
    price,
    size,
    length,
}: AddToCartButtonProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const pathname = usePathname();

    async function handleAddToCart() {

        const supabase = createClient();
        const { data: {user}  } = await supabase.auth.getUser();

        if(!user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        addItem({
            variantId,
            productId,
            name: productName,
            price,
            size,
            length,
            quantity: 1,
        });
    }

    return <button onClick={handleAddToCart}>Add to Cart</button>;
}

