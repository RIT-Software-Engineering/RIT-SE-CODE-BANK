-- AlterTable
ALTER TABLE `Application` ADD COLUMN `offerExpiresAt` DATETIME(3) NULL,
    ADD COLUMN `offerRespondedAt` DATETIME(3) NULL,
    ADD COLUMN `offerSentAt` DATETIME(3) NULL,
    ADD COLUMN `offerStatus` VARCHAR(191) NULL;
