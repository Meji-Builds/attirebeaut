import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const { data: messages, error } = await supabase
        .from("order_messages")
        .select("id, sender_role, body, created_at")
        .eq("order_id", id)
        .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ messages });
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const body = await request.json();
    const text = body?.body as string | undefined;
    if (!text?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const { data: message, error } = await supabase
        .from("order_messages")
        .insert({ order_id: id, sender_role: "buyer", body: text.trim() })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message });
}
