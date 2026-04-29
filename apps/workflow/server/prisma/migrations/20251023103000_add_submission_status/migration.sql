-- AlterTable
ALTER TABLE `ActionStateSubmission`
    ADD COLUMN `completed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `completedAt` DATETIME(3) NULL;

-- Backfill existing submissions to mark them as completed
UPDATE `ActionStateSubmission`
SET `completed` = true,
    `completedAt` = `createdAt`
WHERE `completed` = false;
