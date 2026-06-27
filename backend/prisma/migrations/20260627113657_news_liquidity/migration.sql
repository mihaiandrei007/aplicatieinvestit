-- AlterTable
ALTER TABLE "Instrument" ADD COLUMN     "liquidity" DOUBLE PRECISION NOT NULL DEFAULT 500000;

-- CreateTable
CREATE TABLE "News" (
    "id" TEXT NOT NULL,
    "symbol" TEXT,
    "headline" TEXT NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "News_createdAt_idx" ON "News"("createdAt");

-- CreateIndex
CREATE INDEX "News_symbol_createdAt_idx" ON "News"("symbol", "createdAt");

