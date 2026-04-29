-- AlterTable
ALTER TABLE `JournalEntry` ADD COLUMN `previous_entryid` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_previous_entryid_fkey` FOREIGN KEY (`previous_entryid`) REFERENCES `JournalEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
