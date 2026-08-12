"use client";

import { AssetImage } from "@/components/ui/asset-image";
import type { ItemOption } from "@/lib/catalog";
import { cn } from "@/lib/cn";

/**
 * The in-stock item selector on the product page (#46) — the mockup's `.iterations`
 * block: one tile per ready-made item of the style, and tapping a tile focuses it.
 *
 * PRESENTATIONAL — it owns NO state. The parent island holds which item is selected
 * (`selectedItemId`) and passes a callback (`onSelect`); this component just draws the
 * row and reports taps. Keeping the "which item" in ONE place (the parent) is what
 * stops the gallery, the price, and this row from ever disagreeing.
 *
 * Shows EVERY item in the style: available ones are clickable, sold ones render as a
 * disabled tile with the ".sold" veil (no buy path). Pieces are numbered across the whole
 * list ("Piece 03" can be the sold one, per the mockup). Renders nothing only when there
 * are no ready-made items at all (a made-to-order-only product) — no empty box.
 */
export function ItemSelector({
  options,
  selectedItemId,
  onSelect,
}: {
  options: ItemOption[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
}) {
  if (options.length === 0) return null;
  // Heading reflects stock: drop "In stock now" once every piece is sold.
  const hasAvailable = options.some((option) => option.available);

  return (
    <div className="iterations">
      <h4>{hasAvailable ? "In stock now — one of a kind" : "One of a kind"}</h4>
      <div className="iter-row" role="group" aria-label="Pieces in this style">
        {options.map((option, index) => {
          // Only an available tile can be the active/selected one.
          const isSelected = option.available && option.id === selectedItemId;
          // Shopper-facing label uses the human word "Piece" (internals stay "item"),
          // numbered by position across ALL pieces: "Piece 01", "Piece 02", … 0-padded.
          const label = `Piece ${String(index + 1).padStart(2, "0")}`;
          return (
            <button
              key={option.id}
              type="button"
              // ".sold" adds the veil; disabled removes it from the tab order + clicks.
              className={cn("iter", !option.available && "sold")}
              disabled={!option.available}
              // aria-pressed only means anything for a selectable tile; omit it on sold.
              aria-pressed={option.available ? isSelected : undefined}
              aria-label={
                option.available
                  ? `Show ${label}${isSelected ? " (shown)" : ""}`
                  : `${label} — sold`
              }
              // A sold tile has no handler (it's disabled anyway); available reports up.
              onClick={option.available ? () => onSelect(option.id) : undefined}
            >
              <div className="ph">
                <AssetImage
                  assetKey={option.images[0] ?? ""}
                  alt=""
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </div>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
