-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "atividade_id" INTEGER;

-- CreateTable
CREATE TABLE "atividade" (
    "id" SERIAL NOT NULL,
    "iniciativa_id" INTEGER NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contexto" TEXT,
    "complemento" TEXT,
    "compoe_indicador_iniciativa" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "ativo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "atividade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade_orgao" (
    "id" SERIAL NOT NULL,
    "atividade_id" INTEGER NOT NULL,
    "responsavel" BOOLEAN NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "atividade_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividade_responsavel" (
    "id" SERIAL NOT NULL,
    "atividade_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "coordenador_responsavel_cp" BOOLEAN NOT NULL,

    CONSTRAINT "atividade_responsavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade" ADD CONSTRAINT "atividade_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_orgao" ADD CONSTRAINT "atividade_orgao_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_orgao" ADD CONSTRAINT "atividade_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_responsavel" ADD CONSTRAINT "atividade_responsavel_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_responsavel" ADD CONSTRAINT "atividade_responsavel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividade_responsavel" ADD CONSTRAINT "atividade_responsavel_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Indicador FK constraint
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_one_fk_required" CHECK (meta_id IS NOT NULL OR iniciativa_id IS NOT NULL OR atividade_id IS NOT NULL);
