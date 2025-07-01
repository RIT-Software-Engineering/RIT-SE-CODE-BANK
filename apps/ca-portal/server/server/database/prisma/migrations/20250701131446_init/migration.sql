-- CreateTable
CREATE TABLE `User` (
    `uid` INTEGER NOT NULL,
    `name` TEXT NOT NULL,
    `email` TEXT NOT NULL,
    `pronouns` TEXT NOT NULL,
    `role` ENUM('GUEST', 'STUDENT', 'EMPLOYEE', 'EMPLOYER', 'ADMIN') NOT NULL DEFAULT 'GUEST',

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Student` (
    `uid` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `major` TEXT NOT NULL,
    `graduateStatus` ENUM('UNDERGRADUATE', 'GRADUATE') NOT NULL DEFAULT 'UNDERGRADUATE',
    `wasPriorEmployee` BOOLEAN NOT NULL,
    `resumeURL` TEXT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employer` (
    `uid` INTEGER NOT NULL,
    `department` TEXT NOT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL,
    `employeeStatus` ENUM('ACTIVE', 'TERMINATED', 'RETIRED') NOT NULL DEFAULT 'RETIRED',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPositionHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentUID` INTEGER NOT NULL,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NULL,
    `jobPositionHistoryStatus` ENUM('APPLIED', 'SELECTED', 'ONHOLD', 'REJECTED', 'HIRED', 'TERMINATED', 'CLOSED') NOT NULL DEFAULT 'APPLIED',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentUID` INTEGER NOT NULL,
    `courseCode` VARCHAR(8) NOT NULL,
    `grade` VARCHAR(2) NOT NULL,
    `wasPriorEmployee` BOOLEAN NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `courseCode` VARCHAR(8) NOT NULL,
    `name` TEXT NOT NULL,
    `description` TEXT NOT NULL,

    PRIMARY KEY (`courseCode`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPosition` (
    `id` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(8) NOT NULL,
    `sectionNumber` INTEGER NOT NULL,
    `semesterCode` INTEGER NOT NULL,
    `facultyUID` INTEGER NOT NULL,
    `maxCAs` INTEGER NOT NULL,
    `jobPositionStatus` ENUM('OPEN', 'FILLED', 'ONHOLD', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `location` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `dayOfWeek` TEXT NOT NULL,
    `startTime` TIME NOT NULL,
    `endTime` TIME NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeLogHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timeLogId` VARCHAR(191) NOT NULL,
    `jobPositionHistoryId` INTEGER NOT NULL,

    UNIQUE INDEX `TimeLogHistory_jobPositionHistoryId_timeLogId_key`(`jobPositionHistoryId`, `timeLogId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimeLog` (
    `id` VARCHAR(191) NOT NULL,
    `startDateTime` DATETIME(3) NOT NULL,
    `endDateTime` DATETIME(3) NULL,
    `notes` TEXT NOT NULL,
    `duration` DECIMAL(65, 30) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Student` ADD CONSTRAINT `Student_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employer` ADD CONSTRAINT `Employer_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_studentUID_fkey` FOREIGN KEY (`studentUID`) REFERENCES `Student`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_studentUID_fkey` FOREIGN KEY (`studentUID`) REFERENCES `Student`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_facultyUID_fkey` FOREIGN KEY (`facultyUID`) REFERENCES `Employer`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobSchedule` ADD CONSTRAINT `JobSchedule_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLogHistory` ADD CONSTRAINT `TimeLogHistory_jobPositionHistoryId_fkey` FOREIGN KEY (`jobPositionHistoryId`) REFERENCES `JobPositionHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLogHistory` ADD CONSTRAINT `TimeLogHistory_timeLogId_fkey` FOREIGN KEY (`timeLogId`) REFERENCES `TimeLog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
