/*
  Warnings:

  - You are about to drop the column `academicAdvisor` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `coursesTaken` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `creditsRemaining` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `cumulativeGPA` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Application` DROP COLUMN `academicAdvisor`,
    DROP COLUMN `coursesTaken`,
    DROP COLUMN `creditsRemaining`,
    DROP COLUMN `cumulativeGPA`;

-- CreateTable
CREATE TABLE `InterestForm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicant_id` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `ritEmail` VARCHAR(191) NOT NULL,
    `userID` VARCHAR(191) NULL,
    `academicAdvisor` VARCHAR(191) NULL,
    `creditsRemaining` VARCHAR(191) NULL,
    `cumulativeGPA` VARCHAR(191) NULL,
    `coursesTaken` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
