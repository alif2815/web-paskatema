-- AlterTable
ALTER TABLE "News" ADD COLUMN "filePath" TEXT,
ALTER COLUMN "content" DROP NOT NULL;
