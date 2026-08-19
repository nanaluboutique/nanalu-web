import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CategoryOption } from "@/lib/catalog";

import { CategoryFilter } from "./category-filter";

// A server component: no hooks, no next/navigation. Each row is a next/link, which renders a
// plain <a href> in jsdom — so we render with props and read the hrefs directly, no mocking.

const CATEGORIES: CategoryOption[] = [
  { slug: "pouches", name: "Pouches", count: 5 },
  { slug: "bags", name: "Bags", count: 2 },
];

describe("CategoryFilter", () => {
  it("renders an 'All pieces' row plus one row per category, each with its count", () => {
    render(
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={null}
        totalCount={7}
        current={new URLSearchParams("")}
      />,
    );

    // The count lives in a <span> inside the link, so the accessible name is "Pouches 5".
    expect(screen.getByRole("link", { name: "All pieces 7" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pouches 5" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Bags 2" })).toBeInTheDocument();
  });

  it("marks the active category with aria-current and leaves the rest unmarked", () => {
    render(
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory="pouches"
        totalCount={7}
        current={new URLSearchParams("")}
      />,
    );

    expect(screen.getByRole("link", { name: "Pouches 5" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Bags 2" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "All pieces 7" })).not.toHaveAttribute("aria-current");
  });

  it("marks 'All pieces' active when no category is selected", () => {
    render(
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={null}
        totalCount={7}
        current={new URLSearchParams("")}
      />,
    );

    expect(screen.getByRole("link", { name: "All pieces 7" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  it("builds each category href by setting category= while preserving other params", () => {
    // An active sort must survive clicking a category — updateParam only touches the category
    // key, so ?sort=price-asc rides along.
    render(
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={null}
        totalCount={7}
        current={new URLSearchParams("sort=price-asc")}
      />,
    );

    expect(screen.getByRole("link", { name: "Pouches 5" })).toHaveAttribute(
      "href",
      "/shop?sort=price-asc&category=pouches",
    );
  });

  it("drops the category on 'All pieces' while keeping the other params", () => {
    render(
      <CategoryFilter
        categories={CATEGORIES}
        activeCategory="pouches"
        totalCount={7}
        current={new URLSearchParams("sort=price-asc&category=pouches")}
      />,
    );

    // Removing the only-category key leaves sort behind, so the href is /shop?sort=price-asc,
    // not the bare /shop.
    expect(screen.getByRole("link", { name: "All pieces 7" })).toHaveAttribute(
      "href",
      "/shop?sort=price-asc",
    );
  });
});
