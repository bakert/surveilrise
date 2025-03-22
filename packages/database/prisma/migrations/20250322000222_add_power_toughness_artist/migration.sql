-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "power" TEXT,
ADD COLUMN     "powerValue" DECIMAL(65,30),
ADD COLUMN     "toughness" TEXT,
ADD COLUMN     "toughnessValue" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Printing" ADD COLUMN     "artist" TEXT;
