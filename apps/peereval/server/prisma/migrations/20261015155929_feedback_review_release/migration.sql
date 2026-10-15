/*
  Warnings:

  - Made the column `feedbackFormId` on table `FormInquiry` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `FormInquiry` DROP FOREIGN KEY `FormInquiry_feedbackFormId_fkey`;

-- DropIndex
DROP INDEX `FormInquiry_feedbackFormId_fkey` ON `FormInquiry`;

-- AlterTable
ALTER TABLE `FormInquiry` MODIFY `feedbackFormId` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `FormResponse` ADD COLUMN `releasedAt` DATETIME(3) NULL,
    ADD COLUMN `submittedAt` DATETIME(3) NULL;

-- AddForeignKey
ALTER TABLE `FormInquiry` ADD CONSTRAINT `FormInquiry_feedbackFormId_fkey` FOREIGN KEY (`feedbackFormId`) REFERENCES `FeedbackForm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
