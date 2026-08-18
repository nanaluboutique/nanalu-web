"use client";

import { useState } from "react";

import { parseShopQuery } from "@/lib/shop-query";

import { useFilterParams } from "./use-filter-params";

/**
 * The Price section of the filter sidebar (#44): a single "up to €X" slider.
 *
 * A range input fires its change event CONTINUOUSLY as you drag, so writing the URL on
 * every step would flood history and re-filter the grid on every pixel. Instead we keep a
 * LOCAL value that the thumb follows instantly (no navigation), and COMMIT to the URL only
 * when the drag or keypress ends (onPointerUp / onKeyUp).
 *
 * The slider runs 0..ceilingEuros (from priceCeilingEuros). Dragged to the very top means
 * "no cap", so committing at the ceiling REMOVES the param — a default view stays clean,
 * consistent with the other controls. Everything here is whole euros; parseShopQuery turns
 * the euros in the URL into the integer cents the filter compares against.
 */
export function PriceFilter({ ceilingEuros }: { ceilingEuros: number }) {
  const { current, setParam } = useFilterParams();
  const { maxPriceCents } = parseShopQuery(current);

  // What the URL implies: the cap in euros, or the ceiling (= "no cap") when there's none.
  const urlValue = maxPriceCents === null ? ceilingEuros : maxPriceCents / 100;

  // Local copy so dragging moves the thumb without a navigation per step.
  const [value, setValue] = useState(urlValue);

  // Resync when the URL changes from OUTSIDE this slider — the price chip's ×, or the Back
  // button. This is React's "adjust state during render" pattern (NOT an effect): when
  // urlValue changes, record the new one and snap the thumb to match. During a drag urlValue
  // is unchanged (we haven't committed), so the local value wins; only an external change
  // moves the thumb. React re-runs the render immediately with the updated state.
  const [lastUrlValue, setLastUrlValue] = useState(urlValue);
  if (urlValue !== lastUrlValue) {
    setLastUrlValue(urlValue);
    setValue(urlValue);
  }

  // Push the thumb's position to the URL. At the ceiling = no cap = drop the param.
  const commit = () => {
    setParam("maxPrice", value >= ceilingEuros ? null : String(value));
  };

  const atCeiling = value >= ceilingEuros;

  return (
    <>
      <h4>Price</h4>
      <input
        type="range"
        className="price-range"
        min={0}
        max={ceilingEuros}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        aria-label={`Maximum price: ${atCeiling ? "no limit" : `€${value}`}`}
      />
      <div className="price-range-labels">
        <span>€0</span>
        <span>{atCeiling ? `€${ceilingEuros}+` : `€${value}`}</span>
      </div>
    </>
  );
}
