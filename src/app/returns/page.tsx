import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Returns" };

export default function ReturnsPage() {
  return (
    <PlaceholderPage
      title="Returns"
      description="Our returns policy — including the rules for made-to-order pieces — will be spelled out here soon."
    />
  );
}
