import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ItemOption } from "@/lib/catalog";

import { ItemVersionsViewer } from "./item-versions-viewer";

// Stub the image seam. The viewer renders photos through <ProductGallery> and the
// tiles through <ItemSelector>, and BOTH reach <AssetImage> — mocking that one module
// keeps the whole tree renderable in jsdom without next/image or Cloudinary. (Hoisted
// above the imports, so it's in place before the viewer's children pull it in.)
vi.mock("@/components/ui/asset-image", () => ({
  AssetImage: ({ assetKey, alt }: { assetKey: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetKey} alt={alt} />
  ),
}));

// Two available items with DISTINCT price / fabric / care, so a swap is visible on
// every axis the viewer drives off the selected item.
const OPTIONS: ItemOption[] = [
  {
    id: "item-a",
    available: true,
    images: ["a/main"],
    priceCents: 4800,
    care: "Care A",
    description: "Fabric A",
  },
  {
    id: "item-b",
    available: true,
    images: ["b/main"],
    priceCents: 5200,
    care: "Care B",
    description: "Fabric B",
  },
];

// Full, valid props; each test overrides only what it exercises. Non-customizable
// with two in-stock items and item-a opened, unless a test says otherwise.
function renderViewer(overrides: Partial<React.ComponentProps<typeof ItemVersionsViewer>> = {}) {
  return render(
    <ItemVersionsViewer
      productName="Linen tote"
      customizable={false}
      productDescription="A roomy tote."
      productDimensions={null}
      productImages={["product/main"]}
      productPriceCents={9900}
      productCare={null}
      options={OPTIONS}
      initialItemId="item-a"
      {...overrides}
    />,
  );
}

// The viewer rewrites window.location via history.replaceState; reset it between tests
// so one test's ?item=… doesn't leak into the next's starting URL.
afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("ItemVersionsViewer", () => {
  it("opens on the initial item's price, fabric, and care", () => {
    renderViewer();

    expect(screen.getByText("€48.00")).toBeInTheDocument();
    expect(screen.getByText("Fabric A")).toBeInTheDocument();
    expect(screen.getByText("Care A")).toBeInTheDocument();
  });

  it("swaps price, fabric, care, and the pressed tile when another item is selected", () => {
    renderViewer();

    fireEvent.click(screen.getByRole("button", { name: /Show Piece 02/ }));

    // The per-item values follow the selection to item-b: gallery photo, price,
    // fabric, care. The main gallery image renders with alt={productName}, and the
    // AssetImage stub surfaces the asset key as src, so this reads the shown photo.
    expect(screen.getByAltText("Linen tote")).toHaveAttribute("src", "b/main");
    expect(screen.getByText("€52.00")).toBeInTheDocument();
    expect(screen.queryByText("€48.00")).not.toBeInTheDocument();
    expect(screen.getByText("Fabric B")).toBeInTheDocument();
    expect(screen.getByText("Care B")).toBeInTheDocument();
    // ...and so does the highlight.
    expect(screen.getByRole("button", { name: /Show Piece 02/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Show Piece 01/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("rewrites the URL to ?item=<id> on selection", () => {
    renderViewer();

    fireEvent.click(screen.getByRole("button", { name: /Show Piece 02/ }));

    expect(window.location.search).toBe("?item=item-b");
  });

  it("keeps existing query params when it sets ?item=", () => {
    // Arrive with a marketing param, the kind a shopper follows a link in with.
    window.history.replaceState(null, "", "/shop/linen-tote?utm_source=insta");
    renderViewer();

    fireEvent.click(screen.getByRole("button", { name: /Show Piece 02/ }));

    // utm_source survives the tap instead of being clobbered by a bare ?item=.
    expect(window.location.search).toBe("?utm_source=insta&item=item-b");
  });

  it("shows the sold-out state (no price, no Add button) for a non-customizable product with nothing available", () => {
    // A one-of-a-kind product whose only piece has sold: no available item AND not
    // customizable, so there's no buy path at all.
    renderViewer({
      customizable: false,
      options: [{ ...OPTIONS[0], available: false }],
      initialItemId: null,
    });

    expect(screen.getByText("Sold out")).toBeInTheDocument();
    expect(screen.queryByText("€48.00")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Add to cart/ })).not.toBeInTheDocument();
  });

  it("does NOT show sold-out for a customizable product with nothing available — it's still made-to-order", () => {
    renderViewer({
      customizable: true,
      options: [],
      initialItemId: null,
    });

    expect(screen.queryByText("Sold out")).not.toBeInTheDocument();
    // The product-level price shows instead, with the fixed-price note.
    expect(screen.getByText("€99.00")).toBeInTheDocument();
    expect(screen.getByText(/fixed price/)).toBeInTheDocument();
  });
});
