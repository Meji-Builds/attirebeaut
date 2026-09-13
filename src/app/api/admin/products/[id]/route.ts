import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .single();

  if (error || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();
  const formData = await request.formData();

  const { data: existingProduct, error: fetchError } = await supabase
    .from("products")
    .select("image_url")
    .eq("id", id)
    .single();

  if (fetchError || !existingProduct) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  const name = formData.get("name");
  if (name !== null) updates.name = name as string;

  const description = formData.get("description");
  if (description !== null) updates.description = description as string;

  const price = formData.get("price");
  if (price !== null) updates.price = Number(price);

  const deliveryFee = formData.get("delivery_fee");
  if (deliveryFee !== null) updates.delivery_fee = Number(deliveryFee);

  const type = formData.get("type");
  if (type !== null) updates.type = type as string;

  const isCustom = formData.get("is_custom");
  if (isCustom !== null) updates.is_custom = isCustom === "true";

  const leadTimeWeeks = formData.get("lead_time_weeks");
  if (leadTimeWeeks !== null && leadTimeWeeks !== "") {
    updates.lead_time_weeks = Number(leadTimeWeeks) || null;
  } else if (leadTimeWeeks === "") {
    updates.lead_time_weeks = null;
  }

  // Image replacement — only if a real file was sent (size > 0)
  const imageFile = formData.get("image") as File | null;
  let oldImagePath: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const newFilePath = `${crypto.randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(newFilePath, imageFile);

    if (uploadError) {
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(newFilePath);

    updates.image_url = publicUrl;
    oldImagePath = existingProduct.image_url?.split("/product-images/")[1] ?? null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: product, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !product) {
    return NextResponse.json(
      { error: `Could not update product: ${error?.message}` },
      { status: 500 }
    );
  }

  if (oldImagePath) {
    await supabase.storage.from("product-images").remove([oldImagePath]);
  }

  // Update variants: replace all existing variants with the new set
  const variantsRaw = formData.get("variants") as string | null;
  if (variantsRaw) {
    let variants: { size?: number; length?: number; stock: number; price: number }[];
    try {
      variants = JSON.parse(variantsRaw);
    } catch {
      return NextResponse.json({ error: "Invalid variants JSON" }, { status: 400 });
    }

    await supabase.from("product_variants").delete().eq("product_id", id);

    if (variants.length > 0) {
      const { error: variantsError } = await supabase
        .from("product_variants")
        .insert(
          variants.map((v) => ({
            product_id: id,
            size: v.size ?? null,
            length: v.length ?? null,
            stock: v.stock,
            price: v.price,
          }))
        );

      if (variantsError) {
        return NextResponse.json(
          { error: `Could not update variants: ${variantsError.message}` },
          { status: 500 }
        );
      }
    }
  }

  // Clear the Next.js page cache so buyers see the updated product immediately
  revalidatePath("/");
  revalidatePath(`/products/${id}`);

  return NextResponse.json({ product });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("products")
    .update({ is_deleted: true })
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: `Could not delete product: ${error.message}` },
      { status: 500 }
    );
  }

  revalidatePath("/");
  revalidatePath(`/products/${id}`);

  return NextResponse.json({ success: true });
}
