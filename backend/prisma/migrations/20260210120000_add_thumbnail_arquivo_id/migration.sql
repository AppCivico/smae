-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN "thumbnail_arquivo_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "arquivo_thumbnail_arquivo_id_key" ON "arquivo"("thumbnail_arquivo_id");

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_thumbnail_arquivo_id_fkey" FOREIGN KEY ("thumbnail_arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
