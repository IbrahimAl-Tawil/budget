-- AlterTable
ALTER TABLE "Investment" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Investment_externalId_key" ON "Investment"("externalId");
