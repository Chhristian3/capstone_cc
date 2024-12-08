/*
  Warnings:

  - Added the required column `appointmentEndDate` to the `appointments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `appointments` ADD COLUMN `appointmentEndDate` DATETIME(3) NOT NULL;
