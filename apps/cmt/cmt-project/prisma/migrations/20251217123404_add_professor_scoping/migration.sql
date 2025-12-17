/*
  Warnings:

  - You are about to drop the column `archivedAt` on the `tbteamset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `course` ADD COLUMN `workflowId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `events` ADD COLUMN `ownerEmail` VARCHAR(191) NULL,
    ADD COLUMN `ownerUid` VARCHAR(191) NULL,
    ADD COLUMN `professorId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tbteamset` DROP COLUMN `archivedAt`;

-- CreateIndex
CREATE INDEX `events_professorId_idx` ON `events`(`professorId`);

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
