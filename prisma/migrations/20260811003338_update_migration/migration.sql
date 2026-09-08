-- AlterTable
ALTER TABLE `structure` ADD COLUMN `imageId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Structure` ADD CONSTRAINT `Structure_imageId_fkey` FOREIGN KEY (`imageId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
