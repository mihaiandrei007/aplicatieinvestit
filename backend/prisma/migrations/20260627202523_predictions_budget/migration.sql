-- CreateEnum
CREATE TYPE "PredictionDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "PredictionStatus" AS ENUM ('PENDING', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "Group" ALTER COLUMN "startingCash" SET DEFAULT 10000;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "cash" SET DEFAULT 10000,
ALTER COLUMN "startingCash" SET DEFAULT 10000;

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "direction" "PredictionDirection" NOT NULL,
    "stake" DOUBLE PRECISION NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "priceAtBet" DOUBLE PRECISION NOT NULL,
    "status" "PredictionStatus" NOT NULL DEFAULT 'PENDING',
    "payout" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Prediction_userId_createdAt_idx" ON "Prediction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

