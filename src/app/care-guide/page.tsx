import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Care guide" };

export default function CareGuidePage() {
  return (
    <PlaceholderPage
      title="Knit & crochet care guide"
      description="How to wash, dry, and store your handmade pieces so they last. The full guide is coming soon."
    />
  );
}
