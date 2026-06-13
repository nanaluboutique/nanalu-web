import type { HTMLAttributes, SVGProps } from "react";

import { cn } from "@/lib/cn";

/*
 * Logo mark — ported verbatim from the mockup (mockups/shop-pages.html).
 * Yarn ball + knitting needles + pinked (zigzag-cut) plaid swatch + sewing
 * needle. Fills come from the --color-logo-* tokens, so it recolours with the
 * theme. IDs are prefixed to avoid clashing with other SVGs on the page.
 */
const SWATCH_PATH =
  "M34,24 l5,-6 l5,6 l5,-6 l5,6 l5,-6 l5,6 l5,-6 l5,6 l5,-6 l5,6 l5,-6 l5,6 " +
  "l6,5 l-6,5 l6,5 l-6,5 l6,5 l-6,5 l6,5 l-6,5 l6,5 l-6,5 l6,5 l-6,5 " +
  "l-5,6 l-5,-6 l-5,6 l-5,-6 l-5,6 l-5,-6 l-5,6 l-5,-6 l-5,6 l-5,-6 l-5,6 l-5,-6 " +
  "l-6,-5 l6,-5 l-6,-5 l6,-5 l-6,-5 l6,-5 l-6,-5 l6,-5 l-6,-5 l6,-5 l-6,-5 l6,-5 Z";

export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 134 122"
      role="img"
      aria-label="Nanalu Boutique"
      className={className}
      {...props}
    >
      <defs>
        <path id="nl-swatch" d={SWATCH_PATH} />
        <clipPath id="nl-swatch-clip">
          <use href="#nl-swatch" transform="rotate(5 64 54)" />
        </clipPath>
        <clipPath id="nl-yarn-clip">
          <circle cx="47" cy="82" r="29" />
        </clipPath>
      </defs>

      {/* plaid swatch (sage), with pinked edge */}
      <g transform="rotate(5 64 54)">
        <use href="#nl-swatch" fill="var(--color-logo-swatch)" />
      </g>
      <g clipPath="url(#nl-swatch-clip)" opacity={0.85}>
        <rect x="48" y="6" width="9" height="100" fill="var(--color-logo-plaid)" opacity={0.5} />
        <rect x="74" y="6" width="9" height="100" fill="var(--color-logo-plaid)" opacity={0.5} />
        <rect x="20" y="40" width="110" height="9" fill="var(--color-logo-plaid)" opacity={0.5} />
        <rect x="20" y="64" width="110" height="9" fill="var(--color-logo-plaid)" opacity={0.5} />
        <rect x="63" y="6" width="2.4" height="100" fill="var(--color-logo-line)" opacity={0.55} />
        <rect
          x="20"
          y="54.5"
          width="110"
          height="2.4"
          fill="var(--color-logo-line)"
          opacity={0.55}
        />
      </g>
      <g transform="rotate(5 64 54)">
        <use
          href="#nl-swatch"
          fill="none"
          stroke="var(--color-logo-line)"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </g>

      {/* sewing needle + thread */}
      <g stroke="var(--color-logo-line)" fill="none" strokeLinecap="round">
        <path d="M86,106 L126,90" strokeWidth={3.4} />
        <circle cx="121.5" cy="91.8" r="2.6" strokeWidth={1.8} fill="var(--color-bg)" />
        <path d="M124,94 C133,101 127,112 110,114" strokeWidth={1.7} opacity={0.9} />
      </g>

      {/* yarn ball */}
      <circle cx="47" cy="82" r="29" fill="var(--color-logo-yarn)" />
      <g
        clipPath="url(#nl-yarn-clip)"
        stroke="var(--color-logo-line)"
        strokeWidth={2.2}
        fill="none"
        opacity={0.75}
      >
        <path d="M16,72 Q47,90 78,70" />
        <path d="M18,88 Q49,104 77,86" />
        <path d="M26,60 Q50,74 74,98" />
        <path d="M34,108 Q38,76 58,55" />
        <path d="M64,108 Q70,84 76,76" />
      </g>
      <circle
        cx="47"
        cy="82"
        r="29"
        fill="none"
        stroke="var(--color-logo-line)"
        strokeWidth={2.2}
      />

      {/* knitting needles */}
      <g stroke="var(--color-logo-line)" strokeWidth={2.6} strokeLinecap="round">
        <path d="M39,62 L23,30" />
        <path d="M51,59 L45,22" />
      </g>
      <circle
        cx="22"
        cy="27"
        r="3.6"
        fill="var(--color-logo-cap)"
        stroke="var(--color-logo-line)"
        strokeWidth={1.6}
      />
      <circle
        cx="44.5"
        cy="19"
        r="3.6"
        fill="var(--color-logo-cap)"
        stroke="var(--color-logo-line)"
        strokeWidth={1.6}
      />
    </svg>
  );
}

