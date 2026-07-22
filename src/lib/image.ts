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
//
// Must be DOT notation: Next inlines `process.env.NEXT_PUBLIC_*` into the browser
// bundle by textually matching that exact form. The bracket form
// (process.env["NEXT_PUBLIC_..."]) is not recognized by Turbopack (our default
// compiler in Next 16), so it would compile to undefined client-side → broken URLs.
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

/**
 * The single function every render path calls: asset key → delivery URL.
 * Returns "" for an empty key so callers can render nothing without a guard.
 *
 * By default (no opts) this returns the ORIGINAL, untransformed image — on
 * purpose. Our images render through next/image (via <AssetImage>), and Next's
 * optimizer resizes + re-encodes them in a SINGLE pass. If we ALSO asked
 * Cloudinary to compress, the image would be squeezed twice (a photocopy of a
 * photocopy, slight quality loss) AND our resizing would ride on a
 * Cloudinary-specific feature — the opposite of the swappable-storage goal
 * (PLAN §4). So Next owns optimization and the store is treated as a plain
 * origin, which keeps swapping Cloudinary → S3-compatible a one-file change.
 * Pass opts only for a URL that BYPASSES next/image (e.g. an og:image meta tag),
 * where you do want the provider to optimize because Next isn't in the loop.
 */
export function imageUrl(key: string, opts: ImageTransform = {}): string {
  if (!key) return "";
  if (!CLOUD_NAME) {
    // Fail loud, not silent: with no cloud name the URL is malformed
    // (res.cloudinary.com//image/...) and images die with no obvious cause.
    console.warn(
      "imageUrl: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set — image URLs will be broken.",
    );
  }
  // No opts → transforms is "" → deliver the original (…/upload/<key>).
  // With opts → insert the transform segment (…/upload/<transforms>/<key>).
  const transforms = cloudinaryTransforms(opts);
  const path = transforms ? `${transforms}/${key}` : key;
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${path}`;
}

/**
 * Build Cloudinary's comma-joined transform segment from EXPLICIT opts only (the
 * ONLY Cloudinary-specific logic — the swap point). No opts → "" → the original
 * image, because Next's optimizer, not Cloudinary, does our resizing/format/
 * quality (see imageUrl). Each provided opt maps to one Cloudinary token.
 */
function cloudinaryTransforms(opts: ImageTransform): string {
  const tokens: string[] = [];
  if (opts.format) tokens.push(`f_${opts.format}`);
  if (opts.quality) tokens.push(`q_${opts.quality}`);
  if (opts.width) tokens.push(`w_${opts.width}`);
  if (opts.height) tokens.push(`h_${opts.height}`);
  if (opts.crop) tokens.push(`c_${opts.crop}`);
  return tokens.join(",");
}
