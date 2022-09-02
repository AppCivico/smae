-- AlterTable
ALTER TABLE "regiao" ADD COLUMN     "arquivo_shapefile_id" INTEGER;

-- AlterTable
ALTER TABLE "tag" ADD COLUMN     "arquivo_icone_id" INTEGER;

-- CreateTable
CREATE TABLE "arquivo" (
    "id" SERIAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "caminho" TEXT NOT NULL,
    "nome_original" TEXT NOT NULL,
    "tamanho_bytes" INTEGER NOT NULL,
    "descricao" TEXT,
    "tipo_documento_id" INTEGER,

    CONSTRAINT "arquivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pmd_arquivo" (
    "id" SERIAL NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "pmd_arquivo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_arquivo_icone_id_fkey" FOREIGN KEY ("arquivo_icone_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regiao" ADD CONSTRAINT "regiao_arquivo_shapefile_id_fkey" FOREIGN KEY ("arquivo_shapefile_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivo" ADD CONSTRAINT "arquivo_tipo_documento_id_fkey" FOREIGN KEY ("tipo_documento_id") REFERENCES "tipo_documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pmd_arquivo" ADD CONSTRAINT "pmd_arquivo_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pmd_arquivo" ADD CONSTRAINT "pmd_arquivo_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pmd_arquivo" ADD CONSTRAINT "pmd_arquivo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pmd_arquivo" ADD CONSTRAINT "pmd_arquivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pmd_arquivo" ADD CONSTRAINT "pmd_arquivo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
