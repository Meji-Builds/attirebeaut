"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type View = "analytics" | "products" | "orders";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  delivery_fee: number;
  image_url: string | null;
  type: string;
  is_custom: boolean;
  lead_time_weeks: number | null;
  is_deleted: boolean;
  product_variants: Variant[];
}

interface Variant {
  id: string;
  size: number | null;
  length: number | null;
  stock: number;
  price: number | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  delivery_fee: number;
  placed_at: string;
  addresses: { street: string; city: string; postcode: string } | null;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    product_variants: {
      size: number | null;
      length: number | null;
      products: { name: string } | null;
    } | null;
  }[];
}

interface AnalyticsData {
  totalRevenue: number;
  revenueByDay: { day: string; total: number }[];
  topProducts: { productId: string; name: string; unitsSold: number; revenue: number }[];
  statusCounts: { pending: number; paid: number; shipped: number; delivered: number; cancelled: number };
  totalOrders: number;
}

interface VariantRow {
  size: string;
  length: string;
  stock: string;
  price: string;
}

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  );
}

function IconShirt() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
    </svg>
  );
}

function IconOrders() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

function IconBack() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

function IconPhoto() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg ${STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// ─── Analytics view ───────────────────────────────────────────────────────────

function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/analytics/revenue").then((r) => r.json()),
      fetch("/api/admin/analytics/top-products").then((r) => r.json()),
      fetch("/api/admin/analytics/order-status-counts").then((r) => r.json()),
    ]).then(([rev, top, counts]) => {
      setData({
        totalRevenue: rev.totalRevenue ?? 0,
        revenueByDay: (rev.revenueByDay ?? []).map((d: { day: string; total: string | number }) => ({
          day: d.day,
          total: Number(d.total),
        })),
        topProducts: (top.topProducts ?? []).map((p: { productId: string; name: string; unitsSold: number; revenue: string | number }) => ({
          ...p,
          revenue: Number(p.revenue),
        })),
        statusCounts: counts.counts ?? {},
        totalOrders: counts.totalOrders ?? 0,
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 text-sm">
        Loading analytics...
      </div>
    );
  }

  const statuses = ["pending", "paid", "shipped", "delivered", "cancelled"];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">
          Analytics
        </h2>
        <p className="text-sm text-gray-500">Overview of sales and orders</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Total Revenue
          </p>
          <p className="text-2xl font-bold text-gray-900">
            £{Number(data?.totalRevenue ?? 0).toFixed(2)}
          </p>
        </div>
        <div className="border border-gray-200 rounded-xl p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
            Total Orders
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {data?.totalOrders ?? 0}
          </p>
        </div>
        {statuses.slice(0, 2).map((s) => (
          <div key={s} className="border border-gray-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {(data?.statusCounts as Record<string, number>)?.[s] ?? 0}
            </p>
          </div>
        ))}
      </div>

      {/* Order status breakdown */}
      <div className="border border-gray-200 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Orders by Status
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {statuses.map((s) => (
            <div key={s} className="text-center">
              <p className="text-xl font-bold text-gray-900 mb-1">
                {(data?.statusCounts as Record<string, number>)?.[s] ?? 0}
              </p>
              <StatusBadge status={s} />
            </div>
          ))}
        </div>
      </div>

      {/* Revenue chart */}
      {data && data.revenueByDay.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">
            Revenue by Day
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.revenueByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `£${v}`}
                width={50}
              />
              <Tooltip
                formatter={(v) => [`£${Number(v).toFixed(2)}`, "Revenue"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6d28d9"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top products */}
      {data && data.topProducts.length > 0 && (
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-6">
            Top Products by Revenue
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(160, data.topProducts.length * 40)}>
            <BarChart
              data={data.topProducts.slice(0, 8)}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `£${v}`}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                tickLine={false}
                axisLine={false}
                width={130}
              />
              <Tooltip
                formatter={(v) => [`£${Number(v).toFixed(2)}`, "Revenue"]}
                contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
              />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ─── Product form ─────────────────────────────────────────────────────────────

const PRODUCT_TYPES = [
  { value: "ready_to_wear", label: "Ready to Wear" },
  { value: "traditional_wear", label: "Traditional Wear" },
  { value: "fabric", label: "Fabric" },
  { value: "accessory", label: "Accessory" },
];

const BLANK_VARIANT: VariantRow = { size: "", length: "", stock: "", price: "" };

function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product: Product | null;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = product !== null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variantType, setVariantType] = useState<"size" | "length">(
    product && product.product_variants.some((v) => v.length !== null)
      ? "length"
      : "size"
  );
  const [variants, setVariants] = useState<VariantRow[]>(
    product && product.product_variants.length > 0
      ? product.product_variants.map((v) => ({
          size: v.size != null ? String(v.size) : "",
          length: v.length != null ? String(v.length) : "",
          stock: String(v.stock),
          price: v.price != null ? String(v.price) : "",
        }))
      : [{ ...BLANK_VARIANT }]
  );

  function addVariant() {
    setVariants((prev) => [...prev, { ...BLANK_VARIANT }]);
  }

  function removeVariant(i: number) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateVariant(i: number, field: keyof VariantRow, value: string) {
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, [field]: value } : v))
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const variantsData = variants
      .filter((v) => v.stock !== "")
      .map((v) => ({
        ...(variantType === "size" && v.size !== "" ? { size: Number(v.size) } : {}),
        ...(variantType === "length" && v.length !== "" ? { length: Number(v.length) } : {}),
        stock: Number(v.stock),
        ...(v.price !== "" ? { price: Number(v.price) } : {}),
      }));

    fd.set("variants", JSON.stringify(variantsData));
    fd.set("is_custom", form.querySelector<HTMLInputElement>('[name="is_custom"]')?.checked ? "true" : "false");

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, { method, body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setSaving(false);
      return;
    }

    onSave();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Product name</label>
          <input
            name="name"
            defaultValue={product?.name}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            defaultValue={product?.description}
            rows={3}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Base price (£)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.price}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Delivery fee (£)</label>
          <input
            name="delivery_fee"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product?.delivery_fee}
            required
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            name="type"
            defaultValue={product?.type ?? "ready_to_wear"}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_custom"
              id="is_custom"
              defaultChecked={product?.is_custom}
              className="w-4 h-4 text-violet-700 border-gray-300 rounded focus:ring-violet-500"
            />
            <label htmlFor="is_custom" className="text-sm font-medium text-gray-700">
              Custom / Made to Order
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Lead time (weeks)</label>
          <input
            name="lead_time_weeks"
            type="number"
            min="1"
            defaultValue={product?.lead_time_weeks ?? ""}
            className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Product image {isEdit && "(leave blank to keep existing)"}
          </label>
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex items-center gap-3">
            <div className="text-gray-300">
              <IconPhoto />
            </div>
            <input
              name="image"
              type="file"
              accept="image/*"
              required={!isEdit}
              className="text-sm text-gray-600 file:mr-3 file:text-xs file:font-medium file:text-violet-700 file:bg-violet-50 file:border file:border-violet-200 file:rounded-lg file:px-3 file:py-1.5 file:cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">Variants</label>
          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setVariantType("size")}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${variantType === "size" ? "bg-violet-800 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              UK Sizes
            </button>
            <button
              type="button"
              onClick={() => setVariantType("length")}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${variantType === "length" ? "bg-violet-800 text-white" : "text-gray-500 hover:text-gray-800"}`}
            >
              Length
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-4 gap-0 bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500 px-3 py-2">
            <span>{variantType === "size" ? "Size (UK)" : "Length (m)"}</span>
            <span>Stock</span>
            <span>Price override (£)</span>
            <span></span>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-4 gap-2 items-center px-3 py-2 border-b border-gray-100 last:border-0">
              <input
                type="number"
                value={variantType === "size" ? v.size : v.length}
                onChange={(e) => updateVariant(i, variantType === "size" ? "size" : "length", e.target.value)}
                placeholder={variantType === "size" ? "e.g. 12" : "e.g. 1.5"}
                step={variantType === "length" ? "0.5" : "2"}
                min={variantType === "size" ? "8" : "0.5"}
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="number"
                value={v.stock}
                onChange={(e) => updateVariant(i, "stock", e.target.value)}
                required
                min="0"
                placeholder="0"
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <input
                type="number"
                value={v.price}
                onChange={(e) => updateVariant(i, "price", e.target.value)}
                step="0.01"
                min="0"
                placeholder="Optional"
                className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                type="button"
                onClick={() => removeVariant(i)}
                disabled={variants.length === 1}
                className="flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors disabled:opacity-30"
              >
                <IconTrash />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addVariant}
          className="mt-2 flex items-center gap-1.5 text-sm text-violet-700 hover:text-violet-900 transition-colors"
        >
          <IconPlus />
          Add variant
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-violet-800 disabled:bg-violet-400 text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-violet-900 transition-colors"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-300 text-gray-700 text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Products view ────────────────────────────────────────────────────────────

function ProductsView() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | Product | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadProducts = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        setProducts(data.products ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  async function handleDelete(id: string) {
    if (!confirm("Soft-delete this product? It will no longer appear in the store.")) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setDeleting(null);
    loadProducts();
  }

  if (modal !== null) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-700 transition-colors">
            <IconBack />
          </button>
          <h2 className="font-serif text-2xl font-bold text-gray-900">
            {modal === "create" ? "New product" : "Edit product"}
          </h2>
        </div>
        <div className="max-w-2xl">
          <ProductForm
            product={modal === "create" ? null : modal}
            onSave={() => { setModal(null); loadProducts(); }}
            onCancel={() => setModal(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">Products</h2>
          <p className="text-sm text-gray-500">{products.length} products</p>
        </div>
        <button
          onClick={() => setModal("create")}
          className="flex items-center gap-2 bg-violet-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-violet-900 transition-colors"
        >
          <IconPlus />
          New product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm mb-3">No products yet</p>
          <button
            onClick={() => setModal("create")}
            className="text-sm text-violet-700 hover:underline"
          >
            Add your first product
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Variants</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Type</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 leading-snug">{p.name}</p>
                      {p.is_custom && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-600">
                          Made to Order
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-500 capitalize">
                      {p.type?.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    £{Number(p.price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                    {p.product_variants?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {p.is_custom ? (
                      <span className="text-xs text-violet-600 font-medium">Custom</span>
                    ) : (
                      <span className="text-xs text-gray-400">Standard</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModal(p)}
                        className="p-1.5 text-gray-400 hover:text-violet-700 transition-colors rounded-lg hover:bg-violet-50"
                        title="Edit"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 disabled:opacity-40"
                        title="Delete"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Order detail ─────────────────────────────────────────────────────────────

function OrderDetail({
  order,
  onBack,
  onStatusUpdate,
}: {
  order: Order;
  onBack: () => void;
  onStatusUpdate: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextStatuses = NEXT_STATUSES[order.status] ?? [];

  async function updateStatus(status: string) {
    setUpdating(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Update failed");
    } else {
      onStatusUpdate();
    }
    setUpdating(false);
  }

  const total = Number(order.total) + Number(order.delivery_fee);

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors">
          <IconBack />
        </button>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Order</p>
          <h2 className="font-serif text-xl font-bold text-gray-900">
            {order.id.slice(0, 8).toUpperCase()}
          </h2>
        </div>
        <div className="ml-2">
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
              Items
            </div>
            {order.order_items.map((item) => (
              <div key={item.id} className="flex justify-between items-start px-4 py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {item.product_variants?.products?.name ?? "Unknown product"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.product_variants?.size != null
                      ? `UK ${item.product_variants.size}`
                      : item.product_variants?.length != null
                      ? `${item.product_variants.length}m`
                      : ""}{" "}
                    &times; {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  £{(Number(item.price) * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>£{Number(order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Delivery</span>
                <span>£{Number(order.delivery_fee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-gray-900 mt-2 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span>£{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Delivery address */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Delivery Address
            </p>
            {order.addresses ? (
              <div className="text-sm text-gray-700">
                <p>{order.addresses.street}</p>
                <p>{order.addresses.city}</p>
                <p>{order.addresses.postcode}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No address on record</p>
            )}
          </div>

          {/* Placed at */}
          <div className="border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Placed
            </p>
            <p className="text-sm text-gray-700">
              {new Date(order.placed_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Status update */}
          {nextStatuses.length > 0 && (
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Update Status
              </p>
              {error && (
                <p className="text-xs text-red-600 mb-2">{error}</p>
              )}
              <div className="space-y-2">
                {nextStatuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={updating}
                    className="w-full text-left text-sm font-medium border border-gray-200 rounded-lg px-3 py-2 hover:border-violet-400 hover:text-violet-800 transition-colors disabled:opacity-40"
                  >
                    Mark as {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Orders view ──────────────────────────────────────────────────────────────

const ORDER_STATUSES = ["all", "pending", "paid", "shipped", "delivered", "cancelled"] as const;

function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadOrders = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data.orders ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  if (selected) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => { setSelected(null); loadOrders(); }}
        onStatusUpdate={() => {
          fetch(`/api/admin/orders/${selected.id}`)
            .then((r) => r.json())
            .then((data) => setSelected(data.order));
        }}
      />
    );
  }

  const filtered = statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-1">Orders</h2>
        <p className="text-sm text-gray-500">{orders.length} orders</p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ORDER_STATUSES.map((s) => {
          const count = s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
          const active = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                active
                  ? "bg-violet-800 text-white border-violet-800"
                  : "border-gray-200 text-gray-600 hover:border-violet-400 hover:text-violet-700"
              }`}
            >
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className={`ml-1.5 ${active ? "opacity-70" : "opacity-50"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-400 text-sm">
            {orders.length === 0 ? "No orders yet" : `No ${statusFilter} orders`}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Total</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Items</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">
                    {o.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {new Date(o.placed_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 hidden md:table-cell">
                    £{(Number(o.total) + Number(o.delivery_fee)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                    {o.order_items?.length ?? 0} item{o.order_items?.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(o)}
                      className="text-xs font-medium text-violet-700 hover:text-violet-900 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard({ userId }: { userId: string }) {
  const [view, setView] = useState<View>("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems: { view: View; label: string; icon: React.ReactNode }[] = [
    { view: "analytics", label: "Analytics", icon: <IconChart /> },
    { view: "products", label: "Products", icon: <IconShirt /> },
    { view: "orders", label: "Orders", icon: <IconOrders /> },
  ];

  function NavButton({ item }: { item: typeof navItems[0] }) {
    const active = view === item.view;
    return (
      <button
        onClick={() => { setView(item.view); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-violet-800 text-white"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
        {item.icon}
        {item.label}
      </button>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Admin
          </p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavButton key={item.view} item={item} />
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 truncate">{userId}</p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setSidebarOpen(false)}
        >
          <aside
            className="absolute left-0 top-16 bottom-0 w-56 bg-white border-r border-gray-200 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="space-y-1 mt-4">
              {navItems.map((item) => (
                <NavButton key={item.view} item={item} />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-gray-900 capitalize">{view}</p>
        </div>

        {view === "analytics" && <AnalyticsView />}
        {view === "products" && <ProductsView />}
        {view === "orders" && <OrdersView />}
      </div>
    </div>
  );
}
