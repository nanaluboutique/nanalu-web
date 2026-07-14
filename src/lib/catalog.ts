/**
 * Catalog queries (#41) — the only place that decides what the shop shows.
 *
 * Two reads, one per Phase 2 page:
 *   listAvailablePieces()  → the shop grid (#43)
 *   getProductBySlug(slug) → the product page (#45)
 *
 * Design authority is docs/data-model.md, not the mockup: a catalog card is one
 * available ReadyMadeItem, NOT one Product. Five tote versions = five cards, all
 * sharing the parent's name and price (read through the relation, never copied).
 *
 * Pages call these; they never touch `prisma` directly. Keeping the rules here
 * means "what counts as a sellable piece?" has exactly one answer, in one file.
 */

import { getPrisma } from "@/lib/db";

/**
 * Every piece currently for sale, newest first — one row per catalog card.
 *
 * TWO conditions, not one, and they are different kinds of "gone":
 *   available: true           → the piece itself is unsold. A piece is one-of-a-kind,
 *                               so selling it is what retires it (no quantity field).
 *   product: { active: true } → the parent listing isn't discontinued. `active` is our
 *                               soft delete — we never hard-delete a Product, because
 *                               past orders still point at it.
 * A discontinued product must not leak back into the grid through a piece that happens
 * to still be unsold. Hence both.
 *
 * We include the parent (and its categories) because the CARD reads from it: name,
 * price fallback, the "Customizable" tag, and the category filter (#44).
 */
export function listAvailablePieces() {
  return getPrisma().readyMadeItem.findMany({
    where: { available: true, product: { active: true } },
    include: { product: { include: { categories: true } } },
    // Newest first — the default the mockup's sort dropdown opens on. The other sorts
    // (price, most loved) arrive with the sort UI in #44.
    //
    // `id` IS THE TIEBREAKER, and it's required, not decorative: every piece of a
    // product is written by ONE nested `create`, so siblings share an identical
    // createdAt to the millisecond (the seed's 10 pieces have only 5 distinct
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
 * ALL pieces come back, sold ones included — each carries its own `available` flag.
 * Whether the page hides a sold piece or shows it struck through is a rendering call,
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
      // Same tiebreaker as the grid — a product's pieces are exactly the rows that
      // share a createdAt, so this is where ties are guaranteed, not merely likely.
      readyMadeItems: { orderBy: [{ createdAt: "desc" }, { id: "desc" }] },
      customization: { select: { id: true } },
    },
  });
}

/**
 * What a piece actually costs: its own price if it has one, else the parent's.
 *
 * `ReadyMadeItem.priceCents` is a nullable OVERRIDE (docs/data-model.md) — most pieces
 * leave it null and inherit the product's price; one made up in a pricier fabric can
 * set its own. The fallback rule lives here so the grid, the product page, the cart and
 * checkout can't each remember it differently.
 *
 * Money is integer CENTS everywhere — never floats, because 0.1 + 0.2 !== 0.3 in binary
 * floating point and that drift is unacceptable in a total. Formatting cents into
 * "€48.00" is the UI's job, not this file's.
 *
 * Takes the parent SEPARATELY rather than digging for `piece.product`, because the two
 * queries hand us the piece in different shapes: on the grid the parent is nested INSIDE
 * each piece (we included it), while on the product page the pieces sit inside the parent
 * and carry no `product` of their own. One argument each keeps both call sites honest:
 *   grid:         priceCentsFor(piece, piece.product)
 *   product page: priceCentsFor(piece, product)
 *
 * Typed STRUCTURALLY — it asks for the two fields it reads, not for a named model, so any
 * row carrying them fits without either query knowing this helper exists.
 */
export function priceCentsFor(
  piece: { priceCents: number | null },
  product: { priceCents: number },
): number {
  return piece.priceCents ?? product.priceCents;
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
export type CatalogPiece = Awaited<ReturnType<typeof listAvailablePieces>>[number];
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;
