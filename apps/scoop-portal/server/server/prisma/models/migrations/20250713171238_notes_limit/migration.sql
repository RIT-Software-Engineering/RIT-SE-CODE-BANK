-- AlterTable
ALTER TABLE `journal_entry` MODIFY `notes` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
