import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ColourOption } from "@/lib/catalog";

import { ColourFilter } from "./colour-filter";

// A server component: no hooks, no next/navigation. Each swatch is a next/link, which
// renders a plain <a href> in jsdom — so we render with props and read the hrefs directly,
// no mocking. A swatch has no text, so its accessible name is the aria-label "Sage (3)".

const COLOURS: ColourOption[] = [
  { slug: "sage", name: "Sage", hex: "#B6C7A1", count: 3 },
  { slug: "terracotta", name: "Terracotta", hex: "#C08457", count: 1 },
];

describe("ColourFilter", () => {
  it("renders one swatch per colour, named with the colour and its count", () => {
    render(
      <ColourFilter colours={COLOURS} activeColour={null} current={new URLSearchParams("")} />,
    );

    expect(screen.getByRole("link", { name: "Sage (3)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terracotta (1)" })).toBeInTheDocument();
  });

  it("paints each swatch with its colour's hex", () => {
    render(
      <ColourFilter colours={COLOURS} activeColour={null} current={new URLSearchParams("")} />,
    );

    // The fill is an inline style from the hex — jsdom serialises the shorthand to rgb.
    expect(screen.getByRole("link", { name: "Sage (3)" })).toHaveStyle({
      background: "rgb(182, 199, 161)", // #B6C7A1
    });
  });

  it("renders nothing when no colour has stock (empty list)", () => {
    // The header must not sit over an empty rail — the whole section hides.
    const { container } = render(
      <ColourFilter colours={[]} activeColour={null} current={new URLSearchParams("")} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("marks the active swatch with aria-current and leaves the rest unmarked", () => {
    render(
      <ColourFilter colours={COLOURS} activeColour="sage" current={new URLSearchParams("")} />,
    );

    expect(screen.getByRole("link", { name: "Sage (3)" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Terracotta (1)" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("selects a colour by setting colour= while preserving other params", () => {
    // An active sort must survive clicking a swatch — updateParam only touches `colour`.
    render(
      <ColourFilter
        colours={COLOURS}
        activeColour={null}
        current={new URLSearchParams("sort=price-asc")}
      />,
    );

    expect(screen.getByRole("link", { name: "Sage (3)" })).toHaveAttribute(
      "href",
      "/shop?sort=price-asc&colour=sage",
    );
  });

  it("toggles the active swatch off — re-clicking it drops the colour param", () => {
    // No "All" row for a swatch grid, so the active swatch itself clears the filter.
    render(
      <ColourFilter
        colours={COLOURS}
        activeColour="sage"
        current={new URLSearchParams("colour=sage&sort=price-asc")}
      />,
    );

    // The active swatch links back to /shop with only sort left; the inactive one selects.
    expect(screen.getByRole("link", { name: "Sage (3)" })).toHaveAttribute(
      "href",
      "/shop?sort=price-asc",
    );
    expect(screen.getByRole("link", { name: "Terracotta (1)" })).toHaveAttribute(
      "href",
      "/shop?colour=terracotta&sort=price-asc",
    );
  });
});
