-- AlterTable
ALTER TABLE `forms` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `personnel` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `questions` ALTER COLUMN `updated_at` DROP DEFAULT;

-- AlterTable
ALTER TABLE `sessions` ALTER COLUMN `expires_at` DROP DEFAULT;
