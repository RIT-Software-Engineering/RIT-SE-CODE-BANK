-- CreateTable
CREATE TABLE `Journal` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` CHAR(36) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `journalId` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntryTag` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `journalEntryId` CHAR(36) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Journal` ADD CONSTRAINT `Journal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_journalId_fkey` FOREIGN KEY (`journalId`) REFERENCES `Journal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntryTag` ADD CONSTRAINT `JournalEntryTag_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `JournalEntry`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
