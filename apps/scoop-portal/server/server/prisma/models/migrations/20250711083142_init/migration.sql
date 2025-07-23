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
    `contactee` VARCHAR(191) NOT NULL,
    `notes` VARCHAR(191) NOT NULL,

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
CREATE TABLE `User` (
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
