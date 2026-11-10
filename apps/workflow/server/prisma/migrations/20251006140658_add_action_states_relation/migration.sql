-- CreateTable
CREATE TABLE `_ActionStates` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_ActionStates_AB_unique`(`A`, `B`),
    INDEX `_ActionStates_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ActionStates` ADD CONSTRAINT `_ActionStates_A_fkey` FOREIGN KEY (`A`) REFERENCES `ActionState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ActionStates` ADD CONSTRAINT `_ActionStates_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkflowState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
