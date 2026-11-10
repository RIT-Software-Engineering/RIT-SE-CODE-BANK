/*
  Warnings:

  - You are about to drop the column `recipient_id` on the `JournalEntry` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `JournalEntry` DROP FOREIGN KEY `JournalEntry_recipient_id_fkey`;

-- DropIndex
DROP INDEX `JournalEntry_recipient_id_fkey` ON `JournalEntry`;

-- AlterTable
ALTER TABLE `JournalEntry` DROP COLUMN `recipient_id`;

-- CreateTable
CREATE TABLE `_ReceivedUserEntries` (
    `A` INTEGER NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ReceivedUserEntries_AB_unique`(`A`, `B`),
    INDEX `_ReceivedUserEntries_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ReceivedUserEntries` ADD CONSTRAINT `_ReceivedUserEntries_A_fkey` FOREIGN KEY (`A`) REFERENCES `JournalEntry`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ReceivedUserEntries` ADD CONSTRAINT `_ReceivedUserEntries_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
