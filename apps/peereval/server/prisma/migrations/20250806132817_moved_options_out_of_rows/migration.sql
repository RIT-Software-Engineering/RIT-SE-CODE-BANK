/*
  Warnings:

  - You are about to drop the column `options` on the `RubricRow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Inquiry` ADD COLUMN `options` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `RubricRow` DROP COLUMN `options`;
