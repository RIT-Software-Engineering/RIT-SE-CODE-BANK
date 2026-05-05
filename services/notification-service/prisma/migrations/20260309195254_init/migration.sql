-- CreateTable
CREATE TABLE `user_preferences` (
    `appId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `userEmail` VARCHAR(191) NULL,
    `notifyEmail` BOOLEAN NOT NULL DEFAULT true,
    `notifySlack` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_preferences_userEmail_idx`(`userEmail`),
    PRIMARY KEY (`appId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
