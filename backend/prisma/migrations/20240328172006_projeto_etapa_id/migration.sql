-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "projeto_etapa_id" INTEGER;

-- CreateTable
CREATE TABLE "projeto_etapa" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_etapa_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_etapa" ADD CONSTRAINT "projeto_etapa_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_etapa" ADD CONSTRAINT "projeto_etapa_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_etapa" ADD CONSTRAINT "projeto_etapa_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_projeto_etapa_id_fkey" FOREIGN KEY ("projeto_etapa_id") REFERENCES "projeto_etapa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
