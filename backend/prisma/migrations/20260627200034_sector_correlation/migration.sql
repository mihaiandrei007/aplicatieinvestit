-- AlterTable
ALTER TABLE "Instrument" ADD COLUMN     "correlation" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sector" TEXT;

