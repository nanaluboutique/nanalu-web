import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <PlaceholderPage
      title="Shop all"
      description="Our ready-made, one-of-a-kind pieces will live here — browse, filter, and find the one that's yours."
    />
  );
}
