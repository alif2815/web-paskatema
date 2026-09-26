-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "videoId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;

