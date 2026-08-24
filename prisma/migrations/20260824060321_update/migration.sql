-- AlterTable
ALTER TABLE `user` ADD COLUMN `avatarId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_avatarId_fkey` FOREIGN KEY (`avatarId`) REFERENCES `Media`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
