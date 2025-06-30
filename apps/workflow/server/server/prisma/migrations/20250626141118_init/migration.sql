-- CreateTable
CREATE TABLE `User` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Action` (
    `id` CHAR(36) NOT NULL,
    `action_type` ENUM('simple', 'workflow', 'complex', 'branching') NOT NULL DEFAULT 'simple',
    `is_frozen` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Metadata` (
    `id` CHAR(36) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `metadata_type` ENUM('string', 'number', 'boolean') NOT NULL,
    `action_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceEndpoints` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `action_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionChildRelationships` (
    `id` CHAR(36) NOT NULL,
    `action_id` CHAR(36) NOT NULL,
    `child_action_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `ActionChildRelationships_child_action_id_key`(`child_action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionChainLinks` (
    `id` CHAR(36) NOT NULL,
    `action_id` CHAR(36) NOT NULL,
    `next_action_id` CHAR(36) NOT NULL,

    UNIQUE INDEX `ActionChainLinks_action_id_key`(`action_id`),
    UNIQUE INDEX `ActionChainLinks_next_action_id_key`(`next_action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowAttributes` (
    `id` CHAR(36) NOT NULL,
    `base_action_id` CHAR(36) NOT NULL,
    `root_action_id` CHAR(36) NULL,

    UNIQUE INDEX `WorkflowAttributes_base_action_id_key`(`base_action_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Tags` (
    `id` CHAR(36) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagWorkflowRelationships` (
    `id` CHAR(36) NOT NULL,
    `tag_id` CHAR(36) NOT NULL,
    `workflow_id` CHAR(36) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permissions` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `action_id` CHAR(36) NOT NULL,
    `permission_type` ENUM('creator', 'sharer', 'editor', 'viewer') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkflowStates` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `workflow_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActionStates` (
    `id` CHAR(36) NOT NULL,
    `workflow_state_id` CHAR(36) NOT NULL,
    `action_id` CHAR(36) NOT NULL,
    `state_type` ENUM('completed', 'in_progress', 'not_started', 'hidden') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Metadata` ADD CONSTRAINT `Metadata_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceEndpoints` ADD CONSTRAINT `ReferenceEndpoints_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionChildRelationships` ADD CONSTRAINT `ActionChildRelationships_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionChildRelationships` ADD CONSTRAINT `ActionChildRelationships_child_action_id_fkey` FOREIGN KEY (`child_action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionChainLinks` ADD CONSTRAINT `ActionChainLinks_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionChainLinks` ADD CONSTRAINT `ActionChainLinks_next_action_id_fkey` FOREIGN KEY (`next_action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowAttributes` ADD CONSTRAINT `WorkflowAttributes_base_action_id_fkey` FOREIGN KEY (`base_action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowAttributes` ADD CONSTRAINT `WorkflowAttributes_root_action_id_fkey` FOREIGN KEY (`root_action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagWorkflowRelationships` ADD CONSTRAINT `TagWorkflowRelationships_tag_id_fkey` FOREIGN KEY (`tag_id`) REFERENCES `Tags`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagWorkflowRelationships` ADD CONSTRAINT `TagWorkflowRelationships_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `WorkflowAttributes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permissions` ADD CONSTRAINT `Permissions_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkflowStates` ADD CONSTRAINT `WorkflowStates_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `WorkflowAttributes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActionStates` ADD CONSTRAINT `ActionStates_action_id_fkey` FOREIGN KEY (`action_id`) REFERENCES `Action`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
