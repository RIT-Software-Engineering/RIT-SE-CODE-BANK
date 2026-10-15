-- CreateTable
CREATE TABLE `AssessmentReminder` (
    `id` CHAR(36) NOT NULL,
    `assessmentId` CHAR(36) NOT NULL,
    `responderId` CHAR(36) NOT NULL,
    `type` ENUM('DUE_SOON', 'OVERDUE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sentAt` DATETIME(3) NULL,

    INDEX `AssessmentReminder_sentAt_idx`(`sentAt`),
    UNIQUE INDEX `AssessmentReminder_assessmentId_responderId_type_key`(`assessmentId`, `responderId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AssessmentReminder` ADD CONSTRAINT `AssessmentReminder_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentReminder` ADD CONSTRAINT `AssessmentReminder_responderId_fkey` FOREIGN KEY (`responderId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
