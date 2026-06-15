import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <PlaceholderPage
      title="Your cart"
      description="Your selected pieces will gather here, with stock held while you decide. Cart and checkout come in a later phase."
    />
  );
}
