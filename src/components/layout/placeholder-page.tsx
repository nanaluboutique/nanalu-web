import { Container } from "@/components/layout/container";

/*
 * Temporary stub used by every route that doesn't have real content yet
 * (#10 builds the shell; pages are filled in their own later phases). Shows
 * an on-brand "coming soon" block so navigation works end-to-end today.
 */
export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <Container className="py-20 text-center">
      <p className="eyebrow mx-auto">Coming soon</p>
      <h1 className="mt-5 text-4xl font-semibold">{title}</h1>
      <p className="text-ink-soft mx-auto mt-3 max-w-md">{description}</p>
    </Container>
  );
}
