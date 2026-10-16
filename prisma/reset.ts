// Wipe every table in FK-safe order — children before parents, so no foreign key is
// ever left pointing at a deleted row. Implicit M:N join tables (_CategoryToProduct,
// _ProductToUser, _MaterialToSlot) clear automatically when their connected rows go,
// so they need no explicit delete.
//
// ONE definition, shared by prisma/seed.ts (before reseeding) and the DB-integration
// test setup (before each test) — so the delete order lives in a single place. Add a
// model with a foreign key and you edit this one list; both callers pick it up, and
// there's no second copy to drift out of sync.
//
// Takes the Prisma client as a PARAMETER rather than importing getPrisma(): the two
// callers hold DIFFERENT clients. The seed is a standalone tsx script that builds its
// own client and (per CLAUDE.md) can't import the server-only data layer; the tests
// pass getPrisma(). One argument lets both reuse this without the file depending on
// either. The only import is the client TYPE, erased at runtime — so no server-only,
// no connection, nothing pulled in.
import type { PrismaClient } from "@/generated/prisma/client";

export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.region.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.customizationConfig.deleteMany();
  await prisma.readyMadeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.colour.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
}
