-- AlterTable
ALTER TABLE `Teams` ADD COLUMN `semesterGroupId` INTEGER NULL,
    ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'active';

-- AddForeignKey
ALTER TABLE `Teams` ADD CONSTRAINT `Teams_semesterGroupId_fkey` FOREIGN KEY (`semesterGroupId`) REFERENCES `SemesterGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
