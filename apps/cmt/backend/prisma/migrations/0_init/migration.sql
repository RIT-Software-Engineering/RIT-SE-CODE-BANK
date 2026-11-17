-- CreateTable
CREATE TABLE `professors` (
    `id` VARCHAR(191) NOT NULL,
    `fname` VARCHAR(191) NOT NULL,
    `lname` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Course` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `season` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `classId` VARCHAR(191) NOT NULL,
    `color` VARCHAR(191) NOT NULL,
    `students` INTEGER NULL,
    `section` VARCHAR(191) NULL,
    `days` VARCHAR(191) NULL,
    `startDate` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `professorId` VARCHAR(191) NOT NULL,
    `workflowId` VARCHAR(191) NOT NULL,
    `workflowStateId` VARCHAR(191) NOT NULL,
    `syllabusName` VARCHAR(191) NULL,
    `isTemplate` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionNum` INTEGER NOT NULL,
    `courseId` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `canceled` BOOLEAN NOT NULL DEFAULT false,
    `canceledAt` DATETIME(3) NULL,
    `asid` VARCHAR(191) NULL,
    `date` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionMaterial` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `label` TEXT NOT NULL,
    `body` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `sessionId` INTEGER NOT NULL,
    `sessionNum` INTEGER NOT NULL,
    `blockId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionBlock` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'NOT_STARTED',
    `position` INTEGER NOT NULL DEFAULT 0,
    `sessionId` INTEGER NOT NULL,

    INDEX `SessionBlock_sessionId_position_idx`(`sessionId`, `position`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBEnrollment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `firstName` VARCHAR(191) NULL,
    `lastName` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TBEnrollment_courseId_idx`(`courseId`),
    UNIQUE INDEX `TBEnrollment_courseId_email_key`(`courseId`, `email`),
    UNIQUE INDEX `TBEnrollment_courseId_studentId_key`(`courseId`, `studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamId` INTEGER NOT NULL,
    `enrollmentId` INTEGER NOT NULL,
    `role` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TBMember_enrollmentId_idx`(`enrollmentId`),
    UNIQUE INDEX `TBMember_teamId_enrollmentId_key`(`teamId`, `enrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBTeam` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `teamSetId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maxSize` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `TBTeam_teamSetId_name_key`(`teamSetId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TBTeamSet` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `teamSize` INTEGER NULL,
    `constraints` LONGTEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdByProfessorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TBTeamSet_courseId_status_idx`(`courseId`, `status`),
    INDEX `TBTeamSet_createdByProfessorId_idx`(`createdByProfessorId`),
    UNIQUE INDEX `TBTeamSet_courseId_name_key`(`courseId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `resources` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `courseId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `isSyllabus` BOOLEAN NOT NULL DEFAULT false,

    INDEX `resources_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `holidays` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `courseId` INTEGER NOT NULL,

    INDEX `holidays_courseId_idx`(`courseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Course` ADD CONSTRAINT `Course_professorId_fkey` FOREIGN KEY (`professorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionMaterial` ADD CONSTRAINT `SessionMaterial_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionMaterial` ADD CONSTRAINT `SessionMaterial_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `SessionBlock`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionBlock` ADD CONSTRAINT `SessionBlock_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBEnrollment` ADD CONSTRAINT `TBEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBMember` ADD CONSTRAINT `TBMember_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `TBEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBMember` ADD CONSTRAINT `TBMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `TBTeam`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeam` ADD CONSTRAINT `TBTeam_teamSetId_fkey` FOREIGN KEY (`teamSetId`) REFERENCES `TBTeamSet`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeamSet` ADD CONSTRAINT `TBTeamSet_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeamSet` ADD CONSTRAINT `TBTeamSet_createdByProfessorId_fkey` FOREIGN KEY (`createdByProfessorId`) REFERENCES `professors`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `resources` ADD CONSTRAINT `resources_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `holidays` ADD CONSTRAINT `holidays_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

