import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Impressum" };

export default function ImpressumPage() {
  return (
    <PlaceholderPage
      title="Impressum"
      description="The legally required publisher information. This page will be completed before launch."
    />
  );
}
