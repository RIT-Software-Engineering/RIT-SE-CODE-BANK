-- CreateTable
CREATE TABLE `User` (
    `uid` INTEGER NOT NULL,
    `name` TEXT NOT NULL,
    `email` TEXT NOT NULL,
    `pronouns` TEXT NOT NULL,
    `role` ENUM('GUEST', 'CANDIDATE', 'EMPLOYEE', 'EMPLOYER', 'ADMIN') NOT NULL DEFAULT 'GUEST',

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Candidate` (
    `uid` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `major` TEXT NOT NULL,
    `graduateStatus` ENUM('UNDERGRADUATE', 'GRADUATE') NOT NULL DEFAULT 'UNDERGRADUATE',
    `wasPriorEmployee` BOOLEAN NOT NULL,

    PRIMARY KEY (`uid`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `foreignTableName` TEXT NOT NULL,
    `foreignKey` TEXT NOT NULL,
    `status` TEXT NOT NULL,
    `comment` TEXT NOT NULL,
    `timestamp` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resume` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` TEXT NOT NULL,
    `candidateUID` INTEGER NOT NULL,
    `isPrimary` BOOLEAN NOT NULL,
    `resumeURL` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
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
    `candidateUID` INTEGER NOT NULL,
    `employeeStatus` ENUM('ACTIVE', 'TERMINATED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPositionHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `employeeId` INTEGER NOT NULL,
    `jobPositionHistoryStatus` ENUM('ACTIVE', 'TERMINATED', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JobPositionApplicationHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `candidateUID` INTEGER NOT NULL,
    `jobPositionId` VARCHAR(191) NOT NULL,
    `resumeId` INTEGER NOT NULL,
    `jobApplicationStatus` ENUM('APPLIED', 'ACCEPTED_OFFER', 'PENDING_OFFER', 'INTERVIEW', 'ONHOLD', 'REJECTED', 'INACTIVE') NOT NULL DEFAULT 'APPLIED',
    `candidateName` TEXT NOT NULL,
    `candidateEmail` TEXT NOT NULL,
    `candidateMajor` TEXT NOT NULL,
    `candidateYear` INTEGER NOT NULL,
    `candidateGrade` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `wasPriorEmployeeForThisCourse` BOOLEAN NOT NULL,
    `wasPriorEmployeeForOtherCourses` BOOLEAN NOT NULL,
    `priorEmploymentHistory` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CourseHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `candidateUID` INTEGER NOT NULL,
    `courseCode` VARCHAR(8) NOT NULL,
    `grade` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `hasTaken` BOOLEAN NOT NULL,
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
    `employerUID` INTEGER NOT NULL,
    `maxCAs` INTEGER NOT NULL,
    `jobPositionStatus` ENUM('ACTIVE', 'OPEN', 'FILLED', 'ONHOLD', 'INACTIVE') NOT NULL DEFAULT 'OPEN',
    `location` TEXT NOT NULL,
    `locationType` ENUM('INPERSON', 'HYBRID', 'REMOTE') NOT NULL,
    `graduateStatusRequirement` ENUM('UNDERGRADUATE', 'GRADUATE') NULL,
    `gradeRequirement` ENUM('A', 'A_MINUS', 'B_PLUS', 'B', 'B_MINUS', 'C_PLUS', 'C', 'C_MINUS', 'D', 'F') NULL,
    `courseTakenRequirement` BOOLEAN NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,

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
ALTER TABLE `Candidate` ADD CONSTRAINT `Candidate_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resume` ADD CONSTRAINT `Resume_candidateUID_fkey` FOREIGN KEY (`candidateUID`) REFERENCES `Candidate`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employer` ADD CONSTRAINT `Employer_uid_fkey` FOREIGN KEY (`uid`) REFERENCES `User`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_candidateUID_fkey` FOREIGN KEY (`candidateUID`) REFERENCES `Candidate`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionHistory` ADD CONSTRAINT `JobPositionHistory_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_candidateUID_fkey` FOREIGN KEY (`candidateUID`) REFERENCES `Candidate`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_resumeId_fkey` FOREIGN KEY (`resumeId`) REFERENCES `Resume`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPositionApplicationHistory` ADD CONSTRAINT `JobPositionApplicationHistory_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_candidateUID_fkey` FOREIGN KEY (`candidateUID`) REFERENCES `Candidate`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CourseHistory` ADD CONSTRAINT `CourseHistory_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_courseCode_fkey` FOREIGN KEY (`courseCode`) REFERENCES `Course`(`courseCode`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobPosition` ADD CONSTRAINT `JobPosition_employerUID_fkey` FOREIGN KEY (`employerUID`) REFERENCES `Employer`(`uid`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JobSchedule` ADD CONSTRAINT `JobSchedule_jobPositionId_fkey` FOREIGN KEY (`jobPositionId`) REFERENCES `JobPosition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLogHistory` ADD CONSTRAINT `TimeLogHistory_jobPositionHistoryId_fkey` FOREIGN KEY (`jobPositionHistoryId`) REFERENCES `JobPositionHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TimeLogHistory` ADD CONSTRAINT `TimeLogHistory_timeLogId_fkey` FOREIGN KEY (`timeLogId`) REFERENCES `TimeLog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
