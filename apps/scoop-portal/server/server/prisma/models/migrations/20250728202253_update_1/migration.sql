/*
  Warnings:

  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `journal_ownerId` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `journal_entry` ADD COLUMN `journal_ownerId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `user`;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `semester_group` VARCHAR(191) NOT NULL,
    `project` VARCHAR(191) NOT NULL,
    `active` VARCHAR(191) NOT NULL,
    `last_login` VARCHAR(191) NOT NULL,
    `prev_login` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_journal_ownerId_fkey` FOREIGN KEY (`journal_ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
