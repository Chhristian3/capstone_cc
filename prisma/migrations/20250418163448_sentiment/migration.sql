-- CreateEnum
CREATE TYPE "SentimentCategory" AS ENUM ('VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE');

-- AlterTable
ALTER TABLE "ratings" ADD COLUMN     "sentimentCategory" "SentimentCategory",
ADD COLUMN     "sentimentScore" INTEGER;
