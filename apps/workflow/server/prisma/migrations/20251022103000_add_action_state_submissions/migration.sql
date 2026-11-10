-- CreateTable
CREATE TABLE `ActionStateSubmission` (
    `id` CHAR(36) NOT NULL,
    `actionStateId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ActionStateSubmission_actionStateId_userId_key`(`actionStateId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ActionStateSubmission` ADD CONSTRAINT `ActionStateSubmission_actionStateId_fkey` FOREIGN KEY (`actionStateId`) REFERENCES `ActionState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
