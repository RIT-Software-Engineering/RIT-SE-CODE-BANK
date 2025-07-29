/*
  Warnings:

  - Made the column `re` on table `JournalEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `JournalEntry` MODIFY `re` VARCHAR(191) NOT NULL;
