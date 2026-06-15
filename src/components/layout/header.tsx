"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Container } from "@/components/layout/container";
import {
  CartIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";
import { Brand } from "@/components/ui/logo";
import { cn } from "@/lib/cn";

// Primary navigation, shown inline on desktop.
const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Design your own", href: "/customize" },
  { label: "Our story", href: "/story" },
];

// The mobile dropdown also surfaces the account/favorites actions, whose icons
// are hidden from the bar on small screens to keep the row from overflowing.
const MENU_LINKS = [
  ...NAV_LINKS,
  { label: "Favorites", href: "/favorites" },
  { label: "Account", href: "/account" },
];

export function Header() {
  // Current path (e.g. "/shop") — lets us mark the active nav link.
  const pathname = usePathname();
  // Whether the mobile dropdown menu is open.
  const [menuOpen, setMenuOpen] = useState(false);

  // A link is "active" when we're on its page or any nested page under it.
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="bg-lavender text-on-nav sticky top-0 z-30 shadow-[0_1px_0_rgb(74_58_80_/_0.08)]">
      <Container className="flex items-center gap-[34px] py-[13px]">
        {/* Brand → home */}
        <Link href="/" aria-label="Nanalu Boutique — home">
          <Brand />
        </Link>

        {/* Desktop nav links — hidden on small screens, shown from md up */}
        <nav aria-label="Primary" className="ml-auto hidden md:block">
          <ul className="flex gap-6">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="nav-link"
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Actions. Search/favorites/account icons are desktop-only (`hidden
            md:grid`); on mobile they live in the dropdown menu instead, so the
            bar only carries the cart + menu toggle and never overflows. */}
        <div className="ml-auto flex items-center gap-[14px] md:ml-0">
          <button type="button" className="icon-btn hidden md:grid" aria-label="Search">
            <SearchIcon />
          </button>
          <Link href="/favorites" className="icon-btn hidden md:grid" aria-label="Favorites">
            <HeartIcon />
          </Link>
          <Link href="/account" className="icon-btn hidden md:grid" aria-label="Account">
            <UserIcon />
          </Link>
          <Link href="/cart" className="nav-cart" aria-label="Cart">
            <CartIcon />
            Cart
          </Link>

          {/* Mobile menu toggle — only shown below md */}
          <button
            type="button"
            className="icon-btn md:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      {/* Mobile dropdown. Always mounted so it can animate both ways: the outer
          grid transitions its single row from 0fr (collapsed) to 1fr (full
          content height), while the inner panel fades in. `inert` when closed
          takes the links out of the tab order and hides them from assistive tech. */}
      <div
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out md:hidden",
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <nav
          aria-label="Primary (mobile)"
          inert={!menuOpen}
          className={cn(
            "min-h-0 border-t border-white/30 transition-opacity duration-300",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        >
          <Container className="flex flex-col py-2">
            {MENU_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "nav-link flex items-center gap-2 border-b-0 py-3",
                  isActive(link.href) && "font-bold",
                )}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {/* Active marker — always rendered (just faded out when
                    inactive) so the label never shifts. aria-hidden because
                    aria-current already conveys the state to assistive tech. */}
                <span
                  aria-hidden
                  className={cn(
                    "bg-primary h-1.5 w-1.5 rounded-full",
                    isActive(link.href) ? "opacity-100" : "opacity-0",
                  )}
                />
                {link.label}
              </Link>
            ))}
          </Container>
        </nav>
      </div>
    </header>
  );
}
