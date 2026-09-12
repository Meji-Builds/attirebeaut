import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { fulfillOrder } from "@/lib/fulfill-order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-08-26.dahlia',
});

export async function POST(request: NextRequest) {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;
    const supabase = createServiceClient();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err) {
        const message = err instanceof Error ? err.message : "Invalid Signature";
        return NextResponse.json({ error: message }, { status: 400 });
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const orderId = paymentIntent.metadata.orderId;

        if (!orderId) {
            console.log('No orderId in metadata - skipping');
            return NextResponse.json({ received: true });
        }

        const fulfilled = await fulfillOrder(supabase, orderId);
        if (!fulfilled) {
            console.log('Order already fulfilled or not found:', orderId);
        }
    }

    return NextResponse.json({ received: true });
}
