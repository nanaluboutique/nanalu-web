import Link from "next/link";

import type { CategoryOption } from "@/lib/catalog";
import { updateParam } from "@/lib/shop-query";

/**
 * The Category section of the filter sidebar (#44).
 *
 * A SERVER component — each row is a plain <Link>, so choosing a category is real
 * navigation with no client JS. Rows come from categoryOptions (piece 2): every category
 * that has stock, with its "Pouches 5" count. An "All pieces" row on top clears the
 * category filter and shows the whole in-stock total.
 *
 * Single-select, like the mockup: clicking a category SETS ?category=<slug> (replacing any
 * previous one); "All pieces" REMOVES it. The active row is marked aria-current="true", so
 * accessibility and the highlight (.filter-list a[aria-current="true"]) stay in sync.
 *
 * `current` is the page's live URLSearchParams, threaded in so each href keeps the other
 * active filters (sort, price, availability) — updateParam changes only the category key.
 */
type CategoryFilterProps = {
  categories: CategoryOption[];
  activeCategory: string | null; // the selected slug, or null = "All pieces"
  totalCount: number; // in-stock item count, for the "All pieces" tally
  current: URLSearchParams;
};

export function CategoryFilter({
  categories,
  activeCategory,
  totalCount,
  current,
}: CategoryFilterProps) {
  // Build a category row's href: change only the `category` key (null = drop it), keep the
  // rest. Empty string = every filter is at its default, so link to the clean /shop.
  const hrefFor = (slug: string | null) => {
    const queryString = updateParam(current, "category", slug);
    return queryString ? `/shop?${queryString}` : "/shop";
  };

  return (
    <>
      <h4>Category</h4>
      <ul className="filter-list">
        <li>
          <Link href={hrefFor(null)} aria-current={activeCategory === null ? "true" : undefined}>
            All pieces <span className="n">{totalCount}</span>
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={hrefFor(category.slug)}
              aria-current={activeCategory === category.slug ? "true" : undefined}
            >
              {category.name} <span className="n">{category.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
