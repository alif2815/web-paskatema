-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- Angkatan aktif saat fitur ini dibuat (September 2026). Status anggota tidak
-- diubah otomatis di sini; admin menerapkannya dari panel.
INSERT INTO "AppSetting" ("key", "value", "updatedAt")
VALUES ('active_angkatan', '[33, 34, 35]', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
