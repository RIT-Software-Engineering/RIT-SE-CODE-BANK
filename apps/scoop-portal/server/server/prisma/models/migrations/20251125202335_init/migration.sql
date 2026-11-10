-- AddForeignKey
ALTER TABLE `Teams` ADD CONSTRAINT `Teams_scoopervisorId_fkey` FOREIGN KEY (`scoopervisorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
