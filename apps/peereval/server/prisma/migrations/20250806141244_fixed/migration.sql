/*
  Warnings:

  - Added the required column `inquiryId` to the `FormInquiry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `FormInquiry` ADD COLUMN `inquiryId` CHAR(36) NOT NULL;

-- AddForeignKey
ALTER TABLE `FormInquiry` ADD CONSTRAINT `FormInquiry_inquiryId_fkey` FOREIGN KEY (`inquiryId`) REFERENCES `Inquiry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
