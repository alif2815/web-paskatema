-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('AKTIF', 'PURNA');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "education" TEXT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "memberStatus" "MemberStatus" NOT NULL DEFAULT 'AKTIF',
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "profilePublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];

