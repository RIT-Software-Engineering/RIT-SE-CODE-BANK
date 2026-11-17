/*
  Warnings:

  - A unique constraint covering the columns `[offeringId,section]` on the table `Course` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[courseId,studentProfileId]` on the table `TBEnrollment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Course` ADD COLUMN `execWorkflowId` VARCHAR(191) NULL,
    ADD COLUMN `execWorkflowStateId` VARCHAR(191) NULL,
    ADD COLUMN `offeringId` INTEGER NULL;

-- AlterTable
ALTER TABLE `resources` ADD COLUMN `sharedKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Session` ADD COLUMN `sharedKey` VARCHAR(191) NULL,
    ADD COLUMN `teachingWeek` INTEGER NULL;

-- AlterTable
ALTER TABLE `SessionBlock` ADD COLUMN `sharedKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SessionMaterial` ADD COLUMN `sharedKey` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `TBEnrollment` ADD COLUMN `studentProfileId` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `students` (
    `id` CHAR(36) NOT NULL,
    `fname` VARCHAR(191) NULL,
    `lname` VARCHAR(191) NULL,
    `email` VARCHAR(254) NOT NULL,

    UNIQUE INDEX `students_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseOffering` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `season` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `startDate` VARCHAR(191) NULL,
    `professorId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionInstructor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `assignedByProfessorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SectionInstructor_professorId_idx`(`professorId`),
    UNIQUE INDEX `SectionInstructor_courseId_professorId_key`(`courseId`, `professorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionTA` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `studentProfileId` CHAR(36) NOT NULL,
    `assignedByProfessorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SectionTA_studentProfileId_idx`(`studentProfileId`),
    UNIQUE INDEX `SectionTA_courseId_studentProfileId_key`(`courseId`, `studentProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionSyncAcknowledgment` (
    `issueId` INTEGER NOT NULL,
    `professorId` VARCHAR(191) NOT NULL,
    `occurrence` INTEGER NOT NULL,
    `dismissedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SectionSyncAcknowledgment_professorId_idx`(`professorId`),
    PRIMARY KEY (`issueId`, `professorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SectionSyncIssue` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `offeringId` INTEGER NOT NULL,
    `issueKey` VARCHAR(191) NOT NULL,
    `details` JSON NOT NULL,
    `resolved` BOOLEAN NOT NULL DEFAULT false,
    `occurrence` INTEGER NOT NULL DEFAULT 1,
    `dismissedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SectionSyncIssue_offeringId_issueKey_key`(`offeringId`, `issueKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `triggerId` INTEGER NULL,
    `context` JSON NOT NULL,
    `note` VARCHAR(191) NULL,
    `recipients` JSON NOT NULL,
    `status` ENUM('SCHEDULED', 'SENT', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `sendAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Course_offeringId_section_key` ON `Course`(`offeringId`, `section`);

-- CreateIndex
CREATE INDEX `Session_courseId_sharedKey_idx` ON `Session`(`courseId`, `sharedKey`);

-- CreateIndex
CREATE INDEX `SessionBlock_sharedKey_idx` ON `SessionBlock`(`sharedKey`);

-- CreateIndex
CREATE INDEX `SessionMaterial_sharedKey_idx` ON `SessionMaterial`(`sharedKey`);

-- CreateIndex
CREATE INDEX `TBEnrollment_studentProfileId_idx` ON `TBEnrollment`(`studentProfileId`);

-- CreateIndex
CREATE UNIQUE INDEX `TBEnrollment_courseId_studentProfileId_key` ON `TBEnrollment`(`courseId`, `studentProfileId`);

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_offeringId_fkey` FOREIGN KEY (`offeringId`) REFERENCES `CourseOffering`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseOffering` ADD CONSTRAINT `CourseOffering_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionInstructor` ADD CONSTRAINT `SectionInstructor_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionInstructor` ADD CONSTRAINT `SectionInstructor_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionInstructor` ADD CONSTRAINT `SectionInstructor_assignedByProfessorId_fkey` FOREIGN KEY (`assignedByProfessorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionTA` ADD CONSTRAINT `SectionTA_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionTA` ADD CONSTRAINT `SectionTA_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `students`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionTA` ADD CONSTRAINT `SectionTA_assignedByProfessorId_fkey` FOREIGN KEY (`assignedByProfessorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionSyncAcknowledgment` ADD CONSTRAINT `SectionSyncAcknowledgment_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `SectionSyncIssue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionSyncAcknowledgment` ADD CONSTRAINT `SectionSyncAcknowledgment_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SectionSyncIssue` ADD CONSTRAINT `SectionSyncIssue_offeringId_fkey` FOREIGN KEY (`offeringId`) REFERENCES `CourseOffering`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBEnrollment` ADD CONSTRAINT `TBEnrollment_studentProfileId_fkey` FOREIGN KEY (`studentProfileId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
