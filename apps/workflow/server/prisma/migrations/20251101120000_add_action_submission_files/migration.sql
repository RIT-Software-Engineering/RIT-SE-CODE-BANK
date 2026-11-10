-- Add submission requirements and file storage for action submissions
ALTER TABLE `Action`
    ADD COLUMN `requiresSubmission` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `submissionMimeTypes` VARCHAR(512) NULL;

ALTER TABLE `ActionStateSubmission`
    ADD COLUMN `fileName` VARCHAR(255) NULL,
    ADD COLUMN `fileType` VARCHAR(255) NULL,
    ADD COLUMN `fileSize` INTEGER NULL,
    ADD COLUMN `fileData` LONGBLOB NULL;
