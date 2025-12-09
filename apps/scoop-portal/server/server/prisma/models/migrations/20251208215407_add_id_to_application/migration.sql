-- AlterTable
ALTER TABLE `Application` ADD COLUMN `applicant_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `semester_group` VARCHAR(191) NULL,
    MODIFY `project` VARCHAR(191) NULL,
    MODIFY `active` VARCHAR(191) NULL,
    MODIFY `last_login` VARCHAR(191) NULL,
    MODIFY `prev_login` VARCHAR(191) NULL;
