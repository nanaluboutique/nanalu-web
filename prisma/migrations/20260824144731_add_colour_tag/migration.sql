-- CreateTable
CREATE TABLE "Colour" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hex" TEXT NOT NULL,

    CONSTRAINT "Colour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ColourToReadyMadeItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ColourToReadyMadeItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colour_slug_key" ON "Colour"("slug");

-- CreateIndex
CREATE INDEX "_ColourToReadyMadeItem_B_index" ON "_ColourToReadyMadeItem"("B");

-- AddForeignKey
ALTER TABLE "_ColourToReadyMadeItem" ADD CONSTRAINT "_ColourToReadyMadeItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Colour"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColourToReadyMadeItem" ADD CONSTRAINT "_ColourToReadyMadeItem_B_fkey" FOREIGN KEY ("B") REFERENCES "ReadyMadeItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
