-- CreateTable
CREATE TABLE `Application` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lastName` VARCHAR(191) NOT NULL,
    `firstName` VARCHAR(191) NULL,
    `ritEmail` VARCHAR(191) NOT NULL,
    `coopsCompleted` INTEGER NULL,
    `startSemester` VARCHAR(191) NOT NULL,
    `coursesTaken` VARCHAR(191) NOT NULL,
    `coopSearchStartDate` VARCHAR(191) NULL,
    `coopSearchPlatforms` VARCHAR(191) NULL,
    `pendingOffers` BOOLEAN NOT NULL,
    `pendingOffersDetails` VARCHAR(191) NULL,
    `rejectionLetters` BOOLEAN NOT NULL,
    `rejectionLettersDetails` VARCHAR(191) NULL,
    `SEcoopInterest` BOOLEAN NOT NULL,
    `SEcoopAvailability` BOOLEAN NULL,
    `remoteAbility` VARCHAR(191) NULL,
    `additionalComments` VARCHAR(191) NULL,
    `resumeFile` VARCHAR(191) NULL,
    `accepted` BOOLEAN NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Journal_Entry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATETIME(3) NOT NULL,
    `contacteeId` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(500) NULL,
    `journal_ownerId` VARCHAR(191) NOT NULL,
    `semester_GroupId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL,
    `submission_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `project_challenges` VARCHAR(255) NOT NULL,
    `constraints_assumptions` VARCHAR(255) NOT NULL,
    `project_search_keywords` VARCHAR(255) NOT NULL,
    `team_name` VARCHAR(100) NOT NULL,
    `poster` VARCHAR(255) NULL,
    `video` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `synopsis` VARCHAR(255) NULL,
    `semesterId` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fruit` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `size` VARCHAR(191) NOT NULL,
    `rating` VARCHAR(191) NOT NULL DEFAULT '0',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Semester_Group` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `dept` VARCHAR(100) NOT NULL,
    `start_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `end_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Semester_Group_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `semester_group` VARCHAR(191) NOT NULL,
    `project` VARCHAR(191) NOT NULL,
    `active` VARCHAR(191) NOT NULL,
    `last_login` VARCHAR(191) NOT NULL,
    `prev_login` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_contacteeId_fkey` FOREIGN KEY (`contacteeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_journal_ownerId_fkey` FOREIGN KEY (`journal_ownerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Journal_Entry` ADD CONSTRAINT `Journal_Entry_semester_GroupId_fkey` FOREIGN KEY (`semester_GroupId`) REFERENCES `Semester_Group`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester_Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
