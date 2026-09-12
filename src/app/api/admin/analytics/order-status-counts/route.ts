
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("status");

  if (error) {
    return NextResponse.json(
      { error: `Could not fetch order counts: ${error.message}` },
      { status: 500 }
    );
  }

  const counts: Record<string, number> = {
    pending: 0,
    paid: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  for (const order of orders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
  }

  return NextResponse.json({ counts, totalOrders: orders.length });
}