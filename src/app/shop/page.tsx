import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/shop/product-card";
import { hasCustomizableWithoutStock, itemsToCards, listAvailableItems } from "@/lib/catalog";

export const metadata: Metadata = { title: "Shop" };

// Render per request, never at build. This page queries the database, but
// `next build` runs with no DATABASE_URL (CI + the Dockerfile builder stage —
// see src/lib/db.ts). Without this, Next would try to statically prerender
// /shop at build time, call getPrisma(), and fail with "Failed to collect page
// data for /shop". force-dynamic defers the query to request time, keeping the
// build database-free (and the catalog fresh when admin edits land later).
export const dynamic = "force-dynamic";

/*
 * The /shop grid (#43). One card per available ready-made item (see
 * docs/data-model.md — one card per item, not per product). Filters, sort, and
 * the toolbar are a separate slice (#44); this page is just the grid + the
 * out-of-stock "design your own" call-to-action.
 *
 * Server component: it runs the catalog reads directly. The two reads are
 * independent, so we await them together. `itemsToCards` (pure) reshapes the
 * flat item list into per-card props; <ProductCard> (client) handles the
 * photo-swap interaction.
 */
export default async function ShopPage() {
  const [items, showCustomizeCta] = await Promise.all([
    listAvailableItems(),
    hasCustomizableWithoutStock(),
  ]);
  const cards = itemsToCards(items);

  return (
    <Container className="pb-16">
      <div className="pt-10 pb-2">
        <nav className="text-ink-soft mb-3.5 text-[0.85rem]" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span className="mx-1.5 opacity-50">/</span>
          Shop all
        </nav>
        <h1 className="text-[clamp(2rem,4vw,2.8rem)] leading-[1.06] font-semibold">
          The whole collection
        </h1>
        <p className="text-ink-soft mt-2 max-w-[52ch]">
          One-of-a-kind sewn &amp; knit pieces — and anything marked <em>customizable</em> can be
          made in your own fabrics.
        </p>
      </div>

      {cards.length > 0 ? (
        <p className="text-ink-soft mt-6 mb-4 text-[0.92rem] font-semibold">
          {cards.length} {cards.length === 1 ? "piece" : "pieces"}
        </p>
      ) : (
        <p className="text-ink-soft mt-10">Nothing in stock right now — please check back soon.</p>
      )}

      <div className="grid grid-cols-2 gap-[22px] min-[981px]:grid-cols-3">
        {cards.map((card) => (
          <ProductCard key={card.defaultItemId} card={card} />
        ))}
      </div>

      {showCustomizeCta && (
        <div className="border-sage bg-sage-tint mt-8 flex flex-wrap items-center gap-4 rounded-[18px] border px-6 py-5">
          <div className="flex-1">
            <h2 className="text-chip-ink font-display text-[1.15rem] font-semibold">
              Looking for something made just for you?
            </h2>
            <p className="text-ink-soft mt-0.5 text-[0.9rem]">
              More made-to-order pieces are waiting in the configurator — pick your own fabrics.
            </p>
          </div>
          <Link href="/customize" className="btn btn-accent">
            Design your own →
          </Link>
        </div>
      )}
    </Container>
  );
}
