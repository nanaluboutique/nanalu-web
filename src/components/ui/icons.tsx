import type { SVGProps } from "react";

/*
 * Line icons used in the header. Paths for search / heart / cart are copied
 * verbatim from the mockup (mockups/shop-pages.html); the user icon is added
 * in the same outline style for the account action.
 *
 * All share a 24×24 viewBox and draw with `stroke="currentColor"`, so they
 * inherit the surrounding text colour and can be sized with width/height.
 */
type IconProps = SVGProps<SVGSVGElement>;

// Shared defaults so every icon strokes identically. A caller can still
// override any of these (e.g. a different size) via props.
const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.2,
  "aria-hidden": true,
};

export function SearchIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...base} {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" strokeLinecap="round" />
    </svg>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...base} {...props}>
      <path
        d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg width={18} height={18} {...base} {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg width={20} height={20} {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function CartIcon(props: IconProps) {
  return (
    <svg width={17} height={17} {...base} {...props}>
      <path
        d="M6 7h13l-1.2 9.5a2 2 0 01-2 1.7H9.2a2 2 0 01-2-1.7L6 4H3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
