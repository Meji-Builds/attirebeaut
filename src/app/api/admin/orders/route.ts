
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "*, addresses(*), order_items(*, product_variants(*, products(name, image_url))), custom_order_specs(id)"
    )
    .order("placed_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: `Could not fetch orders: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ orders });
}