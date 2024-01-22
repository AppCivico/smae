-- CreateTable
CREATE TABLE "meta_status_consolidado_cf" (
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "variaveis_total" INTEGER[],
    "variaveis_preenchidas" INTEGER[],
    "variaveis_enviadas" INTEGER[],
    "variaveis_conferidas" INTEGER[],
    "variaveis_aguardando_cp" INTEGER[],
    "variaveis_aguardando_complementacao" INTEGER[],
    "cronograma_total" INTEGER[],
    "cronograma_preenchido" INTEGER[],
    "orcamento_total" INTEGER[],
    "orcamento_preenchido" INTEGER[],
    "analise_qualitativa_enviada" BOOLEAN NOT NULL,
    "risco_enviado" BOOLEAN NOT NULL,
    "fechamento_enviado" BOOLEAN NOT NULL,
    "pendente_cp" BOOLEAN NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meta_status_consolidado_cf_pkey" PRIMARY KEY ("meta_id")
);

-- AddForeignKey
ALTER TABLE "meta_status_consolidado_cf" ADD CONSTRAINT "meta_status_consolidado_cf_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_status_consolidado_cf" ADD CONSTRAINT "meta_status_consolidado_cf_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
