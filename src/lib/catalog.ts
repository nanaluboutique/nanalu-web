/**
 * Catalog queries (#41) — the only place that decides what the shop shows.
 *
 * Two reads, one per Phase 2 page:
 *   listAvailableItems()   → the shop grid (#43)
 *   getProductBySlug(slug) → the product page (#45)
 *
 * Design authority is docs/data-model.md, not the mockup: a catalog card is one
 * available ReadyMadeItem, NOT one Product. Five tote versions = five cards, all
 * sharing the parent's name and price (read through the relation, never copied).
 *
 * Pages call these; they never touch `prisma` directly. Keeping the rules here
 * means "what counts as a sellable item?" has exactly one answer, in one file.
 */

import type { Product, ReadyMadeItem } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db";
import type { ShopQuery } from "@/lib/shop-query";

/**
 * Every item currently for sale, newest first — one row per catalog card.
 *
 * TWO conditions, not one, and they are different kinds of "gone":
 *   available: true           → the item itself is unsold. An item is one-of-a-kind,
 *                               so selling it is what retires it (no quantity field).
 *   product: { active: true } → the parent listing isn't discontinued. `active` is our
 *                               soft delete — we never hard-delete a Product, because
 *                               past orders still point at it.
 * A discontinued product must not leak back into the grid through an item that happens
 * to still be unsold. Hence both.
 *
 * We include the parent (and its categories) because the CARD reads from it: name,
 * price fallback, the "Customizable" tag, and the category filter (#44).
 */
