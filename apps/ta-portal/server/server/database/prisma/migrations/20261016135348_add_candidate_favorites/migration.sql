-- CreateTable
CREATE TABLE `_CandidateFavorites` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_CandidateFavorites_AB_unique`(`A`, `B`),
    INDEX `_CandidateFavorites_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CandidateFavorites` ADD CONSTRAINT `_CandidateFavorites_A_fkey` FOREIGN KEY (`A`) REFERENCES `Candidate`(`username`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CandidateFavorites` ADD CONSTRAINT `_CandidateFavorites_B_fkey` FOREIGN KEY (`B`) REFERENCES `JobPosition`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
