/*
  Warnings:

  - The primary key for the `course` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `course` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `courseId` on the `events` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `courseId` on the `tbenrollment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to alter the column `courseId` on the `tbteamset` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the `student_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `classId` to the `Course` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `events` DROP FOREIGN KEY `events_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `student_enrollments` DROP FOREIGN KEY `student_enrollments_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `student_enrollments` DROP FOREIGN KEY `student_enrollments_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `tbenrollment` DROP FOREIGN KEY `TBEnrollment_courseId_fkey`;

-- DropForeignKey
ALTER TABLE `tbteamset` DROP FOREIGN KEY `TBTeamSet_courseId_fkey`;

-- DropIndex
DROP INDEX `Course_id_key` ON `course`;

-- AlterTable
ALTER TABLE `course` DROP PRIMARY KEY,
    ADD COLUMN `classId` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `events` MODIFY `courseId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tbenrollment` MODIFY `courseId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `tbteamset` MODIFY `courseId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `student_enrollments`;

-- DropTable
DROP TABLE `students`;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBEnrollment` ADD CONSTRAINT `TBEnrollment_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TBTeamSet` ADD CONSTRAINT `TBTeamSet_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
