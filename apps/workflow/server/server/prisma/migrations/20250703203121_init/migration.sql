-- AlterTable
ALTER TABLE `metadata` MODIFY `value` TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE `ActionStates` ADD CONSTRAINT `ActionStates_workflow_state_id_fkey` FOREIGN KEY (`workflow_state_id`) REFERENCES `WorkflowStates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
