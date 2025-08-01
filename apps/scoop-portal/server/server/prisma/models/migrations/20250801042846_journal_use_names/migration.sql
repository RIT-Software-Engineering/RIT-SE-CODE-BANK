/*
  Warnings:

  - You are about to drop the column `contacteeId` on the `journal_entry` table. All the data in the column will be lost.
  - You are about to drop the column `journal_ownerId` on the `journal_entry` table. All the data in the column will be lost.
  - Added the required column `contactee_name` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_owner_name` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `journal_entry` DROP FOREIGN KEY `Journal_Entry_contacteeId_fkey`;

-- DropForeignKey
ALTER TABLE `journal_entry` DROP FOREIGN KEY `Journal_Entry_journal_ownerId_fkey`;

-- DropIndex
DROP INDEX `Journal_Entry_contacteeId_fkey` ON `journal_entry`;

-- DropIndex
DROP INDEX `Journal_Entry_journal_ownerId_fkey` ON `journal_entry`;

-- AlterTable
ALTER TABLE `journal_entry` DROP COLUMN `contacteeId`,
    DROP COLUMN `journal_ownerId`,
    ADD COLUMN `contactee_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `journal_owner_name` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_contactee_name_fkey` FOREIGN KEY (`contactee_name`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_journal_owner_name_fkey` FOREIGN KEY (`journal_owner_name`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
