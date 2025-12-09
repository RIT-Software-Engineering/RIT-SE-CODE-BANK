-- CreateTable
CREATE TABLE `Action` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `form` TEXT NULL,
    `actionType` ENUM('simple', 'workflow', 'complex', 'branching') NOT NULL DEFAULT 'simple',
    `isFrozen` BOOLEAN NOT NULL DEFAULT false,
    `nextActionId` CHAR(36) NULL,
    `parentActionId` CHAR(36) NULL,

    UNIQUE INDEX `Action_nextActionId_key`(`nextActionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Metadata` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `actionId` CHAR(36) NOT NULL,

    UNIQUE INDEX `Metadata_key_actionId_key`(`key`, `actionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceEndpoint` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `actionId` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowAttributes` (
    `id` CHAR(36) NOT NULL,
    `baseActionId` CHAR(36) NOT NULL,
    `rootActionId` CHAR(36) NULL,

    UNIQUE INDEX `WorkflowAttributes_baseActionId_key`(`baseActionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tag` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tag_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `actionId` CHAR(36) NOT NULL,
    `permissionType` ENUM('creator', 'sharer', 'editor', 'viewer') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowState` (
    `id` CHAR(36) NOT NULL,
    `userId` CHAR(36) NOT NULL,
    `workflowId` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionState` (
    `id` CHAR(36) NOT NULL,
    `workflowStateId` CHAR(36) NOT NULL,
    `actionId` CHAR(36) NOT NULL,
    `stateType` ENUM('completed', 'inProgress', 'notStarted', 'hidden') NOT NULL,
    `index` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_TagToWorkflowAttributes` (
    `A` CHAR(36) NOT NULL,
    `B` CHAR(36) NOT NULL,

    UNIQUE INDEX `_TagToWorkflowAttributes_AB_unique`(`A`, `B`),
    INDEX `_TagToWorkflowAttributes_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_parentActionId_fkey` FOREIGN KEY (`parentActionId`) REFERENCES `Action`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Action` ADD CONSTRAINT `Action_nextActionId_fkey` FOREIGN KEY (`nextActionId`) REFERENCES `Action`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Metadata` ADD CONSTRAINT `Metadata_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceEndpoint` ADD CONSTRAINT `ReferenceEndpoint_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowAttributes` ADD CONSTRAINT `WorkflowAttributes_baseActionId_fkey` FOREIGN KEY (`baseActionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowAttributes` ADD CONSTRAINT `WorkflowAttributes_rootActionId_fkey` FOREIGN KEY (`rootActionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowState` ADD CONSTRAINT `WorkflowState_workflowId_fkey` FOREIGN KEY (`workflowId`) REFERENCES `WorkflowAttributes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionState` ADD CONSTRAINT `ActionState_workflowStateId_fkey` FOREIGN KEY (`workflowStateId`) REFERENCES `WorkflowState`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionState` ADD CONSTRAINT `ActionState_actionId_fkey` FOREIGN KEY (`actionId`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TagToWorkflowAttributes` ADD CONSTRAINT `_TagToWorkflowAttributes_A_fkey` FOREIGN KEY (`A`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TagToWorkflowAttributes` ADD CONSTRAINT `_TagToWorkflowAttributes_B_fkey` FOREIGN KEY (`B`) REFERENCES `WorkflowAttributes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
