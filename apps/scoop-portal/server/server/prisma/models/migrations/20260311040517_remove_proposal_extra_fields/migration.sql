/*
  Warnings:

  - You are about to drop the column `duration` on the `ProjectProposal` table. All the data in the column will be lost.
  - You are about to drop the column `teamSize` on the `ProjectProposal` table. All the data in the column will be lost.
  - You are about to drop the column `techStack` on the `ProjectProposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `ProjectProposal` DROP COLUMN `duration`,
    DROP COLUMN `teamSize`,
    DROP COLUMN `techStack`;
