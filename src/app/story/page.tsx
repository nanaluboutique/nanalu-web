import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Our story" };

export default function StoryPage() {
  return (
    <PlaceholderPage
      title="Our story"
      description="Two sisters at a sewing table. We'll tell you who we are and how Nanalu came to be — coming soon."
    />
  );
}
