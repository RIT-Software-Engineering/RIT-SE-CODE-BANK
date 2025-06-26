-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(255) NOT NULL,
    `name` TEXT NOT NULL,
    `description` TEXT NOT NULL,
    `sectionNumber` INTEGER NOT NULL,
    `location` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` VARCHAR(255) NOT NULL,
    `dayOfWeek` TEXT NOT NULL,
    `startTime` TIME NOT NULL,
    `endTime` TIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPosition` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` VARCHAR(255) NOT NULL,
    `employerId` INTEGER NOT NULL,
    `maxCAs` INTEGER NOT NULL,
    `isOpen` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `department` TEXT NOT NULL,
    `email` TEXT NOT NULL,
    `isAdmin` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CourseSchedule` ADD CONSTRAINT `CourseSchedule_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_employerId_fkey` FOREIGN KEY (`employerId`) REFERENCES `Employer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
