-- DropForeignKey
ALTER TABLE `journal_entry` DROP FOREIGN KEY `Journal_Entry_contactee_name_fkey`;

-- DropForeignKey
ALTER TABLE `journal_entry` DROP FOREIGN KEY `Journal_Entry_journal_owner_name_fkey`;

-- DropIndex
DROP INDEX `Journal_Entry_contactee_name_fkey` ON `journal_entry`;

-- DropIndex
DROP INDEX `Journal_Entry_journal_owner_name_fkey` ON `journal_entry`;
