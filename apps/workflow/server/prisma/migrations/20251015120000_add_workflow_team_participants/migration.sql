-- AlterTable
ALTER TABLE `WorkflowState` MODIFY `userId` CHAR(36) NULL;
ALTER TABLE `WorkflowState` ADD COLUMN `teamId` CHAR(36) NULL;

-- CreateTable
CREATE TABLE `WorkflowStateParticipant` (
    `id` CHAR(36) NOT NULL,
    `workflowStateId` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,

    UNIQUE INDEX `WorkflowStateParticipant_workflowStateId_userId_key`(`workflowStateId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WorkflowStateParticipant` ADD CONSTRAINT `WorkflowStateParticipant_workflowStateId_fkey` FOREIGN KEY (`workflowStateId`) REFERENCES `WorkflowState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
