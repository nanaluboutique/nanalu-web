import Link from "next/link";

import type { ColourOption } from "@/lib/catalog";
import { updateParam } from "@/lib/shop-query";

/**
 * The Fabric-colour section of the filter sidebar (#68).
 *
 * A SERVER component — each swatch is a plain <Link>, so choosing a colour is real
 * navigation with no client JS (the same shape as CategoryFilter). Swatches come from
 * colourOptions: every colour that has stock, painted from its hex. The row hides itself
 * when nothing is tagged (colours empty), so the "Fabric colour" header never sits over
 * an empty rail.
 *
 * Single-select, like Category — but with no "All" row (a swatch grid has no room for
 * one), so instead clicking the ACTIVE swatch clears the filter (toggle). hrefFor encodes
 * that: same slug → null (drop the param), other slug → select it. The active swatch is
 * marked aria-current="true", so the ring (.swatch-filter a[aria-current]) and screen
 * readers stay in sync. Each swatch's accessible name is "Sage (3)" — the colour and its
 * count — since a bare circle carries no text.
 *
 * `current` is the page's live URLSearchParams, threaded in so each href keeps the other
 * active filters — updateParam changes only the `colour` key.
 */
type ColourFilterProps = {
  colours: ColourOption[];
  activeColour: string | null; // the selected slug, or null = any colour
  current: URLSearchParams;
};

export function ColourFilter({ colours, activeColour, current }: ColourFilterProps) {
  if (colours.length === 0) return null;

  const hrefFor = (slug: string) => {
    // Toggle: re-clicking the active colour clears it; any other selects it. Empty string
    // = every filter at its default, so link back to the clean /shop.
    const next = slug === activeColour ? null : slug;
    const queryString = updateParam(current, "colour", next);
    return queryString ? `/shop?${queryString}` : "/shop";
  };

  return (
    <>
      <h4>Fabric colour</h4>
      <div className="swatch-filter" role="group" aria-label="Filter by fabric colour">
        {colours.map((colour) => (
          <Link
            key={colour.slug}
            href={hrefFor(colour.slug)}
            style={{ background: colour.hex }}
            aria-current={colour.slug === activeColour ? "true" : undefined}
            aria-label={`${colour.name} (${colour.count})`}
            title={colour.name}
          />
        ))}
      </div>
    </>
  );
}
