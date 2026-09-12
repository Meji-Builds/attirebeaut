
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";

const REVENUE_STATUSES = ["paid", "shipped", "delivered"];

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("total, delivery_fee, placed_at, status")
    .in("status", REVENUE_STATUSES)
    .order("placed_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: `Could not fetch revenue: ${error.message}` },
      { status: 500 }
    );
  }

  // Group by calendar day (YYYY-MM-DD). Doing this in JS rather than
  // SQL's date_trunc keeps the query simple and lets you re-group by
  // week/month later without touching the database side at all.
  const byDay: Record<string, number> = {};

  for (const order of orders) {
    const day = order.placed_at.split("T")[0];
    const orderRevenue = Number(order.total) + Number(order.delivery_fee ?? 0);
    byDay[day] = (byDay[day] ?? 0) + orderRevenue;
  }

  const revenueByDay = Object.entries(byDay)
    .map(([day, total]) => ({ day, total }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const totalRevenue = revenueByDay.reduce((sum, d) => sum + d.total, 0);

  return NextResponse.json({ totalRevenue, revenueByDay });
}