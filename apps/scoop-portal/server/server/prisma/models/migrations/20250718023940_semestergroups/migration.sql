/*
  Warnings:

  - Added the required column `constraints_assumptions` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poster` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_challenges` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_search_keywords` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semesterId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `synopsis` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `team_name` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `video` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `website` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `project` ADD COLUMN `constraints_assumptions` VARCHAR(255) NOT NULL,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `poster` VARCHAR(255) NOT NULL,
    ADD COLUMN `project_challenges` VARCHAR(255) NOT NULL,
    ADD COLUMN `project_search_keywords` VARCHAR(255) NOT NULL,
    ADD COLUMN `semesterId` INTEGER NOT NULL,
    ADD COLUMN `status` VARCHAR(50) NOT NULL,
    ADD COLUMN `submission_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `synopsis` VARCHAR(255) NOT NULL,
    ADD COLUMN `team_name` VARCHAR(100) NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `video` VARCHAR(255) NOT NULL,
    ADD COLUMN `website` VARCHAR(255) NOT NULL;

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

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester_Group`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
