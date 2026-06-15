import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Design your own" };

export default function CustomizePage() {
  return (
    <PlaceholderPage
      title="Design your own"
      description="Pick your fabrics and we'll make your piece from scratch — every fabric shown at its true scale. The configurator is on its way."
    />
  );
}
