
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";

const REVENUE_STATUSES = ["paid", "shipped", "delivered"];

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();

  // !inner forces the join to actually filter by the parent order's
  // status — without it, Supabase would return every order_item
  // regardless of its order's status, just with orders as null when
  // it didn't match.
  const { data: items, error } = await supabase
    .from("order_items")
    .select(
      "quantity, price, product_variants(product_id, products(name)), orders!inner(status)"
    )
    .in("orders.status", REVENUE_STATUSES);

  if (error) {
    return NextResponse.json(
      { error: `Could not fetch top products: ${error.message}` },
      { status: 500 }
    );
  }

  const byProduct: Record<string, { name: string; unitsSold: number; revenue: number }> = {};

  for (const item of items as any[]) {
    const productId = item.product_variants?.product_id;
    const productName = item.product_variants?.products?.name ?? "Unknown";
    if (!productId) continue;

    if (!byProduct[productId]) {
      byProduct[productId] = { name: productName, unitsSold: 0, revenue: 0 };
    }
    byProduct[productId].unitsSold += item.quantity;
    byProduct[productId].revenue += item.quantity * Number(item.price);
  }

  const topProducts = Object.entries(byProduct)
    .map(([productId, stats]) => ({ productId, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ topProducts });
}