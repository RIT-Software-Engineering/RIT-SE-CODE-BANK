/*
  Warnings:

  - You are about to drop the column `eventId` on the `tbteam` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `tbteam` DROP FOREIGN KEY `TBTeam_eventId_fkey`;

-- DropIndex
DROP INDEX `TBTeam_eventId_fkey` ON `tbteam`;

-- AlterTable
ALTER TABLE `events` ADD COLUMN `url` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `tbteam` DROP COLUMN `eventId`;
