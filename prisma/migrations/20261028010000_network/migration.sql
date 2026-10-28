-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('LOWONGAN', 'MAGANG', 'BEASISWA', 'LOMBA', 'LAINNYA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "openToMentor" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "description" TEXT NOT NULL,
    "link" TEXT,
    "deadline" TIMESTAMP(3),
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

