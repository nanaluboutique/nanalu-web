"use client";

import { useState } from "react";

import { AssetImage } from "@/components/ui/asset-image";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Product photo gallery (#45) — the one interactive island on the product page.
 *
 * CLIENT component ("use client") because it holds which photo is enlarged in
 * state: clicking a thumbnail (or an arrow) swaps the main image in place. That
 * is the ONLY state it owns. "Which ITEM is selected" is deliberately NOT here —
 * a product has several one-of-a-kind items, and choosing between them is #46,
 * owned by a parent that will sit ABOVE this gallery. Keeping this component
 * "given a list of image keys, show one big + thumbnails" is exactly what lets
 * #46 drive it by simply passing a different item's images.
 *
 * `images` are asset KEYS (not URLs); <AssetImage> turns each key into a
 * Cloudinary image. The page passes the opening item's photos (or the product's
 * as a fallback).
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const count = images.length;

  // Prev/next cycle with wraparound. The functional update form (i => …) reads
  // the latest index, and `+ count` before the modulo keeps prev from going
  // negative (at index 0, (0 - 1 + count) % count = the last photo).
  const showPrev = () => setSelectedIndex((i) => (i - 1 + count) % count);
  const showNext = () => setSelectedIndex((i) => (i + 1) % count);

  // Clamp defensively: if `images` is ever swapped for a shorter list (#46
  // selecting an item with fewer photos), a stale index could point past the
  // end. Falling back to the first key keeps the main image from blanking.
  const mainKey = images[selectedIndex] ?? images[0] ?? "";

  return (
    <div>
      {/* Main image — mockup .main-img (460px tall, rounded, soft shadow). The
          arrows sit on top of it (this box is `relative`), so they only appear
          when there's more than one photo to move between. */}
      <div className="shadow-card relative h-[460px] overflow-hidden rounded-[22px]">
        <AssetImage
          assetKey={mainKey}
          alt={alt}
          fill
          sizes="(max-width: 980px) 100vw, 600px"
          className="object-cover"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={showPrev}
              className="bg-card/80 text-primary hover:bg-card absolute top-1/2 left-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full backdrop-blur-sm transition hover:scale-110"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={showNext}
              className="bg-card/80 text-primary hover:bg-card absolute top-1/2 right-3 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full backdrop-blur-sm transition hover:scale-110"
            >
              <ChevronRightIcon />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails — only when there's more than one shot to switch between. */}
      {count > 1 && (
        <div className="mt-3.5 flex gap-3" role="group" aria-label="Product photos">
          {images.map((key, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={`${index}-${key}`}
                type="button"
                aria-pressed={isSelected}
                aria-label={`Show photo ${index + 1}${isSelected ? " (shown)" : ""}`}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative h-[84px] w-[84px] overflow-hidden rounded-[14px] border-2 p-0 transition-colors",
                  isSelected ? "border-primary" : "hover:border-sage border-transparent",
                )}
              >
                <AssetImage assetKey={key} alt="" fill sizes="84px" className="object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
