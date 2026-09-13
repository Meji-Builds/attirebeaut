import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function fulfillOrder(supabase: SupabaseClient, orderId: string): Promise<boolean> {
    const { data: updated } = await supabase
        .from("orders")
        .update({ status: "paid" })
        .eq("id", orderId)
        .eq("status", "pending")
        .select("id");

    if (!updated?.length) return false;

    const { data: items } = await supabase
        .from("order_items")
        .select("product_variant_id, quantity")
        .eq("order_id", orderId);

    if (!items?.length) return true;

    for (const item of items) {
        const { data: variant } = await supabase
            .from("product_variants")
            .select("stock")
            .eq("id", item.product_variant_id)
            .single();

        if (variant) {
            await supabase
                .from("product_variants")
                .update({ stock: Math.max(0, variant.stock - item.quantity) })
                .eq("id", item.product_variant_id);
        }
    }

    revalidatePath("/orders");
    return true;
}
