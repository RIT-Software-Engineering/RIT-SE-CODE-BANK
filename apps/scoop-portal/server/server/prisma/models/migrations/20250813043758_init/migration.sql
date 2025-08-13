/*
  Warnings:

  - You are about to drop the column `semester_GroupId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `Journal_Entry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Semester_Group` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Journal_Entry` DROP FOREIGN KEY `Journal_Entry_semester_GroupId_fkey`;

-- DropForeignKey
ALTER TABLE `Project` DROP FOREIGN KEY `Project_semester_GroupId_fkey`;

-- DropIndex
DROP INDEX `Project_semester_GroupId_fkey` ON `Project`;

-- AlterTable
ALTER TABLE `Project` DROP COLUMN `semester_GroupId`,
    ADD COLUMN `semesterGroupId` INTEGER NULL;

-- DropTable
DROP TABLE `Journal_Entry`;

-- DropTable
DROP TABLE `Semester_Group`;

-- CreateTable
CREATE TABLE `SemesterGroup` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `dept` VARCHAR(100) NOT NULL,
    `start_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `SemesterGroup_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `contactee_fname` VARCHAR(191) NOT NULL,
    `contactee_lname` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `journal_owner_fname` VARCHAR(191) NOT NULL,
    `journal_owner_lname` VARCHAR(191) NOT NULL,
    `journal_owner_type` VARCHAR(191) NULL,
    `semester_GroupId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_semesterGroupId_fkey` FOREIGN KEY (`semesterGroupId`) REFERENCES `SemesterGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_semester_GroupId_fkey` FOREIGN KEY (`semester_GroupId`) REFERENCES `SemesterGroup`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
