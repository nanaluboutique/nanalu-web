import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CategoryOption } from "@/lib/catalog";
import type { ShopQuery } from "@/lib/shop-query";

import { ActiveFilterChips } from "./active-filter-chips";

// A server component: props in, <a href> out. No hooks, no next/navigation — no mocking.

// A ShopQuery with every filter at its default (nothing narrowing the grid); each test
// overrides only the fields it exercises.
function makeQuery(overrides: Partial<ShopQuery> = {}): ShopQuery {
  return {
    category: null,
    ready: true,
    customizable: true,
    maxPriceCents: null,
    sort: "newest",
    ...overrides,
  };
}

const CATEGORIES: CategoryOption[] = [{ slug: "pouches", name: "Pouches", count: 5 }];

describe("ActiveFilterChips", () => {
  it("renders nothing when no filter is active", () => {
    const { container } = render(
      <ActiveFilterChips
        query={makeQuery()}
        categories={CATEGORIES}
        current={new URLSearchParams("")}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders one chip per active filter, each × clearing only its own param", () => {
    render(
      <ActiveFilterChips
        query={makeQuery({ category: "pouches", maxPriceCents: 3000 })}
        categories={CATEGORIES}
        current={new URLSearchParams("category=pouches&maxPrice=30")}
      />,
    );

    // The category chip's × drops category and leaves the price behind...
    expect(screen.getByRole("link", { name: "Remove filter: Pouches" })).toHaveAttribute(
      "href",
      "/shop?maxPrice=30",
    );
    // ...and the price chip's × drops maxPrice and leaves the category behind.
    expect(screen.getByRole("link", { name: "Remove filter: Up to €30" })).toHaveAttribute(
      "href",
      "/shop?category=pouches",
    );
  });

  it("labels the category chip with its display name, falling back to the slug when unknown", () => {
    // A slug with no matching CategoryOption (e.g. a category with nothing in stock) shows the
    // raw slug rather than crashing or hiding the chip.
    render(
      <ActiveFilterChips
        query={makeQuery({ category: "mystery" })}
        categories={CATEGORIES}
        current={new URLSearchParams("category=mystery")}
      />,
    );

    expect(screen.getByRole("link", { name: "Remove filter: mystery" })).toBeInTheDocument();
  });

  it("shows availability as ONE coupled chip whose × clears both ready and custom", () => {
    // Both boxes off → a single "No availability" chip, never two separate ready/custom chips.
    render(
      <ActiveFilterChips
        query={makeQuery({ ready: false, customizable: false })}
        categories={CATEGORIES}
        current={new URLSearchParams("ready=0&custom=0&sort=price-asc")}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(1);
    // Its × removes BOTH availability params in one go, leaving the unrelated sort untouched.
    expect(screen.getByRole("link", { name: "Remove filter: No availability" })).toHaveAttribute(
      "href",
      "/shop?sort=price-asc",
    );
  });
});
