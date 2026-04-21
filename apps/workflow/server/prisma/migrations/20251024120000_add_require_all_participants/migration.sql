-- Add requireAllParticipants flag to actions so workflows can mark steps that demand every teammate submit.
ALTER TABLE `Action`
    ADD COLUMN `requireAllParticipants` BOOLEAN NOT NULL DEFAULT false;
