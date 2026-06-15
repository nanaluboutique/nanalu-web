import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <PlaceholderPage
      title="Your account"
      description="Sign in, order history, and saved details will live here once authentication is in place."
    />
  );
}
