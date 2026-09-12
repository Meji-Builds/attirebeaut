import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-08-26.dahlia",
});

export async function POST(request: NextRequest) {

    const body = await request.json();
    const items: {variantId: string; quantity:number }[] = body.items;
    const userId: string = body.userId;
    const addressId: string = body.addressId;
    const supabase = await createClient();

    if (!userId || !addressId) {
        return NextResponse.json({ error: 'Missing user or address' }, { status: 400 });
    }

    const { data: addressRow, error: addressLookupError } = await supabase
    .from('addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single();

    if (addressLookupError || !addressRow) {
        return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
    }

    let total = 0;
    const orderItemsData: { variantId: string; quantity: number; price: number; delivery_fee: number }[] = [];
    const deliveryFeesByProduct = new Map<string, number>();

    for(const item of items) {
        const{data: variant, error} = await supabase
        .from('product_variants')
        .select('*, products(price, delivery_fee)')
        .eq('id', item.variantId)
        .single();

        if(error || !variant) {
            return NextResponse.json({error: 'Invalid item in cart'}, {status: 404});
        }
        total += variant.price * item.quantity;

        const deliveryFee = variant.products.delivery_fee ?? 0;

        orderItemsData.push({
            variantId: item.variantId,
            quantity: item.quantity,
            price: variant.price,
            delivery_fee: deliveryFee,
        });

        // Dedup by product_id: same product across variants/quantities only
        // charges delivery once. Confirm product_variants actually has a
        // product_id column — if it's named differently, swap this key.
        deliveryFeesByProduct.set(variant.product_id, deliveryFee);
    }

    const deliveryTotal = Array.from(deliveryFeesByProduct.values())
        .reduce((sum, fee) => sum + fee, 0);

    const grandTotal = total + deliveryTotal;


    const { data: order, error:orderError } = await supabase
    .from('orders')
    .insert({ 
        total: total, 
        delivery_fee: deliveryTotal,
        status: 'pending',
        user_id: userId,
        address_id: addressId,
    })
    .select()
    .single()

    if(orderError || !order) {
        return NextResponse.json({ error: 'Could not create order' }, {status: 500});
    }

    const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
        orderItemsData.map((item) => ({
            order_id: order.id,
            product_variant_id: item.variantId,
            quantity: item.quantity,
            price: item.price, 
        }))
    );

    if (itemsError) {
        return NextResponse.json({ error: 'Could not create order items' },{ status: 500 })
    }

    try{
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(grandTotal * 100), //pence
            currency: 'gbp',
            metadata: { orderId: order.id },
        });

        return NextResponse.json({clientSecret: paymentIntent.client_secret});
    } catch(error) {
        const message = error instanceof Error ? error.message : 'Something went wrong';
        return NextResponse.json({error: message}, {status: 400});
    }



}