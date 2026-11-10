-- AlterTable
ALTER TABLE `InterestForm` ADD COLUMN `reviewComments` VARCHAR(191) NULL,
    ADD COLUMN `reviewedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewedBy` VARCHAR(191) NULL;
