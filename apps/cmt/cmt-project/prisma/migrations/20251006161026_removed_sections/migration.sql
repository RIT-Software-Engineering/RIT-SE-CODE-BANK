-- CreateTable
CREATE TABLE `Course` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `semester` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `students` INTEGER NOT NULL,
    `professorId` INTEGER NOT NULL,

    UNIQUE INDEX `Course_id_key`(`id`),
    PRIMARY KEY (`id`, `professorId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NULL,
    `type` ENUM('exam', 'assignment', 'lecture', 'lab', 'office_hours', 'meeting') NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `importance` ENUM('Low', 'Medium', 'High') NOT NULL,
    `preparation` JSON NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `professors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBEnrollment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TBEnrollment_courseId_idx`(`courseId`),
    UNIQUE INDEX `TBEnrollment_courseId_email_key`(`courseId`, `email`),
    UNIQUE INDEX `TBEnrollment_courseId_studentId_key`(`courseId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBTeamSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `teamSize` INTEGER NULL,
    `constraints` JSON NULL,
    `publishedAt` DATETIME(3) NULL,
    `archivedAt` DATETIME(3) NULL,
    `createdByProfessorId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TBTeamSet_courseId_status_idx`(`courseId`, `status`),
    UNIQUE INDEX `TBTeamSet_courseId_name_key`(`courseId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBTeam` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamSetId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maxSize` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TBTeam_teamSetId_name_key`(`teamSetId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER NOT NULL,
    `enrollmentId` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TBMember_enrollmentId_idx`(`enrollmentId`),
    UNIQUE INDEX `TBMember_teamId_enrollmentId_key`(`teamId`, `enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBEnrollment` ADD CONSTRAINT `TBEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeamSet` ADD CONSTRAINT `TBTeamSet_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeamSet` ADD CONSTRAINT `TBTeamSet_createdByProfessorId_fkey` FOREIGN KEY (`createdByProfessorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeam` ADD CONSTRAINT `TBTeam_teamSetId_fkey` FOREIGN KEY (`teamSetId`) REFERENCES `TBTeamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBMember` ADD CONSTRAINT `TBMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `TBTeam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBMember` ADD CONSTRAINT `TBMember_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `TBEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
