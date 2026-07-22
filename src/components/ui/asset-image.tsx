import Image, { type ImageProps } from "next/image";

import { imageUrl } from "@/lib/image";

/**
 * `<AssetImage>` (#42) — the one component the app renders images through.
 *
 * It joins our two seams. `imageUrl()` (#31) already turns an asset KEY (what
 * the DB stores, e.g. "products/linen-tote/main") into a Cloudinary delivery
 * URL — but that's just a string. To actually paint an <img> with lazy loading,
 * a responsive srcset, and reserved space (no layout shift), we still need
 * next/image's <Image>. This wraps the two together so a call site passes a KEY
 * and gets an optimized picture — never a URL, never next/image, by hand.
 *
 * Keeping the glue in one place is the point: it's the only spot the key→URL
 * step can't be forgotten or bypassed with a hardcoded res.cloudinary.com URL,
 * so swapping providers later stays a one-file change (src/lib/image.ts).
 *
 * Everything <Image> accepts, this accepts — we only take over `src` (derived
 * from `assetKey`). So you still pass width/height OR fill, plus sizes/priority/
 * alt/className exactly as you would to next/image:
 *
 *   <AssetImage assetKey={key} alt="Linen tote" width={600} height={600} />
 *   <AssetImage assetKey={key} alt="Linen tote" fill sizes="(max-width: 768px) 50vw, 300px" />
 *
 * Why remote images need next.config `remotePatterns` (see next.config.ts):
 * given a remote URL, <Image> doesn't hotlink it — it routes through Next's own
 * optimizer (/_next/image), whose SERVER fetches the Cloudinary image, resizes
 * it, and serves the result. remotePatterns is the allowlist that says that
 * server-side fetch to res.cloudinary.com is intentional (an anti-SSRF guard).
 */
type AssetImageProps = Omit<ImageProps, "src"> & {
  /** Asset key from the DB — NOT a URL. imageUrl() builds the URL. */
  assetKey: string;
};

export function AssetImage({ assetKey, alt, ...props }: AssetImageProps) {
  // No key → render nothing, honoring imageUrl()'s empty-key contract. Without
  // this, imageUrl("") returns "" and <Image src=""> throws (next/image demands
  // a non-empty src) — so an image-less thing (a made-to-order piece with no
  // photo, an absent gallery slot) would crash its card instead of just omitting
  // the image. A real "made to order" placeholder can replace this null later.
  if (!assetKey) return null;

  // `alt` is pulled out (not left in `...props`) so it's visibly passed to
  // <Image> — the a11y linter can't see a prop that only arrives via a spread,
  // and alt is required (ImageProps demands it), so we make that explicit.
  return <Image src={imageUrl(assetKey)} alt={alt} {...props} />;
}
