import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect(`/login?redirect=/orders/${id}`);

    const { data: order } = await supabase
        .from("orders")
        .select(
            "id, status, total, delivery_fee, placed_at, order_items(id, quantity, price, product_variants(size, length, products(name))), custom_order_specs(measurements, notes, created_at)"
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!order) notFound();

    return <OrderDetailClient order={order as any} orderId={id} />;
}