/*
 * Wordmark — "Nanalu" (Fraunces 600) over small-caps "Boutique" (Karla, .38em).
 * Inherits colour from the parent (currentColor) so it works on any surface.
 */
export function Wordmark({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("inline-flex flex-col items-center leading-none", className)} {...props}>
      <span className="font-display text-[1.26rem] font-semibold">Nanalu</span>
      {/*
        letter-spacing adds .38em to the RIGHT of every glyph, incl. the last —
        that trailing space pushes the centred word left. The -mr-[0.38em]
        cancels it so "Boutique" centres optically under "Nanalu".
      */}
      <span className="mt-1 -mr-[0.38em] font-sans text-[0.58rem] font-bold tracking-[0.38em] uppercase opacity-[0.72]">
        Boutique
      </span>
    </span>
  );
}

/* Brand lockup — mark + wordmark side by side, as in the header. */
export function Brand({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)} {...props}>
      <Logo className="h-10 w-auto" />
      <Wordmark />
    </span>
  );
}

/*
 * Favicon mark — the sewing-forward plaid swatch, rounded square.
 *  - "lavender" (variant D) is the one that renders in the browser tab,
 *    kept in sync with src/app/icon.svg.
 *  - "sage" (variant B) is an alternate kept available in the styleguide.
 */
const FAVICON_VARIANTS = {
  lavender: { base: "#efe6f0", line: "#7a5a7d", stroke: "#5a4060" },
  sage: { base: "#e8eedd", line: "#57693f", stroke: "#57693f" },
} as const;

interface FaviconMarkProps extends SVGProps<SVGSVGElement> {
  variant?: keyof typeof FAVICON_VARIANTS;
}

export function FaviconMark({ variant = "lavender", className, ...props }: FaviconMarkProps) {
  const c = FAVICON_VARIANTS[variant];
  const clip = `nl-fav-${variant}`;
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="Nanalu Boutique favicon"
      className={className}
      {...props}
    >
      <defs>
        <clipPath id={clip}>
          <rect x="10" y="10" width="80" height="80" rx="18" />
        </clipPath>
      </defs>
      <rect x="10" y="10" width="80" height="80" rx="18" fill={c.base} />
      <g clipPath={`url(#${clip})`}>
        <rect x="34" y="8" width="7" height="84" fill={c.line} opacity={0.5} />
        <rect x="60" y="8" width="7" height="84" fill={c.line} opacity={0.5} />
        <rect x="8" y="34" width="84" height="7" fill={c.line} opacity={0.5} />
        <rect x="8" y="60" width="84" height="7" fill={c.line} opacity={0.5} />
        <rect x="49" y="8" width="4" height="84" fill={c.line} />
        <rect x="8" y="49" width="84" height="4" fill={c.line} />
      </g>
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        rx="18"
        fill="none"
        stroke={c.stroke}
        strokeWidth={3}
      />
    </svg>
  );
}
