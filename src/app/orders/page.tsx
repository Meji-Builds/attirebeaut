import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
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

type Order = {
  id: string;
  status: string;
  total: number;
  delivery_fee: number;
  placed_at: string;
  order_items: OrderItem[];
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, total, delivery_fee, placed_at, order_items(id, quantity, price, product_variants(size, length, products(name)))"
    )
    .eq("user_id", user.id)
    .order("placed_at", { ascending: false });

  const typedOrders = (orders ?? []) as unknown as Order[];

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">
          My Orders
        </h1>
        <p className="text-sm text-gray-500">{typedOrders.length} order{typedOrders.length !== 1 ? "s" : ""}</p>
      </div>

      {typedOrders.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm mb-4">
            You haven&apos;t placed any orders yet.
          </p>
          <Link href="/" className="text-sm text-violet-700 hover:underline">
            Browse the collection
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {typedOrders.map((order) => {
            const grandTotal = Number(order.total) + Number(order.delivery_fee);
            const statusColor = STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-600";
            const statusLabel = STATUS_LABELS[order.status] ?? order.status;

            return (
              <div
                key={order.id}
                className="border border-gray-200 rounded-xl p-5"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs font-mono text-gray-400 mb-0.5 tracking-widest">
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
                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg ${statusColor}`}
                    >
                      {statusLabel}
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      £{grandTotal.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1 border-t border-gray-100 pt-3">
                  {order.order_items.map((item) => {
                    const variantLabel =
                      item.product_variants?.size != null
                        ? `UK ${item.product_variants.size}`
                        : item.product_variants?.length != null
                        ? `${item.product_variants.length}m`
                        : "";
                    return (
                      <div key={item.id} className="flex justify-between text-sm text-gray-600">
                        <span>
                          {item.product_variants?.products?.name ?? "Product"}
                          {variantLabel ? ` — ${variantLabel}` : ""}
                          {" "}
                          <span className="text-gray-400">&times; {item.quantity}</span>
                        </span>
                        <span className="text-gray-700 font-medium shrink-0 ml-4">
                          £{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                  <span>Subtotal £{Number(order.total).toFixed(2)} + Delivery £{Number(order.delivery_fee).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
