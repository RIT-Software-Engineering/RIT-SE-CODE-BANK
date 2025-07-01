-- CreateTable
CREATE TABLE `Templates` (
    `id` VARCHAR(191) NOT NULL,
    `rubric_id` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Templates_rubric_id_key`(`rubric_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Rubrics` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `rows` INTEGER NOT NULL,
    `columns` INTEGER NOT NULL,
    `criteria_column` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Headers` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `points` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `rubric_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Criteria` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `points` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `rubric_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Levels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `points` DOUBLE NULL,
    `weight` DOUBLE NULL,
    `criterion_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Templates` ADD CONSTRAINT `Templates_rubric_id_fkey` FOREIGN KEY (`rubric_id`) REFERENCES `Rubrics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Headers` ADD CONSTRAINT `Headers_rubric_id_fkey` FOREIGN KEY (`rubric_id`) REFERENCES `Rubrics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Criteria` ADD CONSTRAINT `Criteria_rubric_id_fkey` FOREIGN KEY (`rubric_id`) REFERENCES `Rubrics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Levels` ADD CONSTRAINT `Levels_criterion_id_fkey` FOREIGN KEY (`criterion_id`) REFERENCES `Criteria`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
