/*
  Warnings:

  - Added the required column `weekStartDate` to the `TimecardWeeklyHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `TimecardWeeklyHistory` ADD COLUMN `weekStartDate` DATE NOT NULL;
