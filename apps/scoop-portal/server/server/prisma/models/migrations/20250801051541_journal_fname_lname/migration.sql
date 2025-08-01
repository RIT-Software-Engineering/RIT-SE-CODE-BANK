/*
  Warnings:

  - You are about to drop the column `contactee_name` on the `journal_entry` table. All the data in the column will be lost.
  - You are about to drop the column `journal_owner_name` on the `journal_entry` table. All the data in the column will be lost.
  - Added the required column `contactee_fname` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contactee_lname` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_owner_fname` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `journal_owner_lname` to the `Journal_Entry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `journal_entry` DROP COLUMN `contactee_name`,
    DROP COLUMN `journal_owner_name`,
    ADD COLUMN `contactee_fname` VARCHAR(191) NOT NULL,
    ADD COLUMN `contactee_lname` VARCHAR(191) NOT NULL,
    ADD COLUMN `journal_owner_fname` VARCHAR(191) NOT NULL,
    ADD COLUMN `journal_owner_lname` VARCHAR(191) NOT NULL;
