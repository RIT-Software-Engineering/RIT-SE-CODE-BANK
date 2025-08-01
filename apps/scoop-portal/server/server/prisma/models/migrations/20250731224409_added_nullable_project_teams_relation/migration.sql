-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `Teams_projectId_fkey`;

-- DropIndex
DROP INDEX `Teams_projectId_fkey` ON `teams`;

-- AlterTable
ALTER TABLE `teams` MODIFY `projectId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Teams` ADD CONSTRAINT `Teams_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
