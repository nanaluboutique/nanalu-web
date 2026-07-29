/**
 * Money formatting — the one place integer cents become a human "€48.00".
 *
 * Money is stored and passed around as integer CENTS everywhere (4800, not
 * 48.00), because floats drift: 0.1 + 0.2 !== 0.3 in binary floating point, and
 * that drift must never reach a total. Cents only become a decimal string at the
 * very edge — render time — which is exactly here.
 *
 * We build the string from two exact integers instead of `(cents / 100)
 * .toFixed(2)` — that route turns money into a float first, the very thing we
 * avoid elsewhere. `Math.trunc` gives whole euros; `cents % 100` is the exact
 * remainder in cents (0–99), and padStart keeps it two digits ("€48.05", not
 * "€48.5"). Math.abs on the remainder guards a future negative (a refund line):
 * -4805 cents should read "€-48.05", not "€-48.-5".
 */
export function formatEuros(cents: number): string {
  const euros = Math.trunc(cents / 100);
  const remainder = Math.abs(cents % 100);
  return `€${euros}.${String(remainder).padStart(2, "0")}`;
}
