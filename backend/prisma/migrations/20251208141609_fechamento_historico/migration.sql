-- CreateTable
CREATE TABLE "meta_ciclo_fisico_fechamento_historico" (
    "id" SERIAL NOT NULL,
    "meta_ciclo_fisico_fechamento_id" INTEGER NOT NULL,
    "comentario" TEXT,
    "fechamento_criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechamento_criado_por" INTEGER NOT NULL,
    "reaberto_em" TIMESTAMP(3) NOT NULL,
    "reaberto_por" INTEGER NOT NULL,

    CONSTRAINT "meta_ciclo_fisico_fechamento_historico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_historico_meta_ciclo_fisico_f_fkey" FOREIGN KEY ("meta_ciclo_fisico_fechamento_id") REFERENCES "meta_ciclo_fisico_fechamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_historico_fechamento_criado_p_fkey" FOREIGN KEY ("fechamento_criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_ciclo_fisico_fechamento_historico" ADD CONSTRAINT "meta_ciclo_fisico_fechamento_historico_reaberto_por_fkey" FOREIGN KEY ("reaberto_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
