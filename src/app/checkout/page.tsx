"use client";

import { useState, useEffect } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe/client";
import { useCart } from "@/lib/cart-context";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CheckoutForm from "./checkout-form";

type SavedAddress = {
  id: string;
  street: string;
  city: string;
  postcode: string;
};

export default function CheckoutPage() {
  const { items } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [address, setAddress] = useState({ street: "", city: "", postcode: "" });
  const [addressSubmitted, setAddressSubmitted] = useState(false);
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [pendingAddressId, setPendingAddressId] = useState<string | null>(null);
  const [specs, setSpecs] = useState({ measurements: "", notes: "" });
  const [showSpecsForm, setShowSpecsForm] = useState(false);

  const hasCustomItems = items.some((i) => i.isCustom === true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.push("/login?redirect=/checkout");
        return;
      }
      setUserId(user.id);
      const { data: addresses } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id);
      setSavedAddresses(addresses || []);
      if (!addresses || addresses.length === 0) setShowNewAddressForm(true);
      setCheckingAuth(false);
    });
  }, []);

  function createPaymentIntent(addressId: string, customSpecs?: { measurements: string; notes: string }) {
    fetch("/api/checkout/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        userId,
        addressId,
        specs: customSpecs,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setClientSecret(data.clientSecret);
      })
      .catch((err) => setError(err.message));
  }

  function handleSelectAddress(addr: SavedAddress) {
    if (hasCustomItems) {
      setPendingAddressId(addr.id);
      setShowSpecsForm(true);
    } else {
      setAddressSubmitted(true);
      createPaymentIntent(addr.id);
    }
  }

  function handleEditAddress(addr: SavedAddress) {
    setEditingAddress(addr);
    setAddress({ street: addr.street, city: addr.city, postcode: addr.postcode });
    setShowNewAddressForm(true);
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    let resolvedAddressId: string | null = null;

    if (editingAddress) {
      const { error: err } = await supabase
        .from("addresses")
        .update({ street: address.street, city: address.city, postcode: address.postcode })
        .eq("id", editingAddress.id);
      if (err) { setError(err.message); return; }
      resolvedAddressId = editingAddress.id;
    } else {
      const { data: newAddress, error: err } = await supabase
        .from("addresses")
        .insert({ user_id: userId, street: address.street, city: address.city, postcode: address.postcode })
        .select()
        .single();
      if (err) { setError(err.message); return; }
      resolvedAddressId = newAddress.id;
    }

    if (hasCustomItems) {
      setPendingAddressId(resolvedAddressId);
      setShowSpecsForm(true);
    } else {
      setAddressSubmitted(true);
      createPaymentIntent(resolvedAddressId!);
    }
  }

  function handleSpecsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowSpecsForm(false);
    setAddressSubmitted(true);
    createPaymentIntent(pendingAddressId!, specs);
  }

  if (showSpecsForm) {
    return (
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => { setShowSpecsForm(false); setPendingAddressId(null); }}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">Custom specifications</h1>
            <p className="text-xs text-gray-500 mt-0.5">Your order includes made-to-order items</p>
          </div>
        </div>
        <form onSubmit={handleSpecsSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Measurements
            </label>
            <textarea
              value={specs.measurements}
              onChange={(e) => setSpecs({ ...specs, measurements: e.target.value })}
              rows={5}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              placeholder={"Bust: 36in\nWaist: 28in\nHips: 38in\nHeight: 5ft 6in"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Additional notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={specs.notes}
              onChange={(e) => setSpecs({ ...specs, notes: e.target.value })}
              rows={3}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              placeholder="Any special requests, colour preferences, etc."
            />
          </div>
          <button
            type="submit"
            className="w-full bg-violet-800 text-white text-sm font-semibold py-3 rounded-lg hover:bg-violet-900 transition-colors"
          >
            Continue to payment
          </button>
        </form>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <div className="w-14 h-14 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-red-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className="text-gray-800 text-sm font-medium mb-2">Something went wrong</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <button
          onClick={() => setError(null)}
          className="text-sm text-violet-700 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!addressSubmitted) {
    if (showNewAddressForm) {
      return (
        <div className="max-w-lg mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-8">
            {savedAddresses.length > 0 && (
              <button
                onClick={() => { setShowNewAddressForm(false); setEditingAddress(null); }}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              {editingAddress ? "Edit address" : "Delivery address"}
            </h1>
          </div>

          <form onSubmit={handleAddressSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Street address
              </label>
              <input
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="123 Example Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                City
              </label>
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="London"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Postcode
              </label>
              <input
                value={address.postcode}
                onChange={(e) => setAddress({ ...address, postcode: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                placeholder="SW1A 1AA"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-violet-800 text-white text-sm font-semibold py-3 rounded-lg hover:bg-violet-900 transition-colors"
            >
              Continue to payment
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="max-w-lg mx-auto px-6 py-12">
        <h1 className="font-serif text-2xl font-bold text-gray-900 mb-2">
          Delivery address
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose a saved address or add a new one
        </p>

        <div className="space-y-3 mb-6">
          {savedAddresses.map((addr) => (
            <div key={addr.id} className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-medium text-gray-900">{addr.street}</p>
              <p className="text-sm text-gray-500">
                {addr.city}, {addr.postcode}
              </p>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => handleSelectAddress(addr)}
                  className="text-sm font-semibold text-white bg-violet-800 px-4 py-2 rounded-lg hover:bg-violet-900 transition-colors"
                >
                  Deliver here
                </button>
                <button
                  onClick={() => handleEditAddress(addr)}
                  className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {savedAddresses.length < 2 && (
          <button
            onClick={() => { setEditingAddress(null); setAddress({ street: "", city: "", postcode: "" }); setShowNewAddressForm(true); }}
            className="flex items-center gap-2 text-sm text-violet-700 hover:text-violet-900 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add a new address
          </button>
        )}
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center">
        <p className="text-gray-400 text-sm">Preparing payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="font-serif text-2xl font-bold text-gray-900 mb-8">
        Payment
      </h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
