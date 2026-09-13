
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["in_production", "shipped", "cancelled"],
  in_production: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "*, addresses(*), order_items(*, product_variants(*, products(name, image_url))), custom_order_specs(*)"
    )
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();
  const body = await request.json();
  const newStatus = body.status as string;

  if (!newStatus) {
    return NextResponse.json({ error: "Missing status" }, { status: 400 });
  }

  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const allowedNext = ALLOWED_TRANSITIONS[currentOrder.status] ?? [];

  if (!allowedNext.includes(newStatus)) {
    return NextResponse.json(
      {
        error: `Cannot change status from "${currentOrder.status}" to "${newStatus}"`,
      },
      { status: 400 }
    );
  }

  const { data: order, error } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json(
      { error: `Could not update order: ${error?.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ order });
}