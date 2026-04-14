-- CreateTable
CREATE TABLE `ApplicationNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `note` TEXT NOT NULL,
    `applicationId` INTEGER NOT NULL,

    UNIQUE INDEX `ApplicationNote_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ApplicationNote` ADD CONSTRAINT `ApplicationNote_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobPositionApplicationHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
