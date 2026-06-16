import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      title="Contact"
      description="Want to reach the two of us? Ways to get in touch are on the way — for now, find us on Instagram."
    />
  );
}
