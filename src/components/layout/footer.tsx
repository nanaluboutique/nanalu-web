import Link from "next/link";

import { Container } from "@/components/layout/container";

/*
 * Shared site footer — ported from the mockup (mockups/shop-pages.html).
 * Copyright on the left; the link group is pushed to the right (the mockup's
 * `.sep { margin-left: auto }`, here `ml-auto` on the first link).
 *
 * These are placeholder destinations — the real legal/info pages land in
 * Phase 9. Routes that don't exist yet still resolve to our page stubs.
 */
const LINKS = [
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
  { label: "Privacy", href: "/privacy" },
  { label: "Impressum", href: "/impressum" },
];

export function Footer() {
  return (
    <footer className="border-line text-ink-soft mt-[50px] border-t py-6 text-[0.88rem]">
      <Container className="flex flex-wrap items-center gap-[22px]">
        <span>© 2026 Nanalu Boutique — handmade by two sisters</span>
        {LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-primary transition-colors ${i === 0 ? "ml-auto" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </Container>
    </footer>
  );
}
