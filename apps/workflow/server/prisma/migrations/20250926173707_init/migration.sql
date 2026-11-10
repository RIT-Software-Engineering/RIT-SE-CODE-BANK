/*
  Warnings:

  - You are about to drop the column `parentId` on the `ActionState` table. All the data in the column will be lost.
  - You are about to drop the column `baseActionStateId` on the `WorkflowState` table. All the data in the column will be lost.
  - Added the required column `workflowStateId` to the `ActionState` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ActionState` DROP FOREIGN KEY `ActionState_parentId_fkey`;

-- DropForeignKey
ALTER TABLE `WorkflowState` DROP FOREIGN KEY `WorkflowState_baseActionStateId_fkey`;

-- DropIndex
DROP INDEX `ActionState_parentId_fkey` ON `ActionState`;

-- DropIndex
DROP INDEX `WorkflowState_baseActionStateId_key` ON `WorkflowState`;

-- AlterTable
ALTER TABLE `ActionState` DROP COLUMN `parentId`,
    ADD COLUMN `workflowStateId` CHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE `WorkflowState` DROP COLUMN `baseActionStateId`;

-- AddForeignKey
ALTER TABLE `ActionState` ADD CONSTRAINT `ActionState_workflowStateId_fkey` FOREIGN KEY (`workflowStateId`) REFERENCES `WorkflowState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
