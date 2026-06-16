import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "FAQ" };

export default function FaqPage() {
  return (
    <PlaceholderPage
      title="FAQ"
      description="Answers to the questions we get most — about made-to-order pieces, fabrics, sizing, and timing. Coming soon."
    />
  );
}
