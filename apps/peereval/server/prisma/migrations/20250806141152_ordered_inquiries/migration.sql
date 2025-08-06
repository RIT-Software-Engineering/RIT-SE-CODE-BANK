/*
  Warnings:

  - You are about to drop the `_FeedbackFormToInquiry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_FeedbackFormToInquiry` DROP FOREIGN KEY `_FeedbackFormToInquiry_A_fkey`;

-- DropForeignKey
ALTER TABLE `_FeedbackFormToInquiry` DROP FOREIGN KEY `_FeedbackFormToInquiry_B_fkey`;

-- DropTable
DROP TABLE `_FeedbackFormToInquiry`;

-- CreateTable
CREATE TABLE `FormInquiry` (
    `id` CHAR(36) NOT NULL,
    `index` INTEGER NOT NULL,
    `feedbackFormId` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FormInquiry` ADD CONSTRAINT `FormInquiry_feedbackFormId_fkey` FOREIGN KEY (`feedbackFormId`) REFERENCES `FeedbackForm`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
