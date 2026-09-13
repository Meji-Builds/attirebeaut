
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";

export const maxDuration = 60;

export async function POST(request: NextRequest) {

  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();
  const formData = await request.formData();


  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));
  const deliveryFee = formData.get("delivery_fee")
    ? Number(formData.get("delivery_fee"))
    : null;
  const type = formData.get("type") as string;
  const isCustom = formData.get("is_custom") === "true";
  const leadTimeWeeks = formData.get("lead_time_weeks")
    ? Number(formData.get("lead_time_weeks"))
    : null;

  const imageFile = formData.get("image") as File | null;
  const variantsRaw = formData.get("variants") as string | null;

  if (!name || !price || !imageFile || !variantsRaw) {
    return NextResponse.json(
      { error: "Missing required fields (name, price, image, variants)" },
      { status: 400 }
    );
  }


  const fileExt = imageFile.name.split(".").pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, imageFile);

  if (uploadError) {
    return NextResponse.json(
      { error: `Image upload failed: ${uploadError.message}` },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("product-images").getPublicUrl(filePath);


  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name,
      description,
      price,
      delivery_fee: deliveryFee,
      type,
      is_custom: isCustom,
      lead_time_weeks: leadTimeWeeks,
      image_url: publicUrl,
    })
    .select()
    .single();

  if (productError || !product) {
    return NextResponse.json(
      { error: `Could not create product: ${productError?.message}` },
      { status: 500 }
    );
  }


  let variants: { size?: number; length?: number; stock: number; price: number }[];
  try {
    variants = JSON.parse(variantsRaw);
  } catch {
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.json(
      { error: "Invalid variants JSON" },
      { status: 400 }
    );
  }

  const { error: variantsError } = await supabase
    .from("product_variants")
    .insert(
      variants.map((v) => ({
        product_id: product.id,
        size: v.size ?? null,
        length: v.length ?? null,
        stock: v.stock,
        price: v.price,
      }))
    );


  if (variantsError) {
    await supabase.from("products").delete().eq("id", product.id);
    return NextResponse.json(
      { error: `Could not create variants: ${variantsError.message}` },
      { status: 500 }
    );
  }

  revalidatePath("/");

  return NextResponse.json({ product }, { status: 201 });
}

export async function GET(request: NextRequest) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = createServiceClient();

  const { data: products, error } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: `Could not fetch products: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ products });
}