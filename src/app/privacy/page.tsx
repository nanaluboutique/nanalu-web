import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <PlaceholderPage
      title="Privacy"
      description="How we handle your data, in plain language. Our full privacy notice arrives with the legal pages."
    />
  );
}
