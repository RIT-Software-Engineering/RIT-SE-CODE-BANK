-- CreateTable
CREATE TABLE `ProjectProposal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `techStack` VARCHAR(500) NULL,
    `teamSize` INTEGER NULL,
    `duration` VARCHAR(100) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `submittedById` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `reviewNotes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProjectProposal` ADD CONSTRAINT `ProjectProposal_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProjectProposal` ADD CONSTRAINT `ProjectProposal_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
