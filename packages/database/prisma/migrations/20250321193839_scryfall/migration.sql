-- CreateTable
CREATE TABLE "Card" (
    "oracleId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manaCost" TEXT,
    "typeLine" TEXT NOT NULL,
    "oracleText" TEXT,
    "colors" TEXT[],

    CONSTRAINT "Card_pkey" PRIMARY KEY ("oracleId")
);

-- CreateTable
CREATE TABLE "Printing" (
    "oracleId" TEXT NOT NULL,
    "setCode" TEXT NOT NULL,
    "releasedAt" TIMESTAMP(3) NOT NULL,
    "collectorNumber" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "usd" DECIMAL(65,30),
    "usdFoil" DECIMAL(65,30),
    "usdEtched" DECIMAL(65,30),
    "eur" DECIMAL(65,30),
    "eurFoil" DECIMAL(65,30),
    "tix" DECIMAL(65,30)
);

-- CreateTable
CREATE TABLE "Legality" (
    "oracleId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "legal" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "ScryfallMeta" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ScryfallMeta_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Card_oracleId_key" ON "Card"("oracleId");

-- CreateIndex
CREATE UNIQUE INDEX "Printing_oracleId_setCode_collectorNumber_key" ON "Printing"("oracleId", "setCode", "collectorNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Legality_oracleId_format_key" ON "Legality"("oracleId", "format");

-- AddForeignKey
ALTER TABLE "Printing" ADD CONSTRAINT "Printing_oracleId_fkey" FOREIGN KEY ("oracleId") REFERENCES "Card"("oracleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Legality" ADD CONSTRAINT "Legality_oracleId_fkey" FOREIGN KEY ("oracleId") REFERENCES "Card"("oracleId") ON DELETE CASCADE ON UPDATE CASCADE;
