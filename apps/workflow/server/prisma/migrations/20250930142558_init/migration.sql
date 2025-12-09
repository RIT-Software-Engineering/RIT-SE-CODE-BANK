/*
  Warnings:

  - You are about to drop the column `workflowStateId` on the `ActionState` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[baseActionStateId]` on the table `WorkflowState` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `baseActionStateId` to the `WorkflowState` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ActionState` DROP FOREIGN KEY `ActionState_workflowStateId_fkey`;

-- DropIndex
DROP INDEX `ActionState_workflowStateId_fkey` ON `ActionState`;

-- AlterTable
ALTER TABLE `ActionState` DROP COLUMN `workflowStateId`,
    ADD COLUMN `parentId` CHAR(36) NULL;

-- AlterTable
ALTER TABLE `WorkflowState` ADD COLUMN `baseActionStateId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `WorkflowState_baseActionStateId_key` ON `WorkflowState`(`baseActionStateId`);

-- AddForeignKey
ALTER TABLE `WorkflowState` ADD CONSTRAINT `WorkflowState_baseActionStateId_fkey` FOREIGN KEY (`baseActionStateId`) REFERENCES `ActionState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionState` ADD CONSTRAINT `ActionState_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `ActionState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
