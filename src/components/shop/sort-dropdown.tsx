"use client";

import { DEFAULT_SORT, parseShopQuery, SORT_OPTIONS } from "@/lib/shop-query";

import { useFilterParams } from "./use-filter-params";

/**
 * The sort dropdown in the toolbar (#44). Reads the current sort out of the URL and, on
 * change, rewrites ?sort= and navigates — the server then re-renders the grid in the new
 * order. Options come from SORT_OPTIONS (the same list the parser validates against), so
 * the dropdown and the parser can never drift apart.
 *
 * Picking "Newest" (the default) REMOVES the param rather than writing ?sort=newest, so a
 * default view keeps a clean, query-free URL — matching how the other controls behave.
 */
export function SortDropdown() {
  const { current, setParam } = useFilterParams();
  const { sort } = parseShopQuery(current);

  return (
    <div className="sort">
      {/* Visually-hidden label: the closed <select> already shows the chosen option, but
          screen readers still need to know what the control is for. */}
      <label htmlFor="shop-sort" className="sr-only">
        Sort by
      </label>
      <select
        id="shop-sort"
        value={sort}
        onChange={(event) =>
          setParam("sort", event.target.value === DEFAULT_SORT ? null : event.target.value)
        }
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
