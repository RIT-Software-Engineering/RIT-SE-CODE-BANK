-- CreateTable
CREATE TABLE `User` (
    `username` VARCHAR(7) NOT NULL,
    `uid` INTEGER NOT NULL,
    `fname` TEXT NOT NULL,
    `lname` TEXT NOT NULL,
    `password` TEXT NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `pronouns` TEXT NOT NULL,
    `role` ENUM('GUEST', 'CANDIDATE', 'EMPLOYEE', 'EMPLOYER', 'ADMIN') NOT NULL DEFAULT 'GUEST',

    UNIQUE INDEX `User_uid_key`(`uid`),
    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidate` (
    `username` VARCHAR(191) NOT NULL,
    `year` INTEGER NOT NULL,
    `major` TEXT NOT NULL,
    `graduateStatus` ENUM('UNDERGRADUATE', 'GRADUATE') NOT NULL DEFAULT 'UNDERGRADUATE',
    `wasPriorEmployee` BOOLEAN NOT NULL,

    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `author` VARCHAR(191) NOT NULL,
    `foreignTableName` TEXT NOT NULL,
    `foreignKey` TEXT NOT NULL,
    `status` TEXT NOT NULL,
    `comment` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApplicationNote` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `note` TEXT NOT NULL,
    `applicationId` INTEGER NOT NULL,

    UNIQUE INDEX `ApplicationNote_applicationId_key`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resume` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `isPrimary` BOOLEAN NOT NULL,
    `isSoftDeleted` BOOLEAN NOT NULL DEFAULT false,
    `resumeURL` VARCHAR(191) NOT NULL,

    INDEX `Resume_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CoverLetter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `coverLetterURL` VARCHAR(191) NOT NULL,

    INDEX `Cover_Letter_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employer` (
    `username` VARCHAR(191) NOT NULL,
    `department` TEXT NOT NULL,

    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `id` INTEGER NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `employeeStatus` ENUM('ACTIVE', 'TERMINATED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    INDEX `Employee_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPositionHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `jobPositionHistoryStatus` ENUM('ACTIVE', 'TERMINATED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    INDEX `JobPositionHistory_employeeId_fkey`(`employeeId`),
    INDEX `JobPositionHistory_jobPositionId_fkey`(`jobPositionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPositionApplicationHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `candidateUID` INTEGER NOT NULL,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `resumeId` INTEGER NOT NULL,
    `jobApplicationStatus` ENUM('APPLIED', 'HIRED', 'ACCEPTED_OFFER', 'DECLINED_OFFER', 'PENDING_OFFER', 'INTERVIEW', 'ONHOLD', 'REJECTED', 'INACTIVE') NOT NULL DEFAULT 'APPLIED',
    `candidateFName` TEXT NOT NULL,
    `candidateLName` TEXT NOT NULL,
    `candidatePronouns` TEXT NOT NULL,
    `candidateEmail` TEXT NOT NULL,
    `candidateMajor` TEXT NOT NULL,
    `candidateYear` INTEGER NOT NULL,
    `candidateGrade` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `wasPriorEmployeeForThisCourse` BOOLEAN NOT NULL,
    `wasPriorEmployeeForOtherCourses` BOOLEAN NOT NULL,
    `priorEmploymentHistory` TEXT NULL,
    `coverLetterId` INTEGER NULL,

    INDEX `JobPositionApplicationHistory_jobPositionId_fkey`(`jobPositionId`),
    INDEX `JobPositionApplicationHistory_resumeId_fkey`(`resumeId`),
    INDEX `JobPositionApplicationHistory_coverLetterId_fkey`(`coverLetterId`),
    INDEX `JobPositionApplicationHistory_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `courseCode` VARCHAR(8) NOT NULL,
    `grade` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `hasTaken` BOOLEAN NOT NULL,
    `wasPriorEmployee` BOOLEAN NOT NULL,

    INDEX `CourseHistory_courseCode_fkey`(`courseCode`),
    INDEX `CourseHistory_username_fkey`(`username`),
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
    `username` VARCHAR(191) NOT NULL,
    `maxTAs` INTEGER NOT NULL,
    `jobPositionStatus` ENUM('ACTIVE', 'OPEN', 'FILLED', 'ONHOLD', 'INACTIVE', 'PENDING_APPROVAL', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL',
    `location` TEXT NOT NULL,
    `locationType` ENUM('INPERSON', 'HYBRID', 'REMOTE') NOT NULL,
    `graduateStatusRequirement` ENUM('UNDERGRADUATE', 'GRADUATE') NULL,
    `gradeRequirement` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `courseTakenRequirement` BOOLEAN NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,

    INDEX `JobPosition_courseCode_fkey`(`courseCode`),
    INDEX `JobPosition_username_fkey`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobSchedule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `dayOfWeek` TEXT NOT NULL,
    `startTime` TIME(0) NOT NULL,
    `endTime` TIME(0) NOT NULL,

    INDEX `JobSchedule_jobPositionId_fkey`(`jobPositionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimecardWeeklyHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobPositionHistoryId` INTEGER NOT NULL,
    `isCurrentWeek` BOOLEAN NOT NULL,
    `weekStartDate` DATE NOT NULL,

    INDEX `TimecardWeeklyHistory_jobPositionHistoryId_idx`(`jobPositionHistoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TimecardDay` (
    `id` VARCHAR(191) NOT NULL,
    `day` DATE NOT NULL,
    `timecardWeeklyHistoryId` INTEGER NOT NULL,
    `notes` TEXT NULL,
    `duration` DECIMAL(10, 2) NOT NULL,
    `timeIn1` TIME(0) NULL,
    `timeOut1` TIME(0) NULL,
    `timeIn2` TIME(0) NULL,
    `timeOut2` TIME(0) NULL,
    `timeIn3` TIME(0) NULL,
    `timeOut3` TIME(0) NULL,

    INDEX `TimecardDay_timecardWeeklyHistoryId_idx`(`timecardWeeklyHistoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatureFlag` (
    `name` VARCHAR(50) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Candidate` ADD CONSTRAINT `Candidate_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ApplicationNote` ADD CONSTRAINT `ApplicationNote_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `JobPositionApplicationHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resume` ADD CONSTRAINT `Resume_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CoverLetter` ADD CONSTRAINT `CoverLetter_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employer` ADD CONSTRAINT `Employer_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `Resume`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_coverLetterId_fkey` FOREIGN KEY (`coverLetterId`) REFERENCES `CoverLetter`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_username_fkey` FOREIGN KEY (`username`) REFERENCES `Candidate`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_username_fkey` FOREIGN KEY (`username`) REFERENCES `Employer`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobSchedule` ADD CONSTRAINT `JobSchedule_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimecardWeeklyHistory` ADD CONSTRAINT `TimecardWeeklyHistory_jobPositionHistoryId_fkey` FOREIGN KEY (`jobPositionHistoryId`) REFERENCES `JobPositionHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimecardDay` ADD CONSTRAINT `TimecardDay_timecardWeeklyHistoryId_fkey` FOREIGN KEY (`timecardWeeklyHistoryId`) REFERENCES `TimecardWeeklyHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
