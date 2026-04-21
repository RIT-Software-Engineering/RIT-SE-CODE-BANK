-- DropForeignKey
ALTER TABLE `Teams` DROP FOREIGN KEY `Teams_scoopervisorId_fkey`;

-- DropIndex
DROP INDEX `Teams_scoopervisorId_fkey` ON `Teams`;
