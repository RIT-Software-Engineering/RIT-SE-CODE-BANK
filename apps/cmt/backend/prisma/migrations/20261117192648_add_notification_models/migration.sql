-- AlterTable
ALTER TABLE `Notification` MODIFY `status` ENUM('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED';

-- CreateTable
CREATE TABLE `NotificationRecipient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `notificationId` INTEGER NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'student',
    `status` ENUM('SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `lastError` VARCHAR(191) NULL,

    INDEX `NotificationRecipient_userId_idx`(`userId`),
    UNIQUE INDEX `NotificationRecipient_notificationId_userId_key`(`notificationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `NotificationRecipient` ADD CONSTRAINT `NotificationRecipient_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
