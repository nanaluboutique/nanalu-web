import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Terms & conditions" };

export default function TermsPage() {
  return (
    <PlaceholderPage
      title="Terms & conditions"
      description="The terms of sale for our handmade pieces. The full text arrives with our legal pages."
    />
  );
}
