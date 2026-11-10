-- AlterTable
ALTER TABLE `Application` ADD COLUMN `resumeFileName` VARCHAR(191) NULL,
    ADD COLUMN `resumeFileType` VARCHAR(191) NULL,
    MODIFY `resumeFile` LONGBLOB NULL;
