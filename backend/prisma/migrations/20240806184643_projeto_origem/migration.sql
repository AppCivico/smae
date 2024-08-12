-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "origem_cache" JSON NOT NULL DEFAULT '{}';

-- CreateTable
CREATE TABLE "projeto_origem" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "origem_tipo" "ProjetoOrigemTipo" NOT NULL DEFAULT 'Outro',
    "origem_eh_pdm" BOOLEAN NOT NULL DEFAULT false,
    "origem_outro" TEXT,
    "meta_codigo" TEXT,
    "meta_id" INTEGER,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "projeto_origem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
