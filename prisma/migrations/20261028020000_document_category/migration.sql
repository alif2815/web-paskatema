-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('AD_ART', 'PERATURAN', 'MATERI', 'LAINNYA');

-- AlterTable
ALTER TABLE "EBook" ADD COLUMN     "category" "DocumentCategory" NOT NULL DEFAULT 'MATERI';

