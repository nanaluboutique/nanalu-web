"use client";

import { useState } from "react";
import Link from "next/link";

import { AssetImage } from "@/components/ui/asset-image";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { HeartIcon } from "@/components/ui/icons";
import type { ShopCard } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatEuros } from "@/lib/money";

/**
 * A single shop-grid card (#43) — one available ready-made item, shown H&M/
 * Zalando-style: photo, the parent product's name + price, and a Customizable /
 * One-of-a-kind tag. Reused by the product page's "you may also like" row (#45).
 *
 * CLIENT component because it holds photo-swap state. A product's sibling items
 * appear as thumbnails; picking one swaps the card's photo in place — and because
 * the card then shows that item, its price and its "view details" link retarget to
 * the selected item too (the link carries ?item=<id> so the product page opens
 * focused on it). Thumbnails only show when there's more than one sibling.
 *
 * The heart and Add button are deliberate visual stubs for now (cart + favourites
 * are later phases); they render and focus but do nothing yet.
 */
export function ProductCard({ card }: { card: ShopCard }) {
  const [selectedItemId, setSelectedItemId] = useState(card.defaultItemId);

  // The sibling currently on display. Falls back to the first sibling if the
  // selected id ever doesn't match (it always should — the default is one of the
  // siblings). itemsToCards never emits a card with no siblings, but this
  // component is reused (the product page's "you may also like" row, #45), so we
  // guard: a card with nothing to show renders nothing rather than crashing.
  // (The guard sits AFTER useState so hooks always run in the same order.)
  const selectedItem =
    card.itemSiblings.find((sibling) => sibling.itemId === selectedItemId) ?? card.itemSiblings[0];
  if (!selectedItem) return null;

  const productHref = `/shop/${card.productSlug}?item=${selectedItem.itemId}`;

  return (
    <Card className="relative flex flex-col">
      <div className="ph">
        {/* The photo is the click target for the whole card (see .card-link),
            but the heart/thumbnails/Add sit above that overlay and stay clickable. */}
        <AssetImage
          assetKey={selectedItem.imageKey}
          alt={card.productName}
          fill
          sizes="(max-width: 980px) 50vw, 300px"
          className="object-cover"
        />
        <span className={cn("badge tag", card.customizable ? "tag-custom" : "tag-ooak")}>
          {card.customizable ? "Customizable" : "One of a kind"}
        </span>
        <button type="button" className="fav" aria-label={`Save ${card.productName} to favorites`}>
          <HeartIcon />
        </button>
      </div>

      <CardBody className="flex flex-1 flex-col">
        <h3>
          <Link href={productHref} className="card-link">
            {card.productName}
          </Link>
        </h3>
        {card.category && <div className="card-sub">{card.category}</div>}

        {card.itemSiblings.length > 1 && (
          <div className="card-swatches" role="group" aria-label="Other pieces in this style">
            {card.itemSiblings.map((sibling, index) => {
              const isSelected = sibling.itemId === selectedItem.itemId;
              return (
                <button
                  key={sibling.itemId}
                  type="button"
                  className="card-swatch"
                  aria-pressed={isSelected}
                  aria-label={`Show piece ${index + 1}${isSelected ? " (shown)" : ""}`}
                  onClick={() => setSelectedItemId(sibling.itemId)}
                >
                  <AssetImage
                    assetKey={sibling.imageKey}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}

        <div className="card-foot">
          <span className="price">{formatEuros(selectedItem.priceCents)}</span>
          <Button variant="accent" size="sm">
            Add
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
