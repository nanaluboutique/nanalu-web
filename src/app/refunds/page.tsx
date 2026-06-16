import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Refunds" };

export default function RefundsPage() {
  return (
    <PlaceholderPage
      title="Refunds & returns"
      description="Our refund and return policy — including how it works for made-to-order pieces — will be spelled out here soon."
    />
  );
}
