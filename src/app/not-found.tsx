import Link from "next/link";

import { Container } from "@/components/layout/container";

/*
 * Site-wide 404. Next.js renders `app/not-found.tsx` for any unmatched route
 * (and for `notFound()` calls), *inside* the root layout — so header, footer,
 * background, and fonts come for free. This replaces Next's default unstyled
 * dark 404 with an on-brand page plus a way back into the site.
 */
export default function NotFound() {
  return (
    <Container className="py-20 text-center">
      <p className="eyebrow mx-auto">404</p>
      <h1 className="mt-12 text-4xl font-semibold">Page not found</h1>
      <p className="text-ink-soft mx-auto mt-3 max-w-md">
        The page you’re after doesn’t exist, or may have moved.
      </p>
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="btn btn-primary">
          Browse the shop
        </Link>
        <Link href="/" className="btn btn-ghost">
          Back home
        </Link>
      </div>
    </Container>
  );
}
