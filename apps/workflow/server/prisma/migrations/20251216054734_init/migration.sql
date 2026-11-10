/*
  Warnings:

  - A unique constraint covering the columns `[actionStateId,userId,workflowStateId]` on the table `ActionStateSubmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workflowStateId` to the `ActionStateSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ActionStateSubmission` DROP FOREIGN KEY `ActionStateSubmission_actionStateId_fkey`;

-- DropIndex
DROP INDEX `ActionStateSubmission_actionStateId_userId_key` ON `ActionStateSubmission`;

-- AlterTable (add nullable, backfill, then enforce NOT NULL)
ALTER TABLE `ActionStateSubmission` ADD COLUMN `workflowStateId` CHAR(36) NULL;

-- Backfill workflowStateId from the ActionState to WorkflowState relation table
UPDATE `ActionStateSubmission` sas
JOIN `_ActionStates` rel ON rel.`A` = sas.`actionStateId`
SET sas.`workflowStateId` = rel.`B`
WHERE sas.`workflowStateId` IS NULL;

-- Enforce NOT NULL now that values are populated
ALTER TABLE `ActionStateSubmission`
  MODIFY `workflowStateId` CHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `ActionStateSubmission_actionStateId_userId_workflowStateId_key` ON `ActionStateSubmission`(`actionStateId`, `userId`, `workflowStateId`);

-- AddForeignKey
ALTER TABLE `ActionStateSubmission` ADD CONSTRAINT `ActionStateSubmission_workflowStateId_fkey` FOREIGN KEY (`workflowStateId`) REFERENCES `WorkflowState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
