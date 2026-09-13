import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ProductDetail from "./ProductDetail";

const CATEGORY_LABELS: Record<string, string> = {
  ready_to_wear: "Ready to Wear",
  traditional_wear: "Traditional Wear",
  fabric: "Fabric",
  accessory: "Accessory",
};

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (!product) notFound();

  const variants = product.product_variants ?? [];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-700 transition-colors">
          Home
        </Link>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-3 h-3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Image */}
        <div className="aspect-[4/5] relative bg-gray-100 rounded-xl overflow-hidden">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={0.75}
                stroke="currentColor"
                className="w-20 h-20 text-gray-200"
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
            <div className="absolute top-4 left-4 bg-violet-800 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-lg">
              Made to Order
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">
            {CATEGORY_LABELS[product.type] ?? product.type}
          </p>
          <h1 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            {product.name}
          </h1>
          <p className="text-2xl font-semibold text-violet-800 mb-6">
            £{Number(product.price).toFixed(2)}
          </p>

          {product.is_custom && product.lead_time_weeks && (
            <div className="bg-violet-50 border border-violet-100 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-violet-700 mt-0.5 shrink-0"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-violet-900">
                    Custom / Made to Order
                  </p>
                  <p className="text-sm text-violet-700 mt-0.5">
                    Handcrafted to your specifications. Please allow{" "}
                    {product.lead_time_weeks} to {product.lead_time_weeks + 1}{" "}
                    weeks for delivery.
                  </p>
                </div>
              </div>
            </div>
          )}

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-8 text-sm">
              {product.description}
            </p>
          )}

          <div className="border-t border-gray-100 pt-8 mb-8">
            <ProductDetail
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
              }}
              variants={variants}
              productPath={`/products/${id}`}
              imageUrl={product.image_url ?? null}
              isCustom={product.is_custom ?? false}
            />
          </div>

          <div className="space-y-2.5 text-sm text-gray-500 border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 shrink-0 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              <span>Delivery fee: £{Number(product.delivery_fee ?? 0).toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4 shrink-0 text-gray-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                />
              </svg>
              <span>Secure payment via Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
