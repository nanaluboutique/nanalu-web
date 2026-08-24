import Link from "next/link";

import type { CategoryOption, ColourOption } from "@/lib/catalog";
import { removeParams, type ShopQuery } from "@/lib/shop-query";

/**
 * The active-filter chips in the toolbar (#44): one removable pill per applied filter, a
 * compact readout of what's currently narrowing the grid. A SERVER component — each ×
 * is a plain <Link> that drops that filter's param(s) and navigates.
 *
 * It builds a small list of chips from the parsed query, then renders them. Nothing
 * applied → no chips → the component renders nothing (returns null).
 *
 * Availability is ONE chip, not two: the ready/custom checkboxes narrow as a coupled OR
 * pair (piece 2), so a single "… only" chip describes the state and its × resets BOTH via
 * removeParams. Category and price each clear a single key.
 */
type ActiveFilterChipsProps = {
  query: ShopQuery;
  categories: CategoryOption[]; // resolves the category slug to its display name
  colours: ColourOption[]; // resolves the colour slug to its display name (#68)
  current: URLSearchParams;
};

export function ActiveFilterChips({ query, categories, colours, current }: ActiveFilterChipsProps) {
  // Each chip: what it says, and which param key(s) its × removes.
  const chips: { label: string; paramsToClear: string[] }[] = [];

  if (query.category) {
    // Show the human name, not the slug; fall back to the slug if it's not in the list
    // (e.g. a category that has no in-stock items, so categoryOptions never emitted it).
    const name =
      categories.find((option) => option.slug === query.category)?.name ?? query.category;
    chips.push({ label: name, paramsToClear: ["category"] });
  }

  if (query.colour) {
    // Same slug→name resolution as category, with the same slug fallback (#68).
    const name = colours.find((option) => option.slug === query.colour)?.name ?? query.colour;
    chips.push({ label: name, paramsToClear: ["colour"] });
  }

  // Only when availability deviates from the default (both boxes checked).
  if (!(query.ready && query.customizable)) {
    const label =
      query.ready && !query.customizable
        ? "Ready to ship"
        : !query.ready && query.customizable
          ? "Customizable"
          : "No availability"; // both unchecked → the grid is empty
    chips.push({ label, paramsToClear: ["ready", "custom"] });
  }

  if (query.maxPriceCents !== null) {
    chips.push({ label: `Up to €${query.maxPriceCents / 100}`, paramsToClear: ["maxPrice"] });
  }

  if (chips.length === 0) return null;

  const clearFilterHref = (keys: string[]) => {
    const queryString = removeParams(current, keys);
    return queryString ? `/shop?${queryString}` : "/shop";
  };

  return (
    <div className="active-chips">
      {chips.map((chip) => (
        <span key={chip.paramsToClear.join("-")} className="chip">
          {chip.label}
          <Link
            href={clearFilterHref(chip.paramsToClear)}
            aria-label={`Remove filter: ${chip.label}`}
          >
            ×
          </Link>
        </span>
      ))}
    </div>
  );
}
