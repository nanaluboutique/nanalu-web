import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ShopCard } from "@/lib/catalog";

import { ProductCard } from "./product-card";

// Stub the image seam. ProductCard renders photos through <AssetImage>, which wraps
// next/image and calls imageUrl() — neither of which this test cares about (they're
// separately owned, and need a Cloudinary env var + the Next optimizer to behave).
// Swapping AssetImage for a plain <img src={assetKey}> makes the raw asset KEY the
// thing on screen, so "did the photo swap?" is a direct assertion on that key. The
// main photo keeps alt={productName}; the swatches pass alt="", so getByAltText finds
// the main image uniquely. (vi.mock is hoisted above the imports, so the stub is in
// place before product-card.tsx pulls AssetImage in.)
vi.mock("@/components/ui/asset-image", () => ({
  AssetImage: ({ assetKey, alt }: { assetKey: string; alt: string }) => (
    // A plain <img> is deliberate here — the next/image optimization the lint rule
    // pushes for is exactly what this stub exists to bypass in jsdom.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetKey} alt={alt} />
  ),
}));

// A full, valid ShopCard; each test overrides only the field it exercises (mirrors
// makeCatalogItem in catalog.test.ts). Three siblings by default, with distinct ids,
// image keys, and prices so a swap is visible on all three axes at once.
function makeCard(overrides: Partial<ShopCard> = {}): ShopCard {
  const itemSiblings = overrides.itemSiblings ?? [
    { itemId: "item-a", imageKey: "pouch-a/main", priceCents: 2400 },
    { itemId: "item-b", imageKey: "pouch-b/main", priceCents: 4800 },
    { itemId: "item-c", imageKey: "pouch-c/main", priceCents: 5200 },
  ];
  return {
    defaultItemId: itemSiblings[0].itemId,
    productName: "Zip pouch",
    productSlug: "zip-pouch",
    category: "Pouches",
    customizable: true,
    itemSiblings,
    ...overrides,
  };
}

// The main (large) photo — the one AssetImage renders with alt={productName}. Its src
// is the selected sibling's asset key, so reading it tells us which item is on display.
const mainPhoto = (productName: string) => screen.getByAltText(productName);

describe("ProductCard", () => {
  describe("initial render", () => {
    it("opens on the default item's photo, price, and link", () => {
      render(<ProductCard card={makeCard()} />);

      expect(mainPhoto("Zip pouch")).toHaveAttribute("src", "pouch-a/main");
      expect(screen.getByText("€24.00")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Zip pouch" })).toHaveAttribute(
        "href",
        "/shop/zip-pouch?item=item-a",
      );
    });
  });

  describe("photo-swap on thumbnail click", () => {
    it("retargets the photo, price, and product link to the chosen sibling", () => {
      render(<ProductCard card={makeCard()} />);

      // Click the second thumbnail (item-b: pouch-b/main, €48.00).
      fireEvent.click(screen.getByRole("button", { name: /Show piece 2/ }));

      expect(mainPhoto("Zip pouch")).toHaveAttribute("src", "pouch-b/main");
      expect(screen.getByText("€48.00")).toBeInTheDocument();
      expect(screen.queryByText("€24.00")).not.toBeInTheDocument(); // the old price is gone
      expect(screen.getByRole("link", { name: "Zip pouch" })).toHaveAttribute(
        "href",
        "/shop/zip-pouch?item=item-b",
      );
    });
  });

  describe("thumbnail row visibility", () => {
    it("is absent when the product has a single item", () => {
      render(
        <ProductCard
          card={makeCard({
            itemSiblings: [{ itemId: "solo", imageKey: "solo/main", priceCents: 3000 }],
          })}
        />,
      );

      expect(
        screen.queryByRole("group", { name: "Other pieces in this style" }),
      ).not.toBeInTheDocument();
    });

    it("shows one thumbnail per sibling when the product has several", () => {
      render(<ProductCard card={makeCard()} />);

      const swatches = screen.getByRole("group", { name: "Other pieces in this style" });
      expect(within(swatches).getAllByRole("button")).toHaveLength(3);
    });
  });

  describe("aria-pressed on the thumbnails", () => {
    it("marks only the selected thumbnail, and moves it on click", () => {
      render(<ProductCard card={makeCard()} />);

      // Default: piece 1 is selected, the rest are not.
      expect(screen.getByRole("button", { name: /Show piece 1/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: /Show piece 2/ })).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      fireEvent.click(screen.getByRole("button", { name: /Show piece 2/ }));

      // The pressed state follows the selection to piece 2.
      expect(screen.getByRole("button", { name: /Show piece 2/ })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(screen.getByRole("button", { name: /Show piece 1/ })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });
  });
});
