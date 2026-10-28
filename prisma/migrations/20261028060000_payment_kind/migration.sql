-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('PEMBAYARAN', 'DONASI', 'MERCHANDISE');

-- AlterTable
ALTER TABLE "PaymentRequest" ADD COLUMN     "kind" "PaymentKind" NOT NULL DEFAULT 'PEMBAYARAN';


-- Pembelian merchandise yang sudah ada.
UPDATE "PaymentRequest" SET "kind" = 'MERCHANDISE' WHERE "productId" IS NOT NULL;
