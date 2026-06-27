-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastCheckIn" TEXT,
ADD COLUMN     "longestStreak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "streakFreezes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tradeCredits" INTEGER NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "Sentiment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sentiment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sentiment_symbol_idx" ON "Sentiment"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "Sentiment_userId_symbol_key" ON "Sentiment"("userId", "symbol");

-- AddForeignKey
ALTER TABLE "Sentiment" ADD CONSTRAINT "Sentiment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

