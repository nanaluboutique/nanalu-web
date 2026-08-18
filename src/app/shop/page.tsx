import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { ActiveFilterChips } from "@/components/shop/active-filter-chips";
import { AvailabilityFilter } from "@/components/shop/availability-filter";
import { CategoryFilter } from "@/components/shop/category-filter";
import { PriceFilter } from "@/components/shop/price-filter";
import { ProductCard } from "@/components/shop/product-card";
import { SortDropdown } from "@/components/shop/sort-dropdown";
import {
  applyShopQuery,
  categoryOptions,
  hasCustomizableWithoutStock,
  itemsToCards,
  listAvailableItems,
  priceCeilingEuros,
} from "@/lib/catalog";
import { parseShopQuery } from "@/lib/shop-query";

export const metadata: Metadata = { title: "Shop" };

// Render per request, never at build. This page queries the database, but
// `next build` runs with no DATABASE_URL (CI + the Dockerfile builder stage —
// see src/lib/db.ts). Without this, Next would try to statically prerender
// /shop at build time, call getPrisma(), and fail with "Failed to collect page
// data for /shop". force-dynamic defers the query to request time, keeping the
// build database-free (and the catalog fresh when admin edits land later).
export const dynamic = "force-dynamic";

/**
 * Next hands searchParams as `{ key: string | string[] | undefined }`, but parseShopQuery
 * wants a URLSearchParams. Convert once here. Every shop param is single-valued; if a key
 * is ever repeated in the URL (`?category=a&category=b`), we take the first — one filter,
 * one value.
 */
function toSearchParams(raw: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0] !== undefined) {
      params.set(key, value[0]);
    }
  }
  return params;
}

/*
 * The /shop grid + filters (#43, #44). One card per available ready-made item (see
 * docs/data-model.md — one card per item, not per product).
 *
 * Server component: it reads the URL (searchParams), fetches the catalog once, then
 * filters/sorts IN MEMORY via the pure catalog helpers. The URL is the whole filter state,
 * so a filtered view is shareable and works with the Back button; the interactive controls
 * (sort, availability, price) are small client islands that only rewrite the URL, while the
 * category rows and chips are plain server-rendered links.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = toSearchParams(await searchParams);
  const query = parseShopQuery(params);

  // One broad read (all available + active items), then everything else is derived from it.
  const [items, showCustomizeCta] = await Promise.all([
    listAvailableItems(),
    hasCustomizableWithoutStock(),
  ]);

  const cards = itemsToCards(applyShopQuery(items, query)); // filtered + sorted → cards
  const categories = categoryOptions(items); // sidebar rows (from the FULL list)
  const ceilingEuros = priceCeilingEuros(items); // price slider's top end
  const totalCount = items.length; // "All pieces N"
  const resultCount = cards.length; // toolbar "N pieces"

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

      <div className="catalog-grid">
        <aside className="filters">
          <CategoryFilter
            categories={categories}
            activeCategory={query.category}
            totalCount={totalCount}
            current={params}
          />
          <AvailabilityFilter />
          <PriceFilter ceilingEuros={ceilingEuros} />
        </aside>

        <div className="catalog-main">
          <div className="toolbar">
            <span className="count">
              {resultCount} {resultCount === 1 ? "piece" : "pieces"}
            </span>
            <ActiveFilterChips query={query} categories={categories} current={params} />
            <SortDropdown />
          </div>

          {resultCount > 0 ? (
            <div className="grid grid-cols-2 gap-[22px] min-[981px]:grid-cols-3">
              {cards.map((card) => (
                <ProductCard key={card.defaultItemId} card={card} />
              ))}
            </div>
          ) : (
            <p className="text-ink-soft mt-4">
              {totalCount === 0
                ? "Nothing in stock right now — please check back soon."
                : "No pieces match these filters. Try clearing one above."}
            </p>
          )}
        </div>
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
