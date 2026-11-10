-- AlterTable
ALTER TABLE `JournalEntry` ADD COLUMN `entry_type` ENUM('MANUAL', 'AUTOMATED') NULL;
