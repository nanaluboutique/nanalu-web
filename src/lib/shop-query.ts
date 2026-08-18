/**
 * The shop's filter/sort state, and how it maps to the URL (#44).
 *
 * The shop is filtered ENTIRELY through the URL: `/shop?category=pouches&sort=price-asc`
 * fully describes what a shopper sees, so a filtered view is shareable and the browser
 * back button just works. This file is the ONE translator between the two worlds:
 *
 *   URL query string  ──parseShopQuery──▶  ShopQuery (a plain, typed object)
 *   a click  ──updateParam──▶               the next URL query string
 *
 * It is deliberately FREE of `server-only` (unlike catalog.ts) so BOTH sides can import
 * it: the server page parses the incoming URL, and the client sidebar/toolbar build the
 * next URL when you click a filter. Pure string/number logic — no DB, no React — so it
 * unit-tests on its own.
 */

/**
 * The sort choices, as ONE list so the dropdown and the parser can't drift apart:
 * the <select> renders these options, and the parser trusts exactly these `value`s.
 * Add a sort here and both places pick it up. `newest` is first = the default.
 *
 * `as const` freezes it into literal types ("newest" | "price-asc" | "price-desc")
 * rather than widening to plain `string`, which is what makes ShopSort below exact.
 */
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;

// "one of the value fields above" — derived from the list, so it can never list a
// sort the dropdown doesn't offer. (typeof SORT_OPTIONS)[number] is "any element of
// the array"; ["value"] then narrows to just that element's value union.
export type ShopSort = (typeof SORT_OPTIONS)[number]["value"];

// The default sort — used when the URL says nothing (or something invalid). Derived
// from the FIRST option so "the default" is defined in exactly one place: reorder
// SORT_OPTIONS and the default follows. The dropdown also uses it to decide when a
// choice is the default and can be dropped from the URL (keeping default URLs clean).
export const DEFAULT_SORT: ShopSort = SORT_OPTIONS[0].value;

/**
 * The filter/sort state as a plain object the rest of the app reads. Every field has a
 * well-defined default so the page never has to null-check the URL:
 *   category      — a Category slug, or null = "All pieces"
 *   ready         — "Ready to ship" checkbox (default ON)
 *   customizable  — "Customizable" checkbox (default ON)
 *   maxPriceCents — upper price cap in integer cents, or null = no cap
 *   sort          — one of SORT_OPTIONS, default "newest"
 */
export type ShopQuery = {
  category: string | null;
  ready: boolean;
  customizable: boolean;
  maxPriceCents: number | null;
  sort: ShopSort;
};

/**
 * Read the URL's query params into a ShopQuery, applying every default and rejecting
 * anything malformed (a hand-typed `?sort=banana` falls back to "newest", never throws).
 *
 * Takes a URLSearchParams so it fits both callers: the client passes the one from
 * `useSearchParams()`; the server builds one from Next's `searchParams` prop.
 *
 * The two checkboxes default to ON, so the URL only carries them when they're OFF, as
 * `ready=0` / `custom=0`. Absent = checked; the explicit "0" = unchecked. That keeps a
 * default view's URL clean (`/shop` with no query) and every param present only when it
 * actually changes something.
 *
 * Price rides in the URL as whole EUROS (`maxPrice=30`) because that's what the shopper
 * sees on the slider; we multiply to cents here, at the edge, so the rest of the app
 * stays in integer cents (the money rule — floats never touch a price).
 */
export function parseShopQuery(params: URLSearchParams): ShopQuery {
  const rawSort = params.get("sort");
  const sort = SORT_OPTIONS.some((option) => option.value === rawSort)
    ? (rawSort as ShopSort)
    : DEFAULT_SORT;

  const maxPriceEuros = Number.parseInt(params.get("maxPrice") ?? "", 10);
  const maxPriceCents =
    Number.isFinite(maxPriceEuros) && maxPriceEuros > 0 ? maxPriceEuros * 100 : null;

  return {
    category: params.get("category") || null,
    ready: params.get("ready") !== "0",
    customizable: params.get("custom") !== "0",
    maxPriceCents,
    sort,
  };
}

/**
 * Build the next query string from the CURRENT one with a single key changed — the move
 * every filter control makes. Clicking "Pouches" should set `category=pouches` while
 * LEAVING any active sort/price alone, so we clone the current params and touch one key.
 *
 * value = null removes the key entirely (that's how "clear this filter" and the chip's ×
 * work, and how a control returns to its default without leaving a stale param behind).
 *
 * Returns the bare query string ("category=pouches&sort=price-asc"), no leading "?". The
 * caller decides the href: `qs ? \`/shop?${qs}\` : "/shop"` — an empty string means every
 * filter is at its default, so we link back to the clean `/shop`.
 */
export function updateParam(current: URLSearchParams, key: string, value: string | null): string {
  const updatedParams = new URLSearchParams(current);
  if (value === null) {
    updatedParams.delete(key);
  } else {
    updatedParams.set(key, value);
  }
  return updatedParams.toString();
}

/**
 * Like updateParam, but REMOVES several keys at once — for a chip's × that clears a filter
 * spanning more than one param. The availability filter is one filter made of two params
 * (`ready` + `custom`), so its chip drops both in a single click; category/price chips pass
 * a single key. Same clone-then-edit shape, same clean-URL return (empty string = /shop).
 */
export function removeParams(current: URLSearchParams, keys: string[]): string {
  const updatedParams = new URLSearchParams(current);
  for (const key of keys) {
    updatedParams.delete(key);
  }
  return updatedParams.toString();
}
