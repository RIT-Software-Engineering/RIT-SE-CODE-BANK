-- AlterTable
ALTER TABLE `JournalEntry` ADD COLUMN `privacy_level` ENUM('PERSONAL', 'PUBLIC') NULL,
    ADD COLUMN `visibility_level` INTEGER NULL;
