/*
  Warnings:

  - A unique constraint covering the columns `[loginId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `loginId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Login` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Login_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_loginId_key` ON `users`(`loginId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_loginId_fkey` FOREIGN KEY (`loginId`) REFERENCES `Login`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
