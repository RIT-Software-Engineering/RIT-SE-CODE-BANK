/*
  Warnings:

  - You are about to drop the column `SEcoopAvailability` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `SEcoopInterest` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `remoteAbility` on the `Application` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Application` DROP COLUMN `SEcoopAvailability`,
    DROP COLUMN `SEcoopInterest`,
    DROP COLUMN `remoteAbility`,
    ADD COLUMN `SEcoopReferral` VARCHAR(191) NULL,
    ADD COLUMN `SEcoopReferralDetails` VARCHAR(191) NULL,
    ADD COLUMN `academicAdvisor` VARCHAR(191) NULL,
    ADD COLUMN `creditsRemaining` VARCHAR(191) NULL,
    ADD COLUMN `cumulativeGPA` VARCHAR(191) NULL,
    ADD COLUMN `jobSearchAcknowledgment` BOOLEAN NULL,
    ADD COLUMN `jobSearchAcknowledgmentDetails` VARCHAR(191) NULL,
    ADD COLUMN `userID` VARCHAR(191) NULL;
