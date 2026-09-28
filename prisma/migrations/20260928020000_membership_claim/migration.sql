-- Klaim purna diperluas menjadi pengajuan keanggotaan (Aktif / Purna).
-- Kolom di-rename (bukan drop + add) supaya pengajuan yang sudah ada tetap.
ALTER TABLE "User" RENAME COLUMN "purnaClaimAngkatan" TO "claimAngkatan";
ALTER TABLE "User" RENAME COLUMN "purnaClaimYear" TO "claimGraduationYear";
ALTER TABLE "User" RENAME COLUMN "purnaClaimNote" TO "claimNote";
ALTER TABLE "User" RENAME COLUMN "purnaClaimAt" TO "claimAt";
ALTER TABLE "User" ADD COLUMN "claimStatus" "MemberStatus";

-- Pengajuan lama semuanya pengajuan purna.
UPDATE "User" SET "claimStatus" = 'PURNA' WHERE "claimAt" IS NOT NULL;
