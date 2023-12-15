-- CreateTable
CREATE TABLE "pdm_orcamento_realizado_config" (
    "id" SERIAL NOT NULL,
    "ano_referencia" INTEGER NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL DEFAULT false,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "atualizado_por" INTEGER NOT NULL,
    "execucao_concluida" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pdm_orcamento_realizado_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pdm_orcamento_realizado_config_meta_id_ano_referencia_ultim_key" ON "pdm_orcamento_realizado_config"("meta_id", "ano_referencia", "ultima_revisao");

-- AddForeignKey
ALTER TABLE "pdm_orcamento_realizado_config" ADD CONSTRAINT "pdm_orcamento_realizado_config_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_orcamento_realizado_config" ADD CONSTRAINT "pdm_orcamento_realizado_config_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
