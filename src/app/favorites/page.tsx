import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <PlaceholderPage
      title="Favorites"
      description="Save the pieces you love to find them again later. This lands once accounts are wired up."
    />
  );
}
