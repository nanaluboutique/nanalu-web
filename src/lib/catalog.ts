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
    include: { product: { include: { categories: true } } },
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
    include: { product: { include: { categories: true } } },
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
