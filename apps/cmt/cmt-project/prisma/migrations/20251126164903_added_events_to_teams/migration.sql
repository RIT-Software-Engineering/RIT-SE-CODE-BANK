-- AlterTable
ALTER TABLE `tbteam` ADD COLUMN `eventId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `TBTeam` ADD CONSTRAINT `TBTeam_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
