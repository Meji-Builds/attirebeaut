"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const { items, updateQuantity, removeItem, isLoaded } = useCart();

  // On load, remove any items whose product has been deleted
  useEffect(() => {
    if (!isLoaded || items.length === 0) return;
    const supabase = createClient();
    const variantIds = items.map((i) => i.variantId);
    supabase
      .from("product_variants")
      .select("id, products(is_deleted)")
      .in("id", variantIds)
      .then(({ data }) => {
        const validIds = new Set(
          (data ?? [])
            .filter((v) => {
              const p = v.products as { is_deleted: boolean } | null;
              return p && !p.is_deleted;
            })
            .map((v) => v.id)
        );
        items.forEach((item) => {
          if (!validIds.has(item.variantId)) removeItem(item.variantId);
        });
      });
  }, [isLoaded]);

  function handleDecrease(variantId: string, qty: number) {
    if (qty > 1) updateQuantity(variantId, qty - 1);
    else removeItem(variantId);
  }

  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  if (!isLoaded) return null;

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-7 h-7 text-gray-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z"
            />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
          Your cart is empty
        </h2>
        <p className="text-gray-500 text-sm mb-8">
          Browse our collection and find something you love.
        </p>
        <Link
          href="/"
          className="inline-block bg-violet-800 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-violet-900 transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 lg:px-8 py-10">
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-8">
        Your Cart
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 p-4 border border-gray-200 rounded-xl"
            >
              {/* Product image */}
              <div className="w-20 h-20 shrink-0 bg-gray-100 rounded-lg overflow-hidden relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-8 h-8 text-gray-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.size != null
                        ? `UK ${item.size}`
                        : item.length != null && item.length !== 0
                        ? `${item.length}m`
                        : ""}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 shrink-0">
                    £{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button
                      onClick={() =>
                        handleDecrease(item.variantId, item.quantity)
                      }
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                      </svg>
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-gray-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item.variantId, Math.min(item.quantity + 1, item.stock ?? Infinity))
                      }
                      disabled={item.stock != null && item.quantity >= item.stock}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
                {item.stock != null && item.quantity >= item.stock && (
                  <p className="text-[11px] text-pink-600 mt-2">Max stock reached</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div>
          <div className="border border-gray-200 rounded-xl p-6 sticky top-20">
            <h2 className="font-semibold text-gray-900 mb-4">Order summary</h2>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="shrink-0">
                    £{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Delivery calculated at checkout
              </p>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 mb-6">
              <div className="flex justify-between text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>£{subtotal.toFixed(2)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full text-center bg-violet-800 text-white text-sm font-semibold py-3.5 rounded-lg hover:bg-violet-900 transition-colors"
            >
              Proceed to checkout
            </Link>
            <Link
              href="/"
              className="block w-full text-center text-sm text-gray-500 hover:text-gray-700 mt-3 transition-colors"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
