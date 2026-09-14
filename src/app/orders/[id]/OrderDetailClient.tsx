"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    paid: "bg-blue-100 text-blue-800",
    in_production: "bg-orange-100 text-orange-800",
    shipped: "bg-violet-100 text-violet-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    paid: "Paid",
    in_production: "In Production",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
};

type Message = {
    id: string;
    sender_role: "admin" | "buyer";
    body: string;
    created_at: string;
};

type OrderItem = {
    id: string;
    quantity: number;
    price: number;
    product_variants: {
        size: number | null;
        length: number | null;
        products: { name: string } | null;
    } | null;
};

type Specs = { measurements: string; notes: string; created_at: string } | null;

type OrderData = {
    id: string;
    status: string;
    total: number;
    delivery_fee: number;
    placed_at: string;
    order_items: OrderItem[];
    custom_order_specs: Specs | Specs[] | null;
};

export default function OrderDetailClient({
    order,
    orderId,
}: {
    order: OrderData;
    orderId: string;
}) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const rawSpecs = order.custom_order_specs;
    const specs = rawSpecs
        ? (Array.isArray(rawSpecs) ? (rawSpecs[0] ?? null) : rawSpecs)
        : null;

    const grandTotal = Number(order.total) + Number(order.delivery_fee);
    const statusColor = STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600";
    const statusLabel = STATUS_LABELS[order.status] ?? order.status;

    useEffect(() => {
        if (specs) fetchMessages();
    }, [orderId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    async function fetchMessages() {
        const res = await fetch(`/api/orders/${orderId}/messages`);
        if (res.ok) {
            const data = await res.json();
            setMessages(data.messages ?? []);
        }
    }

    async function sendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setSending(true);
        const res = await fetch(`/api/orders/${orderId}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ body: newMessage.trim() }),
        });
        if (res.ok) {
            setNewMessage("");
            await fetchMessages();
        }
        setSending(false);
    }

    return (
        <div className="max-w-3xl mx-auto px-6 py-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <Link
                    href="/orders"
                    className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                        />
                    </svg>
                </Link>
                <div>
                    <p className="text-xs font-mono text-gray-400 tracking-widest">
                        {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                        {new Date(order.placed_at).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                <span
                    className={`ml-auto text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg ${statusColor}`}
                >
                    {statusLabel}
                </span>
            </div>

            <div className="space-y-4">
                {/* Order items */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                        Items
                    </div>
                    {order.order_items.map((item) => {
                        const variantLabel =
                            item.product_variants?.size != null
                                ? `UK ${item.product_variants.size}`
                                : item.product_variants?.length != null &&
                                  item.product_variants.length !== 0
                                ? `${item.product_variants.length}m`
                                : "";
                        return (
                            <div
                                key={item.id}
                                className="flex justify-between items-start px-4 py-3 border-b border-gray-100 last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">
                                        {item.product_variants?.products?.name ?? "Product"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {variantLabel ? `${variantLabel} · ` : ""}× {item.quantity}
                                    </p>
                                </div>
                                <p className="text-sm font-medium text-gray-900">
                                    £{(Number(item.price) * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        );
                    })}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-1">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Subtotal</span>
                            <span>£{Number(order.total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>Delivery</span>
                            <span>£{Number(order.delivery_fee).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-gray-900 pt-1 border-t border-gray-200 mt-1">
                            <span>Total</span>
                            <span>£{grandTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Custom specifications */}
                {specs && (
                    <div className="border border-violet-200 bg-violet-50 rounded-xl p-5">
                        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-4">
                            Your Custom Specifications
                        </p>
                        {specs.measurements && (
                            <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Measurements
                                </p>
                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                    {specs.measurements}
                                </p>
                            </div>
                        )}
                        {specs.notes && (
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Additional notes
                                </p>
                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                    {specs.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Messages — only for custom orders */}
                {specs && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Messages
                        </div>
                        <div className="p-4 space-y-3 min-h-[80px] max-h-96 overflow-y-auto">
                            {messages.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">
                                    No messages yet. Ask us anything about your order below.
                                </p>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${
                                            msg.sender_role === "buyer"
                                                ? "justify-end"
                                                : "justify-start"
                                        }`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                                                msg.sender_role === "buyer"
                                                    ? "bg-violet-800 text-white"
                                                    : "bg-gray-100 text-gray-800"
                                            }`}
                                        >
                                            <p className="text-sm">{msg.body}</p>
                                            <p
                                                className={`text-[10px] mt-1 ${
                                                    msg.sender_role === "buyer"
                                                        ? "text-violet-200"
                                                        : "text-gray-400"
                                                }`}
                                            >
                                                {msg.sender_role === "admin"
                                                    ? "AttireBeaut"
                                                    : "You"}{" "}
                                                ·{" "}
                                                {new Date(msg.created_at).toLocaleTimeString(
                                                    "en-GB",
                                                    { hour: "2-digit", minute: "2-digit" }
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form
                            onSubmit={sendMessage}
                            className="border-t border-gray-100 p-3 flex gap-2"
                        >
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Ask about your order..."
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="bg-violet-800 disabled:bg-violet-300 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
