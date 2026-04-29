/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `ProjectProposal` table. All the data in the column will be lost.
  - You are about to alter the column `title` on the `ProjectProposal` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - A unique constraint covering the columns `[projectId]` on the table `ProjectProposal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `ProjectProposal` DROP COLUMN `updatedAt`,
    ADD COLUMN `projectId` INTEGER NULL,
    MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `reviewNotes` TEXT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ProjectProposal_projectId_key` ON `ProjectProposal`(`projectId`);

-- AddForeignKey
ALTER TABLE `ProjectProposal` ADD CONSTRAINT `ProjectProposal_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
