/*
  Warnings:

  - You are about to drop the column `contactee` on the `journal_entry` table. All the data in the column will be lost.
  - Added the required column `contacteeId` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `journal_entry` DROP COLUMN `contactee`,
    ADD COLUMN `contacteeId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_contacteeId_fkey` FOREIGN KEY (`contacteeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
