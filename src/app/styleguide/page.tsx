/*
 * Temporary styleguide / token preview (#9). A throwaway route to eyeball the
 * design tokens, fonts, and base primitives in the real app. Primitives match
 * the approved mockup (mockups/shop-pages.html) exactly.
 */
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Brand, FaviconMark, Logo, Wordmark } from "@/components/ui/logo";
import { Tag } from "@/components/ui/tag";

const SWATCHES: { name: string; className: string; hex: string; dark?: boolean }[] = [
  { name: "lavender", className: "bg-lavender", hex: "#B39FB5" },
  { name: "primary", className: "bg-primary", hex: "#7A5A7D", dark: true },
  { name: "primary-deep", className: "bg-primary-deep", hex: "#6F5072", dark: true },
  { name: "primary-tint", className: "bg-primary-tint", hex: "#F1ECF2" },
  { name: "sage", className: "bg-sage", hex: "#B6C7A1" },
  { name: "fern", className: "bg-fern", hex: "#6F8456", dark: true },
  { name: "sage-tint", className: "bg-sage-tint", hex: "#E8EEDD" },
  { name: "chip-ink", className: "bg-chip-ink", hex: "#57693F", dark: true },
  { name: "bg", className: "bg-bg", hex: "#FBFAF7" },
  { name: "ink", className: "bg-ink", hex: "#3D3544", dark: true },
  { name: "ink-soft", className: "bg-ink-soft", hex: "#756C7D", dark: true },
  { name: "heading", className: "bg-heading", hex: "#6E4F71", dark: true },
  { name: "clay", className: "bg-clay", hex: "#C08457", dark: true },
  { name: "cream-fabric", className: "bg-cream-fabric", hex: "#EFE9DC" },
  { name: "line", className: "bg-line", hex: "#E7E2EA" },
];

const PRODUCTS = [
  { name: "Picnic tote bag", sub: "Bags & totes", price: "€48", custom: true, ph: "bg-sage-tint" },
  { name: "Dotted zip pouch", sub: "Pouches", price: "€24", custom: false, ph: "bg-primary-tint" },
  { name: "Striped beanie", sub: "Knitwear", price: "€35", custom: false, ph: "bg-cream-fabric" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  return (
    <main className="mx-auto max-w-5xl px-8 py-14">
      <Tag variant="eyebrow">Design system · #9</Tag>
      <h1 className="mt-4 text-4xl font-semibold">Nanalu Boutique — design system</h1>
      <p className="text-ink-soft mt-2 max-w-prose">
        Theme 7 “Lavender &amp; Sage”. Tokens live in{" "}
        <code className="bg-sage-tint rounded px-1">globals.css</code>; primitives in{" "}
        <code className="bg-sage-tint rounded px-1">src/components/ui</code> — matched to the mockup
        exactly.
      </p>

      {/* Brand */}
      <Section title="Brand">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* lockup + wordmark */}
          <div className="border-line bg-card rounded-card flex flex-col gap-6 border p-7">
            <div>
              <div className="text-ink-soft mb-2 text-xs font-semibold">Lockup</div>
              <Brand className="text-ink" />
            </div>
            <div>
              <div className="text-ink-soft mb-2 text-xs font-semibold">Wordmark</div>
              <Wordmark className="text-heading" />
            </div>
          </div>

          {/* mark on light + on plum */}
          <div className="grid grid-cols-2 gap-5">
            <div className="border-line bg-card rounded-card flex flex-col items-center justify-center gap-2 border p-5">
              <Logo className="h-20 w-auto" />
              <span className="text-ink-soft text-xs font-semibold">Mark · on light</span>
            </div>
            <div className="bg-primary rounded-card flex flex-col items-center justify-center gap-2 p-5">
              <Logo className="h-20 w-auto" />
              <span className="text-xs font-semibold text-white/80">Mark · on plum</span>
            </div>
          </div>
        </div>

        {/* favicon — two variants; lavender is the live browser tab icon */}
        <div className="border-line bg-card rounded-card mt-5 border p-7">
          <div className="text-ink-soft mb-4 text-xs font-semibold">
            Favicon — fabric swatch, 16 / 32 / 64px + browser tab
          </div>
          <div className="grid gap-7 sm:grid-cols-2">
            {(
              [
                { variant: "lavender", label: "Lavender — renders in the tab" },
                { variant: "sage", label: "Sage — alternate option" },
              ] as const
            ).map((f) => (
              <div key={f.variant} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-end gap-5">
                  <FaviconMark variant={f.variant} style={{ width: 16, height: 16 }} />
                  <FaviconMark variant={f.variant} style={{ width: 32, height: 32 }} />
                  <FaviconMark variant={f.variant} style={{ width: 64, height: 64 }} />
                  <span className="text-ink inline-flex items-center gap-2 rounded-t-lg bg-[#ece7ef] px-3 py-2 text-sm font-semibold">
                    <FaviconMark variant={f.variant} style={{ width: 16, height: 16 }} />
                    Nanalu Boutique
                  </span>
                </div>
                <span className="text-ink-soft text-xs font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Colour */}
      <Section title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {SWATCHES.map((s) => (
            <div key={s.name} className="border-line rounded-card overflow-hidden border">
              <div className={`${s.className} flex h-20 items-end p-2`}>
                <span className={`text-xs font-bold ${s.dark ? "text-white" : "text-ink"}`}>
                  {s.hex}
                </span>
              </div>
              <div className="bg-card text-ink px-2 py-1.5 text-xs font-semibold">{s.name}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography (plain panel, not a Card — Cards hover-lift) */}
      <Section title="Typography">
        <div className="bg-card border-line rounded-card space-y-3 border p-7">
          <h1 className="text-5xl font-semibold">
            Made by hand. <em className="text-primary font-medium">Designed by you.</em>
          </h1>
          <h2 className="text-3xl font-semibold">Fresh from the sewing table</h2>
          <h3 className="text-xl font-semibold">A roomy lined tote</h3>
          <h4 className="text-base font-semibold">Fabric &amp; materials</h4>
          <p className="text-ink-soft max-w-prose">
            Body copy is set in <strong className="text-ink">Karla</strong>. Headings use{" "}
            <strong className="text-ink">Fraunces</strong>, our display serif.
          </p>
        </div>
      </Section>

      {/* Buttons */}
      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Shop ready-made</Button>
          <Button variant="accent">Design your own</Button>
          <Button variant="ghost">Learn more</Button>
          <Button variant="primary" size="sm">
            Add
          </Button>
          <Button variant="primary" disabled>
            Sold out
          </Button>
        </div>
        <p className="text-ink-soft mt-3 text-sm">
          Tab to a button to see the keyboard focus ring; click-and-hold to feel the press.
        </p>
      </Section>

      {/* Tags */}
      <Section title="Tag">
        <div className="flex flex-wrap items-center gap-3">
          <Tag variant="custom">Customizable</Tag>
          <Tag variant="ooak">One of a kind</Tag>
          <Tag variant="eyebrow">The configurator</Tag>
        </div>
      </Section>

      {/* Cards — built like the mockup product card */}
      <Section title="Card">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Card key={p.name}>
              <div className={`${p.ph} h-[210px]`} />
              <CardBody>
                <h3 className="text-[1.08rem] font-semibold">{p.name}</h3>
                <div className="text-ink-soft mt-0.5 text-[0.85rem]">{p.sub}</div>
                <div className="mt-3 flex items-center">
                  <span className="text-heading text-[1.05rem] font-bold">{p.price}</span>
                  <Button variant="accent" size="sm" className="ml-auto">
                    Add
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </Section>
    </main>
  );
}