export function listAvailableItems() {
  return getPrisma().readyMadeItem.findMany({
    where: { available: true, product: { active: true } },
    // `colours` (#68) rides along on each item — the sidebar colour filter reads it
    // (colourOptions builds the swatches; applyShopQuery narrows on it in memory).
    include: { product: { include: { categories: true } }, colours: true },
    // Newest first — the default the mockup's sort dropdown opens on. The other sorts
    // (price, most loved) arrive with the sort UI in #44.
    //
    // `id` IS THE TIEBREAKER, and it's required, not decorative: every item of a
    // product is written by ONE nested `create`, so siblings share an identical
    // createdAt to the millisecond (the seed's 10 items have only 5 distinct
    // timestamps). Postgres returns tied rows in ARBITRARY order, so without a second
    // key the three zip-pouch cards can reshuffle between page loads — and once #44
    // adds pagination, a tied row could appear on two pages or on none.
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}

/**
 * One product page, addressed by its URL slug (/shop/linen-tote-bag).
 *
 * Returns null when there's no such slug OR the product is discontinued — either way
 * the page 404s, so the caller needs no second check.
 *
 * findFirst, not findUnique: `slug` IS unique, but we also filter on `active`, and
 * findUnique's `where` only accepts unique columns.
 *
 * ALL items come back, sold ones included — each carries its own `available` flag.
 * Whether the page hides a sold item or shows it struck through is a rendering call,
 * and it belongs to #45/#46, not to this query.
 *
 * `customization` is selected as ID ONLY. We just need to know WHETHER a configurator
 * exists (callers ask `!!product.customization`); the config row carries a whole SVG
 * outline we'd otherwise haul over the wire for nothing. Phase 3 loads the real config
 * when it actually builds the configurator.
 */
export function getProductBySlug(slug: string) {
  return getPrisma().product.findFirst({
    where: { slug, active: true },
    include: {
      categories: true,
      // Same tiebreaker as the grid — a product's items are exactly the rows that
      // share a createdAt, so this is where ties are guaranteed, not merely likely.
      readyMadeItems: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
      customization: { select: { id: true } },
    },
  });
}

/**
 * What an item actually costs: its own price if it has one, else the parent's.
 *
 * `ReadyMadeItem.priceCents` is a nullable OVERRIDE (docs/data-model.md) — most items
 * leave it null and inherit the product's price; one made up in a pricier fabric can
 * set its own. The fallback rule lives here so the grid, the product page, the cart and
 * checkout can't each remember it differently.
 *
 * Money is integer CENTS everywhere — never floats, because 0.1 + 0.2 !== 0.3 in binary
 * floating point and that drift is unacceptable in a total. Formatting cents into
 * "€48.00" is the UI's job, not this file's.
 *
 * Takes the parent SEPARATELY rather than digging for `item.product`, because the two
 * queries hand us the item in different shapes: on the grid the parent is nested INSIDE
 * each item (we included it), while on the product page the items sit inside the parent
 * and carry no `product` of their own. One argument each keeps both call sites honest:
 *   grid:         priceCentsFor(item, item.product)
 *   product page: priceCentsFor(item, product)
 *
 * Params are the Prisma-generated model types, not bespoke shapes — the schema already
 * defines `ReadyMadeItem.priceCents` (nullable override) and `Product.priceCents`, so we
 * reuse that single source of truth. The richer rows the queries return (with relations
 * included) are structurally assignable to the base models, so both call sites still fit.
 */
export function priceCentsFor(item: ReadyMadeItem, product: Product): number {
  return item.priceCents ?? product.priceCents;
}

/**
 * This item's care instructions: its own if set, else the parent product's.
 *
 * Same shape as priceCentsFor — `ReadyMadeItem.care` is a nullable OVERRIDE, so
 * an item made in a different material (a wool version of a cotton product) can
 * carry its own care text, while most items leave it null and inherit the
 * product's. The one fallback rule lives here so the product page (and anything
 * later) can't re-remember it differently.
 *
 * Returns null when NEITHER is set — the accordion then hides the Care section
 * rather than showing an empty one. Parent passed separately for the same reason
 * as priceCentsFor: the product-page query nests items inside the product, so
 * they carry no `product` of their own.
 */
export function careFor(item: ReadyMadeItem, product: Product): string | null {
  return item.care ?? product.care;
}

/**
 * The shapes the two queries return — so components can type their props without
 * re-describing (and drifting from) the `include` clauses above.
 *
 * DERIVED, not hand-written: ReturnType<typeof fn> asks "what does calling this give
 * back?" (a Promise), and Awaited<…> unwraps that Promise to the value inside. Add a
 * field to an `include` above and these follow automatically — a hand-written interface
 * would silently rot.
 */
export type CatalogItem = Awaited<ReturnType<typeof listAvailableItems>>[number];
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/**
 * One ready-made item, flattened to exactly what the interactive product region
 * (#46) needs to show it: its own photos, its resolved price/care, its fabric text.
 *
 * WHY a flattened shape and not the raw item: the product page hands this list to a
 * "use client" island, and everything crossing that server → browser boundary must
 * be SERIALIZABLE (plain data — no Prisma internals, no Date). More importantly,
 * `priceCentsFor` / `careFor` apply the item's nullable override → product fallback,
 * and they live in server-only code the browser can't call. So we resolve every item
 * HERE, on the server, and ship down only the finished values.
 *
 * Includes SOLD items too (not just available ones) — the selector greys those out
 * (#46's sold-out follow-up); the filtering is the UI's job, not this function's.
 */
export function itemOptionsFor(product: ProductDetail) {
  return product.readyMadeItems.map((item) => ({
    id: item.id,
    available: item.available,
    images: item.images, // the item's own photos (asset keys); drives the gallery
    priceCents: priceCentsFor(item, product), // override rule applied once, here
    care: careFor(item, product), // same fallback rule, for the care text
    description: item.description, // the item's own fabric & materials text
  }));
}

// Derived from the function above, matching this file's convention (see CatalogItem):
// the function is the single source of the shape, so adding a field there updates the
// type automatically. `[number]` = "one element of the array itemOptionsFor returns".
export type ItemOption = ReturnType<typeof itemOptionsFor>[number];

/**
 * Whether the grid should show the "design your own" call-to-action (#43).
 *
 * A customizable product whose ready-made items are ALL sold has no card in the
 * grid (the grid is one card per AVAILABLE item) — but it can still be made to
 * order, so it mustn't just vanish. When at least one such product exists, the
 * shop page shows a single CTA pointing at /customize. docs/data-model.md settled
 * this as ONE page-level element, not one per product.
 *
 * `readyMadeItems: { none: { available: true } }` reads "products with no
 * available item" — which also covers a customizable product that has no items
 * at all. We only need to know IF any exist, so this counts rather than fetches.
 */
export async function hasCustomizableWithoutStock(): Promise<boolean> {
  const count = await getPrisma().product.count({
    where: {
      active: true,
      customizable: true,
      readyMadeItems: { none: { available: true } },
    },
  });
  return count > 0;
}

/**
 * One card per available item — the shape the shop grid renders (#43).
 *
 * `defaultItemId` is the item this card opens on; `itemSiblings` are ALL the
 * available items of the same product (including the default one), so the card can
 * offer photo-swap thumbnails and, on swap, retarget its price and product link.
 */
export type ShopCardItem = {
  itemId: string;
  imageKey: string; // this item's own card image (images[0]); "" if none
  priceCents: number; // resolved via priceCentsFor — the item's override or the product's
};

export type ShopCard = {
  defaultItemId: string;
  productName: string;
  productSlug: string;
  category: string | null; // first category name (the M:N can hold several); null if none
  customizable: boolean;
  itemSiblings: ShopCardItem[];
};

/**
 * Turn the flat, newest-first item list into one card per item (#43).
 *
 * PURE — no DB, no React — so it unit-tests without a database or a browser, and
 * the grid page just maps its output to <ProductCard>. Two passes:
 *   1. group every item into its product's `itemSiblings` array (encounter order,
 *      so each array stays newest-first, matching the query's ordering);
 *   2. emit one card per item, each pointing at the SHARED array for its product.
 *
 * So five tote items become five cards that all list the same five siblings, each
 * defaulting to a different one — the H&M/Zalando pattern docs/data-model.md
 * describes. The sibling arrays are shared by reference on purpose: the data is
 * read-only in render, and it keeps the grouping a single allocation per product.
 */
export function itemsToCards(items: CatalogItem[]): ShopCard[] {
  const itemsByProduct = new Map<string, ShopCardItem[]>();

  for (const item of items) {
    const itemSiblings = itemsByProduct.get(item.productId) ?? [];
    itemSiblings.push({
      itemId: item.id,
      imageKey: item.images[0] ?? "",
      priceCents: priceCentsFor(item, item.product),
    });
    itemsByProduct.set(item.productId, itemSiblings);
  }

  return items.map((item) => ({
    defaultItemId: item.id,
    productName: item.product.name,
    productSlug: item.product.slug,
    category: item.product.categories[0]?.name ?? null,
    customizable: item.product.customizable,
    // Non-null: every item pushed its own product's array above.
    itemSiblings: itemsByProduct.get(item.productId)!,
  }));
}

/**
 * Filter and sort the grid's items by the shopper's chosen ShopQuery (#44).
 *
 * PURE — takes the already-fetched item list (from listAvailableItems) plus a parsed
 * ShopQuery, and returns a new, narrowed + reordered array. No DB, no React, so it
 * unit-tests without either; the page then runs itemsToCards on the result.
 *
 * WHY filter here in memory rather than in the SQL WHERE: an item's real price is
 * `priceCentsFor(item, product)` — its nullable override OR the parent's — and that rule
 * lives in ONE place (this file). Pushing price filter/sort into Prisma would re-encode
 * that override as a query, the exact duplication CLAUDE.md forbids. The catalog is small
 * (listRelatedCards ranks in memory for the same reason), so one broad read + in-memory
 * work is both correct and simpler, and it keeps the whole filter set unit-testable.
 */
export function applyShopQuery(items: CatalogItem[], query: ShopQuery): CatalogItem[] {
  const matches = items.filter((item) => {
    // Category: when one is chosen, keep only items whose product carries it. The link is
    // M:N, so we look for ANY category on the parent whose slug matches.
    if (query.category && !item.product.categories.some((cat) => cat.slug === query.category)) {
      return false;
    }

    // Colour (#68): when one is chosen, keep only pieces tagged with it. Colour is M:N on
    // the PIECE (a print can carry several), so we match ANY of the item's colours by slug
    // — the in-memory twin of the docs' `colours: { some: { slug } }`.
    if (query.colour && !item.colours.some((colour) => colour.slug === query.colour)) {
      return false;
    }

    // Availability is an OR of two independent checkboxes (docs/data-model.md):
    //   Ready to ship → the item is in stock (`available`) — true of every grid item here
    //   Customizable  → the parent product offers the configurator
    // Keep the item if it matches EITHER checked box. Because every grid item is already
    // in stock, unchecking "Ready to ship" (leaving "Customizable") is the ONE move that
    // narrows the grid — to customizable items only. Both checked → everything; both
    // unchecked → nothing. We still AND in `item.available` rather than assume it, so the
    // rule stays correct if this is ever handed a list that includes sold items.
    const matchesAvailability =
      (query.ready && item.available) || (query.customizable && item.product.customizable);
    if (!matchesAvailability) return false;

    // Price cap: drop items dearer than the chosen cap, compared in CENTS through the one
    // price rule. null = slider at its max = no cap, so everything passes.
    if (query.maxPriceCents !== null && priceCentsFor(item, item.product) > query.maxPriceCents) {
      return false;
    }

    return true;
  });

  // "Newest" needs no sorting: `items` already arrives newest-first from listAvailableItems
  // (createdAt desc, id desc), and .filter preserves encounter order. Only price re-sorts.
  if (query.sort === "newest") return matches;

  // Array.sort is STABLE (ES2019+), so items of equal price keep their newest-first order —
  // a sensible secondary ordering for free. `matches` is a fresh array from .filter, so
  // sorting it in place never touches the caller's list (this function stays pure).
  const direction = query.sort === "price-asc" ? 1 : -1;
  return matches.sort(
    (a, b) => direction * (priceCentsFor(a, a.product) - priceCentsFor(b, b.product)),
  );
}

/**
 * One selectable category in the filter sidebar (#44): its display name, its URL slug,
 * and how many available items carry it — the "Pouches 5" tally the mockup shows.
 */
export type CategoryOption = { slug: string; name: string; count: number };

/**
 * The category rows for the filter sidebar (#44), derived from the SAME item list the
 * grid uses — so a category shows up only when something in it is actually for sale (no
 * empty "Knitwear 0" rows), and its name/slug come straight through the relation.
 *
 * PURE — no DB, no React. Because a product can sit in several categories (M:N: a knit
 * bag is Bags AND Knitwear), one item adds +1 to EACH of its categories; the counts
 * overlap on purpose, the way any tag tally does.
 *
 * Counts are over ALL in-stock items, independent of the currently-applied filters, so
 * the sidebar always shows the full breakdown — a count can therefore exceed what a given
 * availability/price filter leaves on screen. (Making the counts track the other active
 * filters is a later refinement; this keeps piece 2 simple and matches the mockup.)
 *
 * Sorted alphabetically by name for a stable, predictable order — Category has no manual
 * sort column, and localeCompare keeps "&" / accents ordered the way a reader expects.
 */
export function categoryOptions(items: CatalogItem[]): CategoryOption[] {
  const bySlug = new Map<string, CategoryOption>();

  for (const item of items) {
    for (const category of item.product.categories) {
      const existing = bySlug.get(category.slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(category.slug, { slug: category.slug, name: category.name, count: 1 });
      }
    }
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * One selectable colour in the filter sidebar (#68): its display name, its URL slug, the
 * hex to paint the swatch, and how many available pieces carry it.
 */
export type ColourOption = { slug: string; name: string; hex: string; count: number };

/**
 * The colour swatches for the filter sidebar (#68) — the exact twin of categoryOptions,
 * but reading each item's `colours` (M:N on the PIECE, not the product). Derived from the
 * SAME item list the grid uses, so a colour appears only when something in it is actually
 * for sale — no empty swatches.
 *
 * PURE — no DB, no React. A piece can carry several colours (a print), so one item adds +1
 * to EACH of its colours; the tallies overlap on purpose, like any tag count. Counts are
 * over ALL in-stock items, independent of the other active filters, matching how the
 * category tallies behave.
 *
 * Sorted alphabetically for a stable order (Colour has no manual sort column), same as
 * categoryOptions — localeCompare keeps accents ordered the way a reader expects.
 */
export function colourOptions(items: CatalogItem[]): ColourOption[] {
  const bySlug = new Map<string, ColourOption>();

  for (const item of items) {
    for (const colour of item.colours) {
      const existing = bySlug.get(colour.slug);
      if (existing) {
        existing.count += 1;
      } else {
        bySlug.set(colour.slug, {
          slug: colour.slug,
          name: colour.name,
          hex: colour.hex,
          count: 1,
        });
      }
    }
  }

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The top of the price slider's range, in whole euros (#44). Derived from the priciest
 * available item (through the one price rule), rounded UP to the nearest 10 so the slider
 * ends on a tidy number — a €86 top item gives a €90 slider. Floored at 10 so an empty or
 * very cheap catalog still hands the slider a sane span instead of 0.
 *
 * Rounds UP, never down, because the slider treats "dragged all the way to this ceiling"
 * as no cap at all — so the ceiling must sit at or above every item's real price, or the
 * dearest pieces could never be included.
 */
export function priceCeilingEuros(items: CatalogItem[]): number {
  const maxCents = items.reduce(
    (highest, item) => Math.max(highest, priceCentsFor(item, item.product)),
    0,
  );
  const euros = Math.ceil(maxCents / 100);
  return Math.max(10, Math.ceil(euros / 10) * 10);
}

/**
 * Cards for the product page's "You may also like" row (#45).
 *
 * "Related" = other AVAILABLE items whose product shares a category with the one
 * being viewed, newest first; if that's too thin to fill the row, newest-overall
 * tops it up. The viewed product itself is always excluded.
 *
 * We fetch every candidate available item once and rank in memory (category
 * matches first, else newest) instead of firing two queries — the catalog is
 * small, so one read is simpler and the sort is trivial. Add a `take`/pagination
 * here if the catalog ever grows large.
 *
 * Returns cards in the same one-per-item shape the grid uses, capped at `limit`,
 * so the row reuses <ProductCard> unchanged.
 */
export async function listRelatedCards(product: ProductDetail, limit = 4): Promise<ShopCard[]> {
  const categoryIds = new Set(product.categories.map((category) => category.id));

  const items = await getPrisma().readyMadeItem.findMany({
    where: { available: true, product: { active: true, id: { not: product.id } } },
    // Same shape (and CatalogItem type) as the grid query — colours included to match,
    // though the related row itself doesn't filter by colour.
    include: { product: { include: { categories: true } }, colours: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  // Partition into two piles in ONE pass (each item's category check runs once),
  // then combine — related (same-category) items first, everyone else after. We
  // push in encounter order, so both piles keep the query's newest-first order
  // with no re-sorting.
  const sharesCategory = (item: CatalogItem) =>
    item.product.categories.some((cat) => categoryIds.has(cat.id));

  const sameCategory: CatalogItem[] = [];
  const others: CatalogItem[] = [];
  for (const item of items) {
    (sharesCategory(item) ? sameCategory : others).push(item);
  }
  const orderedItems = [...sameCategory, ...others];

  // One card per available item (same shape as the grid), capped at `limit`.
  return itemsToCards(orderedItems).slice(0, limit);
}
