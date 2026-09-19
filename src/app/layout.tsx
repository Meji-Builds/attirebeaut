import { CartProvider } from "@/lib/cart-context";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = "https://attirebeaut.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "AttireBeaut — African Fashion, Elevated",
    template: "%s | AttireBeaut",
  },
  description:
    "Shop African fashion at AttireBeaut. Ready-to-wear garments, traditional Ankara fabrics, Aso oke, Agbada, and bespoke custom outfits made to order. Delivered UK-wide.",
  keywords: [
    "African fashion UK",
    "Ankara fabric",
    "Aso oke",
    "Agbada",
    "traditional African wear",
    "ready to wear African clothing",
    "bespoke African outfits",
    "African clothing online",
  ],
  openGraph: {
    type: "website",
    siteName: "AttireBeaut",
    title: "AttireBeaut — African Fashion, Elevated",
    description:
      "Ready-to-wear, traditional garments, Ankara fabrics and bespoke custom outfits celebrating African fashion.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "AttireBeaut — African Fashion, Elevated",
    description:
      "Ready-to-wear, traditional garments, Ankara fabrics and bespoke custom outfits celebrating African fashion.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full`}
    >
      <body className="min-h-full flex flex-col antialiased bg-white text-gray-900">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
