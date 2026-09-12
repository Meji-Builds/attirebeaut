import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <>
      {/* Wave into footer */}
      <div className="bg-white">
        <svg
          viewBox="0 0 1440 56"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,56 L0,28 C360,56 1080,0 1440,28 L1440,56 Z"
            fill="#030712"
          />
        </svg>
      </div>

      <footer className="bg-gray-950 text-gray-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <Image
                src="/logo.png"
                alt="AttireBeaut"
                width={160}
                height={56}
                className="h-12 w-auto object-contain brightness-0 invert mb-4"
              />
              <p className="text-sm leading-relaxed text-gray-400 max-w-xs">
                Celebrating African fashion. From ready-to-wear to exquisite
                traditional garments, handcrafted with pride.
              </p>
              <p className="text-xs text-gray-600 mt-6">
                A subsidiary of Funkola Global Limited
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">
                Collections
              </h3>
              <ul className="space-y-3">
                {(
                  [
                    ["Ready to Wear", "/?category=ready_to_wear"],
                    ["Traditional Wear", "/?category=traditional_wear"],
                    ["Fabrics", "/?category=fabric"],
                    ["Accessories", "/?category=accessory"],
                  ] as [string, string][]
                ).map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-5">
                Account
              </h3>
              <ul className="space-y-3">
                {(
                  [
                    ["Sign In", "/login"],
                    ["Create Account", "/signup"],
                    ["My Cart", "/cart"],
                  ] as [string, string][]
                ).map(([label, href]) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-gray-400 hover:text-pink-400 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>&copy; {new Date().getFullYear()} AttireBeaut. All rights reserved.</p>
            <p>Payments secured by Stripe</p>
          </div>
          <p className="mt-6 text-center text-[10px] text-gray-800 tracking-widest uppercase select-none">
            Built by Meji Builds
          </p>
        </div>
      </footer>
    </>
  );
}
