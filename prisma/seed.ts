// Seed data for local dev + testing (#30).
//
// Gives every later phase something realistic to build against: fabrics/colours,
// browse categories, products with ready-made pieces, and one fully customizable
// product (config → slots → regions → palette). Run it with `npm run db:seed`
// (or `npm run db:reset`, which replays migrations then auto-runs this).
//
// RE-RUNNABLE: we wipe the tables first (in FK-safe order), then insert fresh —
// so running it twice never duplicates or errors. cuids are random, so an
// upsert-by-id approach wouldn't be stable; delete-then-insert is the clean way.
//
// IMAGES ARE ASSET KEYS, NOT URLS (PLAN §4). We store the Cloudinary public id
// (e.g. "products/linen-tote/main"); one helper turns keys into URLs later, so
// the storage provider stays swappable. These keys are placeholders for now.

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

import { MaterialKind, MaterialUnit, PrismaClient } from "@/generated/prisma/client";

// Load our single local-env file (gitignored). We resolve it relative to THIS
// file (../ from prisma/ = project root), not the current working directory, so
// `tsx prisma/seed.ts` works when run from any folder — not just the repo root.
// `prisma db seed` also inherits the env the CLI already loaded; this is belt-
// and-suspenders so there's one obvious source for DATABASE_URL either way.
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

// Fail fast with a clear message if the connection string is missing — otherwise
// node-postgres silently falls back to libpq defaults and dies with an opaque
// ECONNREFUSED, which is a confusing first-run experience on a fresh clone.
const connectionString = process.env["DATABASE_URL"];
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local (see CLAUDE.md → Environment).",
  );
}

// Prisma 7's new client generator connects through a DRIVER ADAPTER rather than a
// URL baked into the schema. PrismaPg wraps node-postgres and takes the same
// DATABASE_URL our Docker Postgres listens on (see prisma.config.ts / .env.local).
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ─── Reset ──────────────────────────────────────────────────────────────────
// Delete children before parents so no FK is ever left dangling. Implicit M:N
// join tables (_CategoryToProduct, _ProductToUser, _MaterialToSlot) are cleared
// automatically when their connected rows go, so they need no explicit delete.
async function reset() {
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.region.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.customizationConfig.deleteMany();
  await prisma.readyMadeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
}

// ─── Materials (the configurator's "paint") ──────────────────────────────────
// Two kinds, discriminated by `kind`. FABRIC carries a calibrated swatch image +
// its real-world width (so the configurator can scale the pattern to true size);
// COLOUR carries a hex. Stock/unit are what reservations later reserve against.
async function seedMaterials() {
  // Small helpers keep each row to just its distinguishing fields.
  const fabric = (data: {
    name: string;
    swatchImage: string;
    swatchRealWidthCm: number;
    stock: number;
  }) =>
    prisma.material.create({
      data: { kind: MaterialKind.FABRIC, unit: MaterialUnit.METRE, ...data },
    });

  const colour = (data: { name: string; hex: string; unit: MaterialUnit; stock: number }) =>
    prisma.material.create({ data: { kind: MaterialKind.COLOUR, ...data } });

  return {
    // Fabrics (unit = METRE) — the tote's palette below is drawn from these.
    naturalLinen: await fabric({
      name: "Natural Linen",
      swatchImage: "materials/linen-natural",
      swatchRealWidthCm: 20,
      stock: 45.5,
    }),
    sageLinen: await fabric({
      name: "Sage Linen",
      swatchImage: "materials/linen-sage",
      swatchRealWidthCm: 20,
      stock: 32,
    }),
    terracottaCotton: await fabric({
      name: "Terracotta Cotton",
      swatchImage: "materials/cotton-terracotta",
      swatchRealWidthCm: 18,
      stock: 28.75,
    }),
    dustyRoseCotton: await fabric({
      name: "Dusty Rose Cotton",
      swatchImage: "materials/cotton-dusty-rose",
      swatchRealWidthCm: 18,
      stock: 40,
    }),
    ditsyFloralCotton: await fabric({
      name: "Ditsy Floral Cotton",
      swatchImage: "materials/cotton-ditsy-floral",
      swatchRealWidthCm: 18,
      stock: 22.5,
    }),
    mustardCanvas: await fabric({
      name: "Mustard Canvas",
      swatchImage: "materials/canvas-mustard",
      swatchRealWidthCm: 22,
      stock: 15,
    }),
    charcoalDenim: await fabric({
      name: "Charcoal Denim",
      swatchImage: "materials/denim-charcoal",
      swatchRealWidthCm: 24,
      stock: 18,
    }),

    // Colours / yarns (unit = SKEIN or GRAM) — no configurator uses them yet, but
    // they exercise the COLOUR variant and are ready for a future knit builder.
    creamWool: await colour({
      name: "Cream Wool",
      hex: "#F3EAD9",
      unit: MaterialUnit.SKEIN,
      stock: 24,
    }),
    blushWool: await colour({
      name: "Blush Pink Wool",
      hex: "#E4B7B2",
      unit: MaterialUnit.SKEIN,
      stock: 18,
    }),
    forestWool: await colour({
      name: "Forest Green Wool",
      hex: "#2E4A3B",
      unit: MaterialUnit.SKEIN,
      stock: 12,
    }),
    mustardWool: await colour({
      name: "Mustard Wool",
      hex: "#D9A441",
      unit: MaterialUnit.GRAM,
      stock: 850,
    }),
  };
}

