"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart-context";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navLinks = [
  { label: "Ready to Wear", href: "/?category=ready_to_wear" },
  { label: "Traditional", href: "/?category=traditional_wear" },
  { label: "Fabrics", href: "/?category=fabric" },
  { label: "Accessories", href: "/?category=accessory" },
];

export default function Navbar() {
  const { items } = useCart();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [open, setOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const cartCount = items.reduce((n, i) => n + i.quantity, 0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase.auth]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" aria-label="AttireBeaut home" className="shrink-0">
            {logoError ? (
              <span className="font-serif text-xl font-bold tracking-wide text-violet-900">
                AttireBeaut
              </span>
            ) : (
              <Image
                src="/logo.png"
                alt="AttireBeaut"
                width={160}
                height={56}
                className="h-10 w-auto object-contain"
                priority
                onError={() => setLogoError(true)}
              />
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-gray-600 hover:text-pink-700 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-5">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative text-gray-700 hover:text-pink-700 transition-colors"
              aria-label={`Cart, ${cartCount} items`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-violet-700 text-white text-[10px] font-bold rounded w-4 h-4 flex items-center justify-center leading-none">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* Auth — desktop */}
            <div className="hidden sm:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/orders"
                    className="text-sm text-gray-600 hover:text-pink-700 transition-colors"
                  >
                    My Orders
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-600 hover:text-pink-700 transition-colors"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-pink-700 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden text-gray-700 hover:text-pink-700 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
            >
              <span className="relative block w-6 h-6">
                {/* Hamburger — fades out + rotates away when open */}
                <span
                  className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                    open ? "opacity-0 rotate-90 scale-75" : "opacity-100 rotate-0 scale-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                    />
                  </svg>
                </span>
                {/* X — fades in + rotates in when open */}
                <span
                  className={`absolute inset-0 transition-all duration-300 ease-in-out ${
                    open ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-75"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={`md:hidden bg-white overflow-hidden transition-all duration-300 ease-in-out ${
          open
            ? "max-h-96 opacity-100 border-t border-gray-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-6 py-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-gray-700 hover:text-pink-700 py-2"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 space-y-2 mt-2">
            {user ? (
              <>
                <Link
                  href="/orders"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-gray-700 hover:text-pink-700 py-2"
                >
                  My Orders
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setOpen(false);
                  }}
                  className="block text-sm text-gray-700 hover:text-pink-700 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="block text-sm text-gray-700 hover:text-pink-700 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="inline-block text-sm bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
