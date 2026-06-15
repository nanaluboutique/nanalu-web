import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Shipping" };

export default function ShippingPage() {
  return (
    <PlaceholderPage
      title="Shipping"
      description="How and when your handmade pieces reach you. The details land with our content & legal pages."
    />
  );
}
