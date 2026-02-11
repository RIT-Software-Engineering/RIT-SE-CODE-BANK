/*
  Warnings:

  - You are about to alter the column `semester` on the `course` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.

*/
-- AlterTable
ALTER TABLE `course` ADD COLUMN `section` INTEGER NULL,
    MODIFY `semester` INTEGER NOT NULL,
    MODIFY `students` INTEGER NULL;
