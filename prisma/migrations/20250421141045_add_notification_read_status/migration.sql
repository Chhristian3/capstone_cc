-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "admin_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "client_read" BOOLEAN NOT NULL DEFAULT false;
