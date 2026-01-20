-- CreateEnum
CREATE TYPE "PosicaoLogotipo" AS ENUM ('Esquerda', 'Centro', 'Direita');

-- AlterTable
ALTER TABLE "portfolio" ADD COLUMN     "icone_impressao" INTEGER;

-- CreateTable
CREATE TABLE "projeto_termo_encerramento" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "icone_arquivo_id" INTEGER,
    "nome_projeto" TEXT NOT NULL,
    "orgao_responsavel_nome" TEXT NOT NULL,
    "portfolios_nomes" TEXT NOT NULL,
    "objeto" TEXT NOT NULL,
    "previsao_inicio" DATE,
    "previsao_termino" DATE,
    "data_inicio_real" DATE,
    "data_termino_real" DATE,
    "previsao_custo" DOUBLE PRECISION,
    "valor_executado_total" DOUBLE PRECISION,
    "status_final" TEXT NOT NULL,
    "etapa_nome" TEXT NOT NULL,
    "justificativa_id" INTEGER,
    "justificativa_complemento" TEXT,
    "responsavel_encerramento_nome" TEXT NOT NULL,
    "data_encerramento" DATE NOT NULL,
    "assinatura" TEXT,
    "posicao_logotipo" "PosicaoLogotipo" NOT NULL DEFAULT 'Esquerda',
    "ultima_versao" BOOLEAN DEFAULT true,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6),
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "projeto_termo_encerramento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projeto_termo_encerramento_projeto_id_removido_em_idx" ON "projeto_termo_encerramento"("projeto_id", "removido_em");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_termo_encerramento_projeto_id_ultima_versao_key" ON "projeto_termo_encerramento"("projeto_id", "ultima_versao");

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_icone_arquivo_id_fkey" FOREIGN KEY ("icone_arquivo_id") REFERENCES "arquivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_justificativa_id_fkey" FOREIGN KEY ("justificativa_id") REFERENCES "projeto_tipo_encerramento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_termo_encerramento" ADD CONSTRAINT "projeto_termo_encerramento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
