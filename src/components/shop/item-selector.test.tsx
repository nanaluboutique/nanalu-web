import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ItemOption } from "@/lib/catalog";

import { ItemSelector } from "./item-selector";

// Stub the image seam, same reason as product-card.test.tsx: <AssetImage> wraps
// next/image + imageUrl() (a Cloudinary env var + the Next optimizer), none of which
// this test cares about. A plain <img> lets jsdom render the tiles without that
// machinery. (vi.mock is hoisted above the imports, so the stub is in place before
// item-selector.tsx pulls AssetImage in.)
vi.mock("@/components/ui/asset-image", () => ({
  AssetImage: ({ assetKey, alt }: { assetKey: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={assetKey} alt={alt} />
  ),
}));

// A full, valid ItemOption; each test overrides only the field it exercises (mirrors
// makeCard in product-card.test.tsx). Available by default.
function makeOption(overrides: Partial<ItemOption> = {}): ItemOption {
  return {
    id: "item-1",
    available: true,
    images: ["item-1/main"],
    priceCents: 4800,
    care: "Cool wash",
    description: "Linen",
    ...overrides,
  };
}

describe("ItemSelector", () => {
  it("renders nothing when the product has no ready-made items", () => {
    // A made-to-order-only product: no tiles, and no empty box either.
    const { container } = render(
      <ItemSelector options={[]} selectedItemId={null} onSelect={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("reports the tapped item's id and marks only the selected tile as pressed", () => {
    const onSelect = vi.fn();
    const options = [makeOption({ id: "item-a" }), makeOption({ id: "item-b" })];
    // item-a is the selected one; item-b is available but not selected.
    render(<ItemSelector options={options} selectedItemId="item-a" onSelect={onSelect} />);

    const first = screen.getByRole("button", { name: /Show Piece 01/ });
    const second = screen.getByRole("button", { name: /Show Piece 02/ });
    expect(first).toHaveAttribute("aria-pressed", "true");
    expect(second).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(second);
    // Presentational: it doesn't move its own highlight — it reports the tap upward.
    expect(onSelect).toHaveBeenCalledWith("item-b");
  });

  it("renders a sold item as a disabled .sold tile that can't be selected", () => {
    const onSelect = vi.fn();
    const options = [makeOption({ id: "sold-1", available: false })];
    render(<ItemSelector options={options} selectedItemId={null} onSelect={onSelect} />);

    const tile = screen.getByRole("button", { name: "Piece 01 — sold" });
    expect(tile).toBeDisabled();
    expect(tile).toHaveClass("sold");
    // aria-pressed is meaningless on a non-selectable tile, so it's omitted entirely.
    expect(tile).not.toHaveAttribute("aria-pressed");

    fireEvent.click(tile);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("numbers pieces across the whole list — a sold newest item is still Piece 01", () => {
    // The sold piece sits first (newest), so numbering must count it as Piece 01 and
    // give the available piece behind it Piece 02 — not renumber from the available ones.
    const options = [
      makeOption({ id: "sold-newest", available: false }),
      makeOption({ id: "available-older" }),
    ];
    render(<ItemSelector options={options} selectedItemId="available-older" onSelect={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Piece 01 — sold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Show Piece 02/ })).toBeInTheDocument();
  });

  it("drops the 'in stock now' heading once every piece is sold", () => {
    const { rerender } = render(
      <ItemSelector options={[makeOption()]} selectedItemId="item-1" onSelect={vi.fn()} />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("In stock now — one of a kind");

    rerender(
      <ItemSelector
        options={[makeOption({ available: false })]}
        selectedItemId={null}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading")).toHaveTextContent("One of a kind");
  });
});
