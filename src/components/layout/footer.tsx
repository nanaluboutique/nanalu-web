import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { InstagramIcon } from "@/components/ui/icons";
import { Brand } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

/*
 * Site footer — a lavender band that bookends the lavender navbar, with dark
 * `on-nav` text (same treatment as the header). Brand block + link columns +
 * a (non-functional) newsletter stub + a legal bar.
 *
 * Destinations are placeholder stubs for now; real legal/content is Phase 9.
 */
const INSTAGRAM_URL = "https://instagram.com/nanaluboutique";

// A footer link's label may be text or an icon, and may point off-site.
type FooterLink = {
  label: ReactNode;
  href: string;
  external?: boolean;
  ariaLabel?: string;
};

const COLUMNS: { title: string; links: FooterLink[]; centerOnDesktop?: boolean }[] = [
  {
    title: "Shop",
    links: [
      { label: "Shop all", href: "/shop" },
      { label: "Design your own", href: "/customize" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Shipping", href: "/shipping" },
      { label: "Refunds & returns", href: "/refunds" },
      { label: "Care guide", href: "/care-guide" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Follow us",
    centerOnDesktop: true,
    links: [
      {
        label: <InstagramIcon />,
        href: INSTAGRAM_URL,
        external: true,
        ariaLabel: "Instagram (@nanaluboutique)",
      },
    ],
  },
];

// Legal links live inline in the bottom bar (dot-separated), not in a column.
const LEGAL_LINKS = [
  { label: "Terms & conditions", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Impressum", href: "/impressum" },
];

function FooterColumn({
  title,
  links,
  centerOnDesktop,
}: {
  title: string;
  links: FooterLink[];
  centerOnDesktop?: boolean;
}) {
  // Shared link styling for every column (text links and the social icon alike).
  // `inline-flex` gives each link a real box so the focus ring wraps it — an
  // inline <a> around just an <svg> otherwise collapses and the ring vanishes.
  const linkClass =
    "inline-flex items-center text-[0.92rem] text-on-nav/85 transition-colors hover:text-primary";
  return (
    // centerOnDesktop centres the whole column (heading + icon together) from md
    // up, so the icon sits centred under its heading regardless of how wide the
    // column is; stacked mobile stays left-aligned.
    <div className={cn("flex flex-col", centerOnDesktop && "md:items-center md:text-center")}>
      <p className="text-on-nav/70 text-[0.72rem] font-bold tracking-[0.18em] uppercase">{title}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                aria-label={link.ariaLabel}
                className={linkClass}
              >
                {link.label}
              </a>
            ) : (
              <Link href={link.href} aria-label={link.ariaLabel} className={linkClass}>
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-lavender text-on-nav">
      {/* Top row, three layouts:
            mobile  → stacked
            tablet (md) → grid: a wider brand column (2.2fr) + two link columns
                          + an auto-width Follow-us, so the brand stays roomy
                          while its tagline wraps into the vertical space
            desktop (lg) → brand pinned left, columns spread, Follow-us right */}
      <Container className="flex flex-col gap-10 py-14 md:grid md:grid-cols-[2.2fr_1fr_1fr_auto] lg:flex lg:flex-row lg:items-start lg:justify-between">
        {/* Brand + tagline (tagline width is only capped on desktop; on tablet
            the grid column already constrains it) */}
        <div className="flex flex-col items-start gap-5">
          <Link href="/" aria-label="Nanalu Boutique — home">
            <Brand />
          </Link>
          <p className="text-on-nav/80 text-[0.92rem] lg:max-w-[19rem]">
            Handcrafted sewn and knit items, ready-made or customised with your chosen fabrics.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <FooterColumn key={col.title} {...col} />
        ))}
      </Container>

      {/* Newsletter — visual stub for now (no submit); wired to a provider later. */}
      <div className="border-on-nav/12 border-t">
        <Container className="flex flex-col gap-4 py-7 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-ink text-lg">Want first dibs on new pieces?</p>
            <p className="text-on-nav/75 text-[0.86rem]">
              The occasional email when we drop something new. No spam, promise.
            </p>
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <input
              type="email"
              aria-label="Email address"
              placeholder="you@email.com"
              className="border-on-nav/30 text-on-nav placeholder:text-on-nav/55 hover:border-primary focus-visible:border-primary rounded-pill w-full min-w-0 border bg-transparent px-4 py-2 text-[0.92rem] transition-colors"
            />
            <Button variant="primary">Join</Button>
          </div>
        </Container>
      </div>

      {/* Legal bar. */}
      <div className="border-on-nav/12 border-t">
        <Container className="text-on-nav/75 flex flex-col items-center gap-2 py-5 text-[0.82rem] sm:flex-row sm:justify-center sm:gap-3">
          <span>© 2026 Nanalu Boutique</span>
          {/* separator between copyright and links — desktop only (on mobile
              they're on separate rows, so no dot needed) */}
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            {LEGAL_LINKS.map((link, i) => (
              <Fragment key={link.href}>
                {i > 0 && <span aria-hidden>·</span>}
                <Link href={link.href} className="hover:text-primary transition-colors">
                  {link.label}
                </Link>
              </Fragment>
            ))}
          </div>
        </Container>
      </div>
    </footer>
  );
}
