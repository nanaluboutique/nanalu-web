"use client";

import { parseShopQuery } from "@/lib/shop-query";

import { useFilterParams } from "./use-filter-params";

/**
 * The Availability section of the filter sidebar (#44): two checkboxes, "Ready to ship"
 * and "Customizable". A CLIENT component — checkboxes fire change events — reusing the
 * useFilterParams hook (its second caller) to read the URL and write the next one.
 *
 * Both boxes default to CHECKED, so the URL only carries a param when a box is turned OFF
 * (`ready=0` / `custom=0`). That's the inverse of the other controls, and it keeps a
 * default view's URL clean. So the onChange writes:
 *   checked (the default) → null → drop the param
 *   unchecked             → "0" → the off-marker parseShopQuery looks for
 *
 * The filtering these drive is an OR (applyShopQuery, piece 2): unchecking "Ready to ship"
 * (leaving "Customizable") is the one move that narrows the grid — to customizable pieces.
 */
export function AvailabilityFilter() {
  const { current, setParam } = useFilterParams();
  const { ready, customizable } = parseShopQuery(current);

  return (
    <>
      <h4>Availability</h4>
      <label className="check">
        <input
          type="checkbox"
          checked={ready}
          onChange={(event) => setParam("ready", event.target.checked ? null : "0")}
        />
        Ready to ship
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={customizable}
          onChange={(event) => setParam("custom", event.target.checked ? null : "0")}
        />
        Customizable
      </label>
    </>
  );
}
