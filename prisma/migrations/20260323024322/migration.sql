-- DropForeignKey
ALTER TABLE `forms` DROP FOREIGN KEY `forms_created_by_personnel_id_fkey`;

-- AlterTable
ALTER TABLE `forms` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `personnel` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `questions` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `sessions` ALTER COLUMN `expires_at` DROP DEFAULT;

-- AddForeignKey
ALTER TABLE `forms` ADD CONSTRAINT `forms_created_by_personnel_id_fkey` FOREIGN KEY (`created_by_personnel_id`) REFERENCES `personnel`(`personnel_id`) ON DELETE SET NULL ON UPDATE RESTRICT;
