"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { updateParam } from "@/lib/shop-query";

/**
 * The shared "read the URL, change one param, navigate" logic for the shop's interactive
 * filter controls (#44): the sort dropdown, the availability checkboxes, and the price
 * slider.
 *
 * Each of those does the SAME thing when the shopper changes it — read the current query
 * params, produce the next query string with ONE param changed, and navigate there so the
 * server re-renders the filtered grid. This hook bundles that so the three components
 * don't each repeat it. (The category rows and the chips don't use it: they're plain
 * <Link>s rendered on the server, so their navigation is the click itself.)
 *
 * It must be a HOOK, not a plain helper function, because it calls useRouter and
 * useSearchParams — React hooks only run inside a component or another hook.
 *
 * Returns:
 *   current  — the current params as a plain, mutable URLSearchParams. A control reads
 *              its own value from this (via parseShopQuery) and hands it to updateParam.
 *   setParam — change one param and navigate; value = null removes it (back to default).
 */
export function useFilterParams() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // useSearchParams returns a READ-ONLY view (no .set/.delete). Copy it into a plain,
  // mutable URLSearchParams so updateParam can clone + edit it.
  const current = new URLSearchParams(searchParams.toString());

  function setParam(key: string, value: string | null) {
    const queryString = updateParam(current, key, value);
    // scroll: false keeps the shopper's place in the grid — without it, Next scrolls to
    // the top of the page on every filter toggle, which feels broken mid-browse.
    router.push(queryString ? `/shop?${queryString}` : "/shop", { scroll: false });
  }

  return { current, setParam };
}
