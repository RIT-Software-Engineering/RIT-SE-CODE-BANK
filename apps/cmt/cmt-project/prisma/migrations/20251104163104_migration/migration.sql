/*
  Warnings:

  - You are about to drop the column `preparation` on the `events` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId,email]` on the table `TBEnrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `events` DROP COLUMN `preparation`,
    MODIFY `description` LONGTEXT NULL;

-- CreateTable
CREATE TABLE `course_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `weeks` INTEGER NOT NULL,
    `assignments` INTEGER NOT NULL,
    `exams` INTEGER NOT NULL,
    `labs` INTEGER NOT NULL,
    `projects` INTEGER NOT NULL,
    `professorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `course_templates_professorId_idx`(`professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `dueDate` DATETIME(3) NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `template_items_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `TBEnrollment_courseId_email_key` ON `TBEnrollment`(`courseId`, `email`);

-- AddForeignKey
ALTER TABLE `course_templates` ADD CONSTRAINT `course_templates_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `template_items` ADD CONSTRAINT `template_items_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `course_templates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
