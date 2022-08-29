-- AlterTable
ALTER TABLE "pessoa_fisica" ADD COLUMN     "cargo" TEXT;

-- CreateTable
CREATE TABLE "eixo" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "eixo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdm" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE NOT NULL,
    "data_publicacao" DATE,
    "periodo_do_ciclo_participativo_inicio" DATE,
    "periodo_do_ciclo_participativo_fim" DATE,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "prefeito" TEXT NOT NULL,
    "equipe_tecnica" TEXT NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desativado_por" INTEGER,
    "desativado_em" TIMESTAMPTZ(6),

    CONSTRAINT "pdm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "eixo" ADD CONSTRAINT "eixo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eixo" ADD CONSTRAINT "eixo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eixo" ADD CONSTRAINT "eixo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm" ADD CONSTRAINT "pdm_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm" ADD CONSTRAINT "pdm_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm" ADD CONSTRAINT "pdm_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
