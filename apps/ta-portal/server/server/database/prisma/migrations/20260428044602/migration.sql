-- DropForeignKey
ALTER TABLE `JobPositionApplicationHistory` DROP FOREIGN KEY `JobPositionApplicationHistory_resumeId_fkey`;

-- AlterTable
ALTER TABLE `JobPositionApplicationHistory` MODIFY `resumeId` INTEGER NULL,
    MODIFY `candidatePronouns` TEXT NULL,
    MODIFY `candidateMajor` TEXT NULL,
    MODIFY `candidateYear` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `Resume`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
