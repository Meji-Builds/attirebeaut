import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await params;
    const supabase = createServiceClient();

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
    const { response } = await requireAdminApi();
    if (response) return response;

    const { id } = await params;
    const supabase = createServiceClient();

    const body = await request.json();
    const text = body?.body as string | undefined;
    if (!text?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const { data: message, error } = await supabase
        .from("order_messages")
        .insert({ order_id: id, sender_role: "admin", body: text.trim() })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message });
}
