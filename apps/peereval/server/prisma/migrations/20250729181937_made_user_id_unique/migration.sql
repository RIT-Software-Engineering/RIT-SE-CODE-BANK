/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Journal` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Journal_userId_key` ON `Journal`(`userId`);
