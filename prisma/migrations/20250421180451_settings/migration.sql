/*
  Warnings:

  - You are about to drop the column `admin_read` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `client_read` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the `NotificationRead` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DateStatus" AS ENUM ('WHOLE_DAY', 'HALF_DAY', 'DISABLED');

-- DropForeignKey
ALTER TABLE "NotificationRead" DROP CONSTRAINT "NotificationRead_notificationId_fkey";

-- AlterTable
ALTER TABLE "notifications" DROP COLUMN "admin_read",
DROP COLUMN "client_read";

-- DropTable
DROP TABLE "NotificationRead";

-- CreateTable
CREATE TABLE "selected_dates" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "DateStatus" NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "selected_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "selected_dates_date_key" ON "selected_dates"("date");
