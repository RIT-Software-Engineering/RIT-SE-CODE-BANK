-- AlterTable
ALTER TABLE `Project` ADD COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `users` ADD COLUMN `profilePicture` TEXT NULL;
