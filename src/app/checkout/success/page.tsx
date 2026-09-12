import Link from "next/link";
import Stripe from "stripe";
import ClearCartOnLoad from "./clear-cart-on-load";
import { createServiceClient } from "@/lib/supabase/service";
import { fulfillOrder } from "@/lib/fulfill-order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-08-26.dahlia",
});

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  if (params.redirect_status === "succeeded") {
    const paymentIntentId = typeof params.payment_intent === "string" ? params.payment_intent : null;

    if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (pi.status === "succeeded" && pi.metadata.orderId) {
          const supabase = createServiceClient();
          await fulfillOrder(supabase, pi.metadata.orderId);
        }
      } catch (e) {
        console.error("Error confirming order on success page:", e);
      }
    }

    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <ClearCartOnLoad />
        <div className="w-16 h-16 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-8 h-8 text-green-600"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">
          Order confirmed
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Thank you for your purchase. We will begin preparing your order
          shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="inline-block border border-gray-200 text-gray-700 text-sm font-semibold px-6 py-3 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            View my orders
          </Link>
          <Link
            href="/"
            className="inline-block bg-violet-800 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-violet-900 transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-24 text-center">
      <div className="w-16 h-16 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8 text-red-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-3">
        Payment unsuccessful
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Something went wrong with your payment. Please try again.
      </p>
      <Link
        href="/checkout"
        className="inline-block bg-violet-800 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-violet-900 transition-colors"
      >
        Try again
      </Link>
    </div>
  );
}
