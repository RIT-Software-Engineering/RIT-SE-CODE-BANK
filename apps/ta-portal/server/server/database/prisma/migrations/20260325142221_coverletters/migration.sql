/*
  Warnings:

  - You are about to drop the column `coverLetterName` on the `JobPositionApplicationHistory` table. All the data in the column will be lost.
  - You are about to drop the column `coverLetterURL` on the `JobPositionApplicationHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `JobPositionApplicationHistory` DROP COLUMN `coverLetterName`,
    DROP COLUMN `coverLetterURL`,
    ADD COLUMN `coverLetterId` INTEGER NULL;

-- CreateTable
CREATE TABLE `CoverLetter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `coverLetterURL` VARCHAR(191) NOT NULL,

    INDEX `Cover_Letter_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `JobPositionApplicationHistory_coverLetterId_fkey` ON `JobPositionApplicationHistory`(`coverLetterId`);

-- AddForeignKey
ALTER TABLE `CoverLetter` ADD CONSTRAINT `CoverLetter_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_coverLetterId_fkey` FOREIGN KEY (`coverLetterId`) REFERENCES `CoverLetter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