// ─── Categories (admin browse buckets, M:N with Product) ─────────────────────
async function seedCategories() {
  const make = (name: string, slug: string) => prisma.category.create({ data: { name, slug } });

  return {
    bags: await make("Bags & totes", "bags-totes"),
    pouches: await make("Pouches", "pouches"),
    home: await make("Home", "home"),
    knitwear: await make("Knitwear", "knitwear"),
    accessories: await make("Accessories", "accessories"),
  };
}

type Materials = Awaited<ReturnType<typeof seedMaterials>>;
type Categories = Awaited<ReturnType<typeof seedCategories>>;

// ─── Products + ready-made pieces ────────────────────────────────────────────
// Each Product is the shared listing; its ReadyMadeItems are the one-of-a-kind
// pieces the catalog grid renders as cards. `connect` links to already-created
// categories (M:N). Prices are integer cents.
async function seedProducts(categories: Categories) {
  // Non-customizable products, created with their pieces nested in one call.
  await prisma.product.create({
    data: {
      name: "Everyday Zip Pouch",
      slug: "everyday-zip-pouch",
      description:
        "A roomy lined pouch with a smooth metal zip — for cables, cosmetics, or little treasures.",
      care: "Cold hand-wash or a gentle machine cycle in a laundry bag; reshape and dry flat. Warm iron on the reverse if needed.",
      dimensions: "20 cm wide × 13 cm tall. Fully lined, with a metal zip across the top.",
      priceCents: 2200,
      images: ["products/zip-pouch/main"],
      categories: { connect: [{ id: categories.pouches.id }] },
      readyMadeItems: {
        create: [
          {
            description: "Terracotta cotton with a cream zip.",
            images: ["products/zip-pouch/terracotta"],
          },
          {
            description: "Dusty rose cotton, fully lined.",
            images: ["products/zip-pouch/dusty-rose"],
          },
          {
            description: "Ditsy floral cotton — one of a kind.",
            images: ["products/zip-pouch/floral"],
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Quilted Table Runner",
      slug: "quilted-table-runner",
      description: "Hand-quilted cotton runner that dresses a table for everyday or a gathering.",
      care: "Cold machine wash on gentle; tumble dry low or line dry. Warm iron. The quilting softens with every wash.",
      dimensions: "140 cm long × 40 cm wide. Hand-quilted cotton with a soft cotton batting.",
      priceCents: 3600,
      images: ["products/table-runner/main"],
      categories: { connect: [{ id: categories.home.id }] },
      readyMadeItems: {
        create: [
          {
            description: "Mustard canvas top with a natural linen backing.",
            images: ["products/table-runner/mustard"],
            // No `priceCents` here → this piece falls back to product.priceCents.
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Crochet Market Bag",
      slug: "crochet-market-bag",
      description:
        "An airy hand-crocheted net bag that packs flat and stretches around a full grocery haul.",
      care: "Hand-wash cold and dry flat to keep its shape — crochet stretches when wet, so never hang it to dry.",
      dimensions:
        "Sits flat at about 30 × 34 cm and stretches to hold a full grocery load. Handles ~12 cm drop.",
      priceCents: 5200,
      images: ["products/market-bag/main"],
      // Sits in two buckets — a crocheted bag is both Bags and Knitwear.
      categories: {
        connect: [{ id: categories.bags.id }, { id: categories.knitwear.id }],
      },
      readyMadeItems: {
        create: [
          {
            description: "Cream cotton yarn, natural wooden handles.",
            images: ["products/market-bag/cream"],
          },
          {
            description: "Forest green cotton yarn.",
            images: ["products/market-bag/forest"],
          },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: "Chunky Knit Beanie",
      slug: "chunky-knit-beanie",
      description: "A soft chunky-rib beanie hand-knitted in pure wool.",
      care: "Hand-wash in cool water with a wool-safe soap, press out the water (don't wring), and dry flat away from heat. Never tumble dry.",
      dimensions: "One size — the chunky rib stretches to fit most adults (about 52–60 cm).",
      priceCents: 2800,
      images: ["products/beanie/main"],
      categories: {
        connect: [{ id: categories.accessories.id }, { id: categories.knitwear.id }],
      },
      readyMadeItems: {
        create: [
          {
            description: "Blush pink wool.",
            images: ["products/beanie/blush"],
          },
          {
            // Sold — demonstrates the `available: false` state in the grid.
            description: "Forest green wool.",
            images: ["products/beanie/forest"],
            available: false,
          },
        ],
      },
    },
  });
}

// ─── The customizable product (config → slots → regions → palette) ───────────
// One product exercises the whole configurator model. The SVG's <path> ids are
// what Regions reference. Note "Handles" is ONE slot mapped to TWO regions
// (left + right) — painting it fills both, the model's headline feature.
//
// INVARIANT (schema comment on Slot): every material in a slot's palette must
// share the slot's `unit`. All three palettes below are METRE fabrics. ✓
async function seedCustomizableTote(materials: Materials, categories: Categories) {
  const svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <path id="body" d="M40 70 H160 L150 180 H50 Z" />
  <path id="pocket" d="M75 110 H125 V160 H75 Z" />
  <path id="handle-left" d="M55 70 C55 30 85 30 85 70" fill="none" />
  <path id="handle-right" d="M115 70 C115 30 145 30 145 70" fill="none" />
</svg>`;

  await prisma.product.create({
    data: {
      name: "Linen Tote Bag",
      slug: "linen-tote-bag",
      description:
        "A sturdy everyday tote in washed linen — carry it plain, or design your own in the configurator.",
      care: "Cold hand-wash or gentle machine wash; reshape and dry flat. Warm iron while slightly damp. Linen softens and creases with wear — part of its character.",
      dimensions:
        "38 cm wide × 40 cm tall × 12 cm deep. Strap drop 26 cm. Front pocket 20 × 16 cm.",
      priceCents: 4800,
      images: ["products/linen-tote/main", "products/linen-tote/detail"],
      customizable: true,
      categories: { connect: [{ id: categories.bags.id }] },

      // Even a customizable product can have ready-made pieces in stock.
      readyMadeItems: {
        create: [
          {
            description: "Made up in natural linen with matching handles.",
            // Several angles of this one item — exercises the gallery thumbnails + arrows.
            images: [
              "products/linen-tote/natural",
              "products/linen-tote/natural-back",
              "products/linen-tote/natural-detail",
            ],
          },
          {
            description: "Sage linen body with charcoal denim handles.",
            images: [
              "products/linen-tote/sage",
              "products/linen-tote/sage-back",
              "products/linen-tote/sage-detail",
            ],
            // Item-level care OVERRIDE: the denim handles need different first-wash
            // care than the plain-linen parent — exercises careFor's override path.
            care: "Wash cold and separately for the first few washes — the charcoal denim handles can bleed onto the sage linen. After that, care for it like the linen tote.",
          },
        ],
      },

      // 1:1 config, its slots nested inside, each slot's regions + palette nested.
      customization: {
        create: {
          svg,
          slots: {
            create: [
              {
                name: "Body",
                unit: MaterialUnit.METRE,
                quantity: 0.55,
                regions: { create: [{ svgId: "body" }] },
                materials: {
                  connect: [
                    { id: materials.naturalLinen.id },
                    { id: materials.sageLinen.id },
                    { id: materials.terracottaCotton.id },
                    { id: materials.dustyRoseCotton.id },
                    { id: materials.ditsyFloralCotton.id },
                  ],
                },
              },
              {
                name: "Handles",
                unit: MaterialUnit.METRE,
                quantity: 0.18,
                // ONE slot → TWO regions: filling it paints both handles.
                regions: {
                  create: [{ svgId: "handle-left" }, { svgId: "handle-right" }],
                },
                materials: {
                  connect: [
                    { id: materials.naturalLinen.id },
                    { id: materials.sageLinen.id },
                    { id: materials.charcoalDenim.id },
                    { id: materials.mustardCanvas.id },
                  ],
                },
              },
              {
                name: "Front Pocket",
                unit: MaterialUnit.METRE,
                quantity: 0.12,
                regions: { create: [{ svgId: "pocket" }] },
                materials: {
                  connect: [
                    { id: materials.ditsyFloralCotton.id },
                    { id: materials.dustyRoseCotton.id },
                    { id: materials.terracottaCotton.id },
                  ],
                },
              },
            ],
          },
        },
      },
    },
  });
}

// ─── Users + favourites (M:N — powers the "Most loved" sort) ─────────────────
// Emails are lowercase (the app normalises before persisting; see User schema).
async function seedUsers() {
  const tote = await prisma.product.findUniqueOrThrow({
    where: { slug: "linen-tote-bag" },
  });
  const marketBag = await prisma.product.findUniqueOrThrow({
    where: { slug: "crochet-market-bag" },
  });
  const beanie = await prisma.product.findUniqueOrThrow({
    where: { slug: "chunky-knit-beanie" },
  });

  await prisma.user.create({
    data: {
      email: "anca@example.com",
      name: "Anca",
      favourites: { connect: [{ id: tote.id }, { id: marketBag.id }] },
    },
  });
  await prisma.user.create({
    data: {
      email: "maria@example.com",
      name: "Maria",
      favourites: { connect: [{ id: tote.id }, { id: beanie.id }] },
    },
  });
}

async function main() {
  // Safety rail: reset() wipes every table. Never let that touch a production DB,
  // even if a stray DATABASE_URL points there. Seeding is a dev-only operation.
  if (process.env["NODE_ENV"] === "production") {
    throw new Error("Refusing to seed: NODE_ENV=production (the seed wipes all tables).");
  }

  await reset();
  const materials = await seedMaterials();
  const categories = await seedCategories();
  await seedProducts(categories);
  await seedCustomizableTote(materials, categories);
  await seedUsers();

  // A quick tally so the run reports what it wrote.
  const [products, pieces, mats, users] = await Promise.all([
    prisma.product.count(),
    prisma.readyMadeItem.count(),
    prisma.material.count(),
    prisma.user.count(),
  ]);
  console.log(
    `Seeded: ${products} products, ${pieces} ready-made pieces, ${mats} materials, ${users} users.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
