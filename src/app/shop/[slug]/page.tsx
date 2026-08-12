import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container } from "@/components/layout/container";
import { ItemVersionsViewer } from "@/components/shop/item-versions-viewer";
import { ProductCard } from "@/components/shop/product-card";
import { getProductBySlug, itemOptionsFor, listRelatedCards } from "@/lib/catalog";

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
 * Server component: it runs the catalog read and renders the static shell (breadcrumb,
 * "you may also like"). The interactive two-column region — gallery + info + the item
 * selector that swaps them (#46) — is the <ItemVersionsViewer> client island; this page
 * hands it plain, serializable props and picks which item it opens on.
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

  // Flatten every item into serializable options (resolved price/care) for the island.
  const options = itemOptionsFor(product);

  // Which item does the page OPEN on? Only AVAILABLE items are focusable: the grid only
  // links available ones, and a shared link to a now-sold item shouldn't strand the page.
  // Prefer the one named in ?item= (the shop card links /shop/<slug>?item=<id>); else the
  // newest available (options are newest-first, so [0] is newest). Made-to-order-only → null.
  const availableOptions = options.filter((option) => option.available);
  const initialItemId =
    (availableOptions.find((option) => option.id === itemIdFromUrl) ?? availableOptions[0])?.id ??
    null;

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

      {/* Two columns on desktop (gallery | info), stacked on mobile — mockup .pdp. The
          <ItemVersionsViewer> returns a Fragment of [gallery, info], so those two fill
          the grid's columns directly (a Fragment adds no DOM node of its own). */}
      <div className="grid grid-cols-1 items-start gap-12 pb-5 min-[981px]:grid-cols-[1.05fr_0.95fr]">
        <ItemVersionsViewer
          productName={product.name}
          customizable={product.customizable}
          productDescription={product.description}
          productDimensions={product.dimensions}
          productImages={product.images}
          productPriceCents={product.priceCents}
          productCare={product.care}
          options={options}
          initialItemId={initialItemId}
        />
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
