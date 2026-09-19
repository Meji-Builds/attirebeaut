import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";

const BASE_URL = "https://attirebeaut.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, updated_at")
    .eq("is_deleted", false);

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${BASE_URL}/products/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ...productUrls,
  ];
}
