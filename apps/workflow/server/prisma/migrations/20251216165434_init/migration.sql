-- AddForeignKey
ALTER TABLE `ActionStateSubmission` ADD CONSTRAINT `ActionStateSubmission_actionStateId_fkey` FOREIGN KEY (`actionStateId`) REFERENCES `ActionState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
