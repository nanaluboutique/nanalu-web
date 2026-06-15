import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";

import "./globals.css";

import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

// Display serif — headings, hero, prices. `variable` exposes it as a CSS
// custom property that globals.css reads via `--font-display`.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Body / UI sans.
const karla = Karla({
  variable: "--font-karla",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // `default` is used when a page sets no title; `template` wraps any page that
  // does (e.g. a page's `title: "Shop"` renders as "Shop · Nanalu Boutique").
  title: {
    default: "Nanalu Boutique",
    template: "%s · Nanalu Boutique",
  },
  description: "Handmade sewn & knit goods — ready-made and made-to-order by two sisters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
