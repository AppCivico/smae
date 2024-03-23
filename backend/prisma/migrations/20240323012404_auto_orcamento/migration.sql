-- AlterTable
ALTER TABLE "pdm" ADD COLUMN     "orcamento_dia_abertura" SMALLINT NOT NULL DEFAULT 1,
ADD COLUMN     "orcamento_dia_fechamento" SMALLINT NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "pdm_orcamento_realizado_controle_concluido" (
    "id" SERIAL NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "referencia_dia_abertura" SMALLINT,
    "referencia_dia_fechamento" SMALLINT,
    "execucao_concluida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pdm_orcamento_realizado_controle_concluido_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pdm_orcamento_realizado_controle_concluido" ADD CONSTRAINT "pdm_orcamento_realizado_controle_concluido_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
