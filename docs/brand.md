# Nanalu Boutique — Brand identity & visual direction

> Outcome of **issue #8**. This is the canonical brand reference; the design-system
> issue (**#9**) builds its Tailwind tokens and base components from here. The applied,
> visual version lives in the mockups under [`/mockups`](../mockups) (see [§8](#8-mockups)).
>
> **Decided:** 2026-06-13 · **Direction:** "Theme 7 — Lavender & Sage (deep-tone)",
> chosen from seven explored palettes.

---

## 1. At a glance

Cozy, handmade, lightly premium. One dominant brand colour (a dusty lavender) carries the
chrome — navbar and primary buttons — with a sage accent used sparingly, everything floating
on a warm off-white. The UI is intentionally calm and two-toned so the **colourful fabrics and
the configurator preview stay the most vivid thing on screen** (the same logic as roadsurfer's
teal + orange).

---

## 2. Colour palette

Hex values are the source of truth. Token names map 1:1 to the Tailwind v4 `@theme` variables
we'll define in `src/app/globals.css` (see [§9](#9-how-this-feeds-9)).

### Brand (lavender)

| Token          | Hex       | Role                                              |
| -------------- | --------- | ------------------------------------------------- |
| `lavender`     | `#B39FB5` | Navbar / light brand surface (dark text on it)    |
| `primary`      | `#7a5a7d` | Deepened lavender — primary buttons, bands, links |
| `primary-deep` | `#6f5072` | Darker band / gradient end                        |
| `primary-tint` | `#f1ecf2` | Light lavender wash (tag backgrounds, hovers)     |

### Accent (sage)

| Token       | Hex       | Role                                                        |
| ----------- | --------- | ----------------------------------------------------------- |
| `sage`      | `#B6C7A1` | Accent buttons, highlights                                  |
| `fern`      | `#6f8456` | Deeper sage (links/icons on light)                          |
| `sage-tint` | `#e8eedd` | Chip / eyebrow background                                   |
| `chip-ink`  | `#57693f` | **Chip & eyebrow text** (dark sage — not the brighter fern) |

### Neutrals

| Token      | Hex       | Role                                     |
| ---------- | --------- | ---------------------------------------- |
| `bg`       | `#fbfaf7` | Page background (warm off-white / cream) |
| `card`     | `#ffffff` | Card / panel surfaces                    |
| `ink`      | `#3d3544` | Body text **and h1/h2/h3 headings**      |
| `ink-soft` | `#756c7d` | Secondary text, captions                 |
| `heading`  | `#6e4f71` | Plum — hero title, **h4**, prices only   |
| `line`     | `#e7e2ea` | Borders, dividers                        |

### Supporting fabric tones (product imagery / configurator swatches)

`clay #c08457` · `cream-fabric #efe9dc` · plus `fern #6f8456` reused. `logo-line #5a4060`
is the ink used for logo outlines.

### Semantic button colours

- **Primary** — bg `primary` `#7a5a7d`, text `#fbf7fb`
- **Accent** — bg `sage` `#B6C7A1`, text `#2f3a20`
- **Ghost** — transparent, `primary` text + 1.5px `primary` outline
- **Navbar** — bg `lavender`, text `#322b38`

> **Contrast note:** the light lavender (`#B39FB5`) and sage (`#B6C7A1`) are too light to hold
> white text, so text-bearing surfaces use `primary`/`fern`/`ink`. This is the whole reason the
> palette has a _deepened_ lavender (`primary`) distinct from the navbar lavender.

---

## 3. Typography

| Use                          | Family               | Notes                                                              |
| ---------------------------- | -------------------- | ------------------------------------------------------------------ |
| Display / headings / prices  | **Fraunces** (serif) | Weights 400–700; italic for emphasis (the hero "Designed by you.") |
| Body / UI / buttons / labels | **Karla** (sans)     | Weights 400–700                                                    |

Both are Google Fonts → load via `next/font/google` in `layout.tsx`.

**Heading colour rules** (locked in the mockups):

- `h1, h2, h3` → `ink`
- `h4` → `heading` (plum)
- **Hero title** → `heading` (plum) — keeps its own `.hero-title` class so it stays plum while
  other headings are ink; the italic `<em>` gets `margin-left: -5px` to align under the roman text.
- Eyebrows / small-caps labels → Karla, uppercase, `letter-spacing ≈ .26em`.

---

## 4. Logo & favicon

**Full mark** (your sketch, vectorized to SVG — recolours per palette):
a **yarn ball with two capped knitting needles** (front-left), a **pinking-shear-cut plaid
swatch** (back-right), and a **threaded sewing needle** below. It tells the whole story —
_knit_ + _sewn_ — in one mark.

**Wordmark:** "Nanalu" in Fraunces 600, with "BOUTIQUE" beneath in Karla small-caps,
`letter-spacing: .38em`.

**Favicon:** a **simplified plaid fabric swatch** — sewing-forward, since most pieces are sewn
(the yarn-ball favicon was rejected for that reason). Chosen design **"D": lavender plaid,
rounded square, bold high-contrast lines** — the most legible at 16px while staying on the brand
colour. The pinked-edge detail is kept for the full logo only (it muddies at favicon size).
A live four-way preview sits on the mockup home page ("Browser tab icon" panel).

> TODO in #9: export the full mark and favicon as standalone SVG assets + generate
> `favicon.ico` / PNG sizes.

---

## 5. Mood / aesthetic

Cozy handmade, warm, a touch premium — "two sisters at a sewing table," not corporate or
mass-market. Restrained, generous white/cream space; soft shadows; rounded forms (pill buttons,
18px card radii). The brand gets out of the way so the fabrics carry the colour.

---

## 6. Voice / tone

Warm, first-person, plain-spoken. We're two sisters who make things by hand — say so.

- **Friendly, not corporate.** "Made by hand. Designed by you." over "Bespoke artisanal goods."
- **First-person & personal.** "we", "our sewing table", "the two of us".
- **Honest about handmade.** Lean into one-of-a-kind, made-to-order, "no two alike" — including
  the practical bits (e.g. custom pieces are exempt from the EU 14-day withdrawal right).
- **Plain & concrete.** "Every fabric shown at its true scale" beats vague superlatives.

---

## 7. UI component conventions (from the mockups)

- **Buttons** — pill (`border-radius: 999px`); primary / accent / ghost as in §2; hover lifts ~2px.
- **Chips & eyebrows** — `sage-tint` bg, `chip-ink` text, pill.
- **Tags** — "Customizable" = `primary-tint` bg / `primary` text; "One of a kind" = `sage-tint`
  bg / `chip-ink` text.
- **Cards** — `card` white, 18px radius, subtle shadow, hover-lift; headline in `ink`, price in `heading`.
- **Fabric-pattern fills** — gingham / dots / stripes / weave / chevron, generated in CSS/SVG;
  used as placeholder product imagery and as configurator materials.

---

## 8. Mockups

Open in any browser (self-contained HTML, no build step):

- **`mockups/brand-directions.html`** — the seven explored palettes on one landing layout.
  Switch with the bottom bar or keys **1–7**. Theme **7** is the chosen direction.
- **`mockups/shop-pages.html`** — the chosen theme applied across **Home · Catalog · Product ·
  Configurator · Cart**. Switch with the bottom bar or keys **1–5**. The configurator is
  interactive (pick a section → pick a fabric → it fills); the home page has the live favicon
  preview panel.

These are **design references**, not production code — they intentionally live outside `src/`.

---

## 9. How this feeds #9 (design-system foundations)

The scaffold uses **Tailwind v4** (CSS-first; tokens live in `@theme` inside
`src/app/globals.css`, there is no `tailwind.config.js`).

1. **Tokens** — define every colour in §2 as `--color-<token>` in `@theme`; add the type +
   radii scale. Replace the current placeholder `--background/--foreground`.
2. **Fonts** — load Fraunces + Karla via `next/font/google` in `layout.tsx`; wire `--font-display`
   / `--font-sans` into `@theme`; drop the Geist/Arial defaults.
3. **Base styles** — heading colour rules (§3), `bg`/`ink` body defaults, selection colour.
4. **Primitives** — `Button` (primary/accent/ghost), `Tag`/`Chip`, `Card`, plus the nav shell
   (handed off to #10). The logo becomes an SVG component; favicon assets exported.
5. **(optional)** a component-preview route to see the primitives in isolation.
