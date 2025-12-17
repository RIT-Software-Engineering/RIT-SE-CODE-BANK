-- AlterTable
ALTER TABLE `events` MODIFY `type` ENUM('exam', 'quiz', 'assignment', 'lecture', 'project', 'class_activity', 'lab', 'office_hours', 'meeting') NOT NULL;
