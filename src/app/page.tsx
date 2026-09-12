import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "ready_to_wear", label: "Ready to Wear" },
  { value: "traditional_wear", label: "Traditional" },
  { value: "fabric", label: "Fabrics" },
  { value: "accessory", label: "Accessories" },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  ready_to_wear: "Ready to Wear",
  traditional_wear: "Traditional Wear",
  fabric: "Fabric",
  accessory: "Accessory",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, price, image_url, type, is_custom, lead_time_weeks")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("type", category);
  }

  const { data: products } = await query;

  return (
    <div>
      {/* Hero */}
      <section className="bg-violet-950 text-white relative overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-900 opacity-20 rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-pink-800 opacity-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 md:py-36 relative">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase text-pink-300 mb-6">
            African Fashion, Elevated
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-8 max-w-2xl">
            Dress in the Beauty of Your Culture
          </h1>
          <p className="text-violet-300 text-base leading-relaxed mb-10 max-w-lg">
            Curated ready-to-wear garments, handcrafted traditional attire,
            Ankara fabrics, and bespoke custom outfits.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/?category=ready_to_wear"
              className="bg-white text-violet-950 text-sm font-semibold px-6 py-3 rounded-lg hover:bg-violet-100 transition-colors"
            >
              Shop collection
            </Link>
            <Link
              href="/?category=traditional_wear"
              className="border border-pink-400 text-pink-200 text-sm font-semibold px-6 py-3 rounded-lg hover:border-pink-300 hover:text-white transition-colors"
            >
              Traditional wear
            </Link>
          </div>
        </div>

        {/* Wave bottom — transitions hero into white with a pink hint */}
        <svg
          viewBox="0 0 1440 72"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,48 C360,0 1080,72 1440,24 L1440,72 L0,72 Z"
            fill="#fdf2f8"
          />
          <path
            d="M0,60 C360,16 1080,80 1440,40 L1440,72 L0,72 Z"
            fill="white"
          />
        </svg>
      </section>

      {/* Category filter */}
      <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const active =
                cat.value === "all"
                  ? !category || category === "all"
                  : cat.value === category;
              return (
                <Link
                  key={cat.value}
                  href={cat.value === "all" ? "/" : `/?category=${cat.value}`}
                  className={`shrink-0 text-sm font-medium px-5 py-4 border-b-2 transition-colors ${
                    active
                      ? "border-pink-600 text-pink-700"
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
                  }`}
                >
                  {cat.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        {products?.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-400 mb-4">
              No products in this category yet.
            </p>
            <Link href="/" className="text-sm text-pink-600 hover:underline">
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                className="group block"
              >
                {/* Image */}
                <div className="aspect-[3/4] relative bg-gray-100 rounded-xl overflow-hidden mb-3">
                  {product.image_url ? (
                    <ProductImage
                      src={product.image_url}
                      alt={product.name}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={0.75}
                        stroke="currentColor"
                        className="w-14 h-14 text-gray-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                        />
                      </svg>
                    </div>
                  )}
                  {product.is_custom && (
                    <span className="absolute top-2 left-2 bg-pink-600 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded">
                      Made to Order
                    </span>
                  )}
                </div>

                {/* Info */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
                    {CATEGORY_LABELS[product.type] ?? product.type}
                  </p>
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-pink-700 transition-colors line-clamp-2 leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className={`text-sm font-semibold ${product.is_custom ? "text-pink-700" : "text-gray-900"}`}>
                      £{Number(product.price).toFixed(2)}
                    </p>
                    {product.is_custom && product.lead_time_weeks && (
                      <p className="text-[11px] text-gray-400">
                        {product.lead_time_weeks}w lead time
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
