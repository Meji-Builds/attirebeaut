"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  size: number | null;
  length: number | null;
  stock: number;
  price: number | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

export default function ProductDetail({
  product,
  variants,
  productPath,
  imageUrl,
}: {
  product: Product;
  variants: Variant[];
  productPath: string;
  imageUrl: string | null;
}) {
  const isOneSize = variants.length > 0 && variants.every((v) => v.length === 0);
  const [selected, setSelected] = useState<Variant | null>(isOneSize ? variants[0] : null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();
  const supabase = createClient();

  const usesSizes = variants.some((v) => v.size !== null);

  async function addToCart() {
    if (!selected) return;
    setBusy(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?redirect=${productPath}`);
      return;
    }
    addItem({
      variantId: selected.id,
      productId: product.id,
      name: product.name,
      price: selected.price ?? product.price,
      size: selected.size,
      length: selected.length,
      quantity: 1,
      imageUrl,
      stock: selected.stock,
    });
    setBusy(false);
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  }

  return (
    <div>
      {!isOneSize && (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
            {usesSizes ? "Select size (UK)" : "Select length (metres)"}
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {variants.map((v) => {
              const outOfStock = v.stock === 0;
              const isSelected = selected?.id === v.id;
              return (
                <button
                  key={v.id}
                  onClick={() => !outOfStock && setSelected(v)}
                  disabled={outOfStock}
                  className={`min-w-[3rem] h-10 px-3 text-sm font-medium border rounded-lg transition-colors ${
                    isSelected
                      ? "border-violet-800 bg-violet-800 text-white"
                      : outOfStock
                      ? "border-gray-200 text-gray-300 cursor-not-allowed line-through"
                      : "border-gray-300 text-gray-700 hover:border-violet-800 hover:text-violet-800"
                  }`}
                >
                  {usesSizes ? `UK ${v.size}` : `${v.length}m`}
                </button>
              );
            })}
          </div>
        </>
      )}

      {selected && (
        <p className="text-xs text-gray-500 mb-4">
          {selected.stock} in stock
          {selected.price != null && selected.price !== product.price && (
            <span className="ml-2 font-semibold text-gray-800">
              £{Number(selected.price).toFixed(2)}
            </span>
          )}
        </p>
      )}

      <button
        onClick={addToCart}
        disabled={!selected || busy || selected?.stock === 0}
        className={`w-full py-3.5 text-sm font-semibold rounded-lg transition-colors ${
          done
            ? "bg-green-700 text-white"
            : !selected
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-violet-800 text-white hover:bg-violet-900 active:scale-[0.99]"
        }`}
      >
        {busy ? "Adding..." : done ? "Added to cart" : !selected ? (isOneSize ? "Out of stock" : "Choose a size") : "Add to cart"}
      </button>
    </div>
  );
}
