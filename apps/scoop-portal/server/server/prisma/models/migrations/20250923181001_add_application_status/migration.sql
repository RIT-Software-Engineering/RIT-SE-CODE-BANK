/*
  Warnings:

  - You are about to drop the column `accepted` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Application` DROP COLUMN `accepted`,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'UNPROCESSED';
