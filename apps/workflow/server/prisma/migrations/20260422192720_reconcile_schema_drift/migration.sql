-- DropForeignKey
ALTER TABLE `WorkflowAttributes` DROP FOREIGN KEY `WorkflowAttributes_rootActionId_fkey`;

-- DropIndex
DROP INDEX `WorkflowAttributes_rootActionId_fkey` ON `WorkflowAttributes`;

-- AddForeignKey
ALTER TABLE `WorkflowAttributes` ADD CONSTRAINT `WorkflowAttributes_rootActionId_fkey` FOREIGN KEY (`rootActionId`) REFERENCES `Action`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
