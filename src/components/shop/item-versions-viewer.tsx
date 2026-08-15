"use client";

import { useState } from "react";
import Link from "next/link";

import { ItemSelector } from "@/components/shop/item-selector";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "@/components/ui/icons";
import type { ItemOption } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatEuros } from "@/lib/money";

/**
 * The interactive product-detail region (#46) — the parent that owns which item is
 * focused. It renders BOTH columns of the product layout (gallery + info block) and
 * keeps them in agreement by holding the ONE piece of shared truth: selectedItemId.
 *
 * It returns a Fragment of [gallery, info]; the page drops it into the two-column grid,
 * so those become the two columns directly (a Fragment adds no DOM node). "Lifting
 * state up" lives here (the Viewer); <ItemSelector> is told + reports taps back.
 *
 * Instant client swap (the #46 design decision): a tap updates state and the URL with NO
 * server round-trip. The product-level fallbacks (productImages / productPriceCents /
 * productCare) cover a made-to-order-only product, which has no available item to focus.
 *
 * Static product-level bits (name, tag, dimensions, returns copy) are passed in as props
 * and rendered here; only price / add-to-cart label / fabric text / care text swap per item.
 */
export function ItemVersionsViewer({
  productName,
  customizable,
  productDescription,
  productDimensions,
  productImages,
  productPriceCents,
  productCare,
  options,
  initialItemId,
}: {
  productName: string;
  customizable: boolean;
  productDescription: string;
  productDimensions: string | null;
  productImages: string[];
  productPriceCents: number;
  productCare: string | null;
  options: ItemOption[];
  initialItemId: string | null;
}) {
  // THE shared truth. Seeded from the id the server picked (from ?item= or the newest
  // available item); every tap replaces it, and the whole region re-renders off it.
  const [selectedItemId, setSelectedItemId] = useState(initialItemId);

  // The item on show, DERIVED (not stored) from the id — one source of truth, no second
  // copy to keep in sync. null for a made-to-order-only product (no available options).
  const selectedItem = options.find((option) => option.id === selectedItemId) ?? null;

  // The four values that SWAP per item — everything else in the render is static. Each
  // reads the focused item, falling back to the product for the made-to-order-only case.
  const images = selectedItem?.images.length ? selectedItem.images : productImages;
  const priceCents = selectedItem ? selectedItem.priceCents : productPriceCents;
  const fabricText = selectedItem?.description ?? null; // accordion "Fabric & materials"
  const care = selectedItem ? selectedItem.care : productCare; // accordion "Care"

  // Whole-product SOLD OUT: no available item AND not customizable, so there's no buy
  // path at all (a customizable product with nothing ready is still made-to-order — the
  // "design your own" CTA covers it, so it is NOT sold out). Drives an explicit sold-out
  // message in place of the price + Add button, instead of silently showing a dead price.
  const soldOut = !selectedItem && !customizable;

  // A tap arrives here from <ItemSelector> (its onSelect). Update the shared truth
  // (re-renders the region) AND rewrite the URL to ?item=<id> so the link is shareable.
  // replaceState (not pushState): swaps the address in place — no new Back-button entry,
  // so Back leaves the page instead of stepping back through every item you tapped.
  //
  // Merge into the EXISTING query rather than overwriting it: build from the current
  // params and set only `item`, so external params the shopper arrived with (utm_source,
  // fbclid, …) survive the tap instead of being clobbered by a bare `?item=<id>`.
  function handleSelect(itemId: string) {
    setSelectedItemId(itemId);
    const params = new URLSearchParams(window.location.search);
    params.set("item", itemId);
    window.history.replaceState(null, "", `?${params}`);
  }

  return (
    <>
      {/* LEFT column — the gallery, driven by the focused item's photos. */}
      <ProductGallery images={images} alt={productName} />

      {/* RIGHT column — the info block (moved from page.tsx; four dynamic spots marked). */}
      <div>
        <span className={cn("tag", customizable ? "tag-custom" : "tag-ooak")}>
          {customizable ? "Customizable" : "One of a kind"}
        </span>

        <h1 className="mt-3 mb-2 text-[2.3rem] leading-[1.08] font-semibold">{productName}</h1>

        {/* (1) DYNAMIC — price of the focused item, OR the sold-out state when a
            non-customizable product has no available item (no buy path). */}
        {soldOut ? (
          <div className="mt-4 mb-1.5">
            <span className="tag tag-ooak">Sold out</span>
            <p className="text-ink-soft mt-2 text-[0.9rem]">
              This one-of-a-kind piece has found a home. Check back soon for new makes.
            </p>
          </div>
        ) : (
          <div className="text-heading font-display mt-4 mb-1.5 text-[1.8rem] font-semibold">
            {formatEuros(priceCents)}
            {customizable && (
              <small className="text-ink-soft font-sans text-[0.85rem] font-semibold">
                {" "}
                · fixed price, any fabric combination
              </small>
            )}
          </div>
        )}

        <p className="text-ink-soft mt-1.5 mb-[22px]">{productDescription}</p>

        {/* The item selector row — between the lede and the CTA, per the mockup. */}
        <ItemSelector options={options} selectedItemId={selectedItemId} onSelect={handleSelect} />

        {customizable && (
          <div className="bg-sage-tint mt-2 mb-2 flex flex-wrap items-center gap-4 rounded-[18px] border border-[color-mix(in_srgb,var(--color-sage)_55%,white)] px-[22px] py-[18px]">
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

        {/* Primary actions — visual stubs (cart + favourites are later phases). (2) The
            Add button's label is DYNAMIC and it only shows when there's an item to add. */}
        <div className="my-5 flex gap-3">
          {selectedItem && (
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

        <div className="accordion mt-2">
          {/* (3) DYNAMIC — the focused item's own fabric & materials text. */}
          {fabricText && (
            <details open>
              <summary>Fabric &amp; materials</summary>
              <div className="body">{fabricText}</div>
            </details>
          )}
          {/* (4) DYNAMIC — the focused item's care (its override, else the product's). */}
          {care && (
            <details>
              <summary>Care</summary>
              <div className="body">{care}</div>
            </details>
          )}
          {productDimensions && (
            <details>
              <summary>Dimensions</summary>
              <div className="body">{productDimensions}</div>
            </details>
          )}
          <details>
            <summary>{customizable ? "Made to order & returns" : "Returns"}</summary>
            <div className="body">
              {customizable
                ? "Custom-made pieces are produced just for you and are exempt from the EU 14-day right of withdrawal — please double-check your fabric choices. Ready-made pieces follow our standard returns policy."
                : "Ready-made pieces follow our standard 14-day returns policy — return them unused, in their original condition."}
            </div>
          </details>
        </div>
      </div>
    </>
  );
}
