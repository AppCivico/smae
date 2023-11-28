-- AlterTable
ALTER TABLE "arquivo" ADD COLUMN     "diretorio_caminho" TEXT;

-- CreateTable
CREATE TABLE "diretorio" (
    "id" SERIAL NOT NULL,
    "caminho" TEXT NOT NULL,
    "projeto_id" INTEGER,

    CONSTRAINT "diretorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "diretorio_projeto_id_idx" ON "diretorio"("projeto_id");

-- AddForeignKey
ALTER TABLE "diretorio" ADD CONSTRAINT "diretorio_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
