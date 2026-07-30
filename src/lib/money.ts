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
 * avoid elsewhere. `Math.trunc` gives whole euros; `% 100` is the exact
 * remainder in cents (0–99), and padStart keeps it two digits ("€48.05", not
 * "€48.5").
 *
 * The sign is handled EXPLICITLY, on the whole amount, not per-part. We work in
 * absolute cents and prepend "-" ourselves, because splitting a negative with
 * Math.trunc drops the sign for sub-euro amounts: Math.trunc(-50 / 100) is -0,
 * which stringifies to "0", so a naive version turns -50 cents into "€0.50"
 * instead of "€-0.50". (Negatives are a future refund line; positives are today.)
 */
export function formatEuros(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const absCents = Math.abs(cents);
  const euros = Math.trunc(absCents / 100);
  const remainder = absCents % 100;
  return `€${sign}${euros}.${String(remainder).padStart(2, "0")}`;
}
