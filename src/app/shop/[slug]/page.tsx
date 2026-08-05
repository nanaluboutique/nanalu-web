import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "@/components/ui/icons";
import { careFor, getProductBySlug, listRelatedCards, priceCentsFor } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatEuros } from "@/lib/money";

// Render per request, never at build — same reason as /shop (see that file and
// src/lib/db.ts): this page queries the database, but `next build` runs with no
// DATABASE_URL. force-dynamic defers the query to request time, keeping the
// build database-free.
export const dynamic = "force-dynamic";

// Per-product <title>/description, so each page is distinct in the browser tab and
// in search results (without this, every product inherits the generic site title).
// This re-reads the product (a second query per request); fine for these low-traffic
// pages — wrap getProductBySlug in React `cache()` later if it ever matters.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return { title: product.name, description: product.description };
}

/*
 * The product detail page (#45), served at /shop/[slug] — e.g. /shop/linen-tote-bag.
 *
 * Server component: it runs the catalog read directly and renders HTML on the
 * server. Only the photo gallery will need the browser (it reacts to clicks), so
 * that one part becomes a small client island in step 4; everything else is here.
 */
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ item?: string | string[] }>;
}) {
  const { slug } = await params;
  // A repeated ?item= (e.g. ?item=a&item=b) arrives as an array; take the first so
  // itemIdFromUrl is a single id or undefined.
  const { item } = await searchParams;
  const itemIdFromUrl = Array.isArray(item) ? item[0] : item;

  // One catalog read. Returns null for an unknown slug OR a discontinued product,
  // so a single null check covers both "no such page" cases. notFound() returns
  // `never`, which also narrows `product` to non-null for the rest of the file.
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  // Which item does the page OPEN on? Only AVAILABLE items are focusable: the grid
  // only ever links available ones, and a shared link pointing at a now-sold item
  // shouldn't strand the page. Prefer the one named in ?item= (the shop card links
  // /shop/<slug>?item=<id>); else the newest available item — readyMadeItems is
  // already newest-first, so [0] is newest. A made-to-order-only product has none,
  // so this is null.
  //
  // Reading ?item= to pick the OPENING item is all we do here. The item selector
  // and keeping the URL in sync as you click between items is #46.
  const availableItems = product.readyMadeItems.filter((item) => item.available);
  const defaultItem =
    availableItems.find((item) => item.id === itemIdFromUrl) ?? availableItems[0] ?? null;

  // The price shown is the price of what's shown: the opening item's resolved
  // price (its own override, else the product's). No available item → the product's.
  const priceCents = defaultItem ? priceCentsFor(defaultItem, product) : product.priceCents;

  // The photo set the gallery will show (wired up in step 4): the opening item's
  // own photos, or the product's shared shots as a fallback for made-to-order-only.
  const galleryImages = defaultItem?.images.length ? defaultItem.images : product.images;

  // Care text for the accordion: the opening item's own care if it set an override,
  // else the product's (careFor). Null when neither is set → the Care section hides.
  const care = defaultItem ? careFor(defaultItem, product) : product.care;

  // Breadcrumb middle link: the product's first category (the M:N can hold several).
  // Points at /shop for now; it deep-links to the filtered category once #44 lands.
  const category = product.categories[0] ?? null;

  // The "you may also like" row — same-category items first (see listRelatedCards).
  const relatedCards = await listRelatedCards(product);

  return (
    <Container className="pb-16">
      {/* Breadcrumb — same look as the /shop grid's, done with utilities. */}
      <nav className="text-ink-soft pt-10 pb-3.5 text-[0.85rem]" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-1.5 opacity-50">/</span>
        {category && (
          <>
            <Link href="/shop" className="hover:text-primary">
              {category.name}
            </Link>
            <span className="mx-1.5 opacity-50">/</span>
          </>
        )}
        {product.name}
      </nav>

      {/* Two columns on desktop (gallery | info), stacked on mobile — mockup .pdp. */}
      <div className="grid grid-cols-1 items-start gap-12 pb-5 min-[981px]:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT — the photo gallery (client island). It owns only which photo is
            enlarged; the page hands it the opening item's image keys. */}
        <ProductGallery images={galleryImages} alt={product.name} />

        {/* RIGHT — the info block (all server-rendered, no interactivity). */}
        <div>
          <span className={cn("tag", product.customizable ? "tag-custom" : "tag-ooak")}>
            {product.customizable ? "Customizable" : "One of a kind"}
          </span>

          <h1 className="mt-3 mb-2 text-[2.3rem] leading-[1.08] font-semibold">{product.name}</h1>

          <div className="text-heading font-display mt-4 mb-1.5 text-[1.8rem] font-semibold">
            {formatEuros(priceCents)}
            {product.customizable && (
              <small className="text-ink-soft font-sans text-[0.85rem] font-semibold">
                {" "}
                · fixed price, any fabric combination
              </small>
            )}
          </div>

          <p className="text-ink-soft mt-1.5 mb-[22px]">{product.description}</p>

          {/* "Design your own" — only for customizable products. Sends the shopper
              to the configurator; the same fixed price, their choice of fabric. */}
          {product.customizable && (
            <div className="bg-sage-tint mb-2 flex flex-wrap items-center gap-4 rounded-[18px] border border-[color-mix(in_srgb,var(--color-sage)_55%,white)] px-[22px] py-[18px]">
              <div className="flex-1">
                <p className="text-chip-ink font-display text-[1.15rem] font-semibold">
                  Want a different fabric?
                </p>
                <p className="text-ink-soft mt-0.5 text-[0.88rem]">
                  Design your own in the configurator — same price, your fabrics.
                </p>
              </div>
              <Link href="/customize" className="btn btn-accent">
                Design your own →
              </Link>
            </div>
          )}

          {/* Primary actions — VISUAL STUBS for now (cart + favourites are later
              phases), exactly like <ProductCard>'s Add/heart. They render and focus
              but do nothing; wiring them later means moving them into a client
              island. Add-to-cart shows only when there's an in-stock item to add. */}
          <div className="my-5 flex gap-3">
            {defaultItem && (
              <Button variant="primary" className="flex-1 justify-center">
                Add to cart — {formatEuros(priceCents)}
              </Button>
            )}
            <Button
              variant="ghost"
              aria-label="Save to favorites"
              className="w-[52px] flex-none justify-center px-0"
            >
              <HeartIcon />
            </Button>
          </div>

          {/* Info accordion — native <details>/<summary>, so the browser handles
              open/close (no client JS). Each data-driven section renders only when
              it has content; the returns section is static shop-wide policy. */}
          <div className="accordion mt-2">
            {defaultItem && (
              <details open>
                <summary>Fabric &amp; materials</summary>
                <div className="body">{defaultItem.description}</div>
              </details>
            )}
            {care && (
              <details>
                <summary>Care</summary>
                <div className="body">{care}</div>
              </details>
            )}
            {product.dimensions && (
              <details>
                <summary>Dimensions</summary>
                <div className="body">{product.dimensions}</div>
              </details>
            )}
            <details>
              <summary>{product.customizable ? "Made to order & returns" : "Returns"}</summary>
              <div className="body">
                {product.customizable
                  ? "Custom-made pieces are produced just for you and are exempt from the EU 14-day right of withdrawal — please double-check your fabric choices. Ready-made pieces follow our standard returns policy."
                  : "Ready-made pieces follow our standard 14-day returns policy — return them unused, in their original condition."}
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* "You may also like" — reuses the shop grid's <ProductCard> and its grid.
          Hidden entirely when there's nothing to suggest. */}
      {relatedCards.length > 0 && (
        <section className="pt-[26px] pb-2.5">
          <h2 className="mb-[18px] text-[1.5rem] font-semibold">You may also like</h2>
          <div className="grid grid-cols-2 gap-[22px] min-[981px]:grid-cols-3">
            {relatedCards.map((card) => (
              <ProductCard key={card.defaultItemId} card={card} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
