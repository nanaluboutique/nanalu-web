/**
 * Image-access abstraction (#31) — the single seam between our DB and the image
 * provider (Cloudinary today, an S3-compatible store later; see PLAN §4).
 *
 * We store asset KEYS in the DB (e.g. "products/linen-tote/main"), never full
 * URLs — so the provider isn't baked into every row. This helper is the only
 * place that turns a key into a delivery URL. Swapping providers later means
 * rewriting THIS FILE, not the data or the call sites.
 *
 * Usage:  imageUrl("products/linen-tote/main", { width: 600 })
 */

/**
 * Provider-neutral transform options — the vocabulary every caller uses.
 * Deliberately NOT Cloudinary-shaped: a future provider maps these same options
 * to its own URL syntax, so call sites never change.
 */
export type ImageTransform = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "thumb";
  quality?: number | "auto";
  format?: "auto" | "webp" | "avif" | "jpg" | "png";
};

// The Cloudinary account name. PUBLIC by nature — it appears in every delivered
// image URL — so it carries the NEXT_PUBLIC_ prefix and is safe in the browser
// (URL-building runs client-side too). The secret API key/secret are only for
// UPLOADS (admin, Phase 8), never for delivery, so they stay server-only + unused here.
const CLOUD_NAME = process.env["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"] ?? "";

/**
 * The single function every render path calls: asset key → delivery URL.
 * Returns "" for an empty key so callers can render nothing without a guard.
 */
export function imageUrl(key: string, opts: ImageTransform = {}): string {
  if (!key) return "";
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${cloudinaryTransforms(opts)}/${key}`;
}

/**
 * Build Cloudinary's comma-joined transform segment (the ONLY Cloudinary-specific
 * logic — the swap point). Defaults to f_auto,q_auto: Cloudinary auto-negotiates
 * the best format (webp/avif) and quality per request, our main performance win.
 * Explicit opts override those defaults and add sizing/crop.
 */
function cloudinaryTransforms(opts: ImageTransform): string {
  const tokens = [`f_${opts.format ?? "auto"}`, `q_${opts.quality ?? "auto"}`];
  if (opts.width) tokens.push(`w_${opts.width}`);
  if (opts.height) tokens.push(`h_${opts.height}`);
  if (opts.crop) tokens.push(`c_${opts.crop}`);
  return tokens.join(",");
}
