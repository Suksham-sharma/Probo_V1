-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "stockType" TEXT;

-- CreateTable
CREATE TABLE "Market" (
    "id" SERIAL NOT NULL,
    "stockSymbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sourceOfTruth" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "repeatTime" INTEGER NOT NULL,
    "endAfterTime" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeStatus" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Market_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Market_stockSymbol_key" ON "Market"("stockSymbol");
