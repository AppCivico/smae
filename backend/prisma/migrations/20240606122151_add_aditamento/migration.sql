-- CreateTable
CREATE TABLE "distribuicao_recurso_aditamento" (
    "id" SERIAL NOT NULL,
    "distribuicao_recurso_id" INTEGER NOT NULL,
    "data_vigencia" DATE NOT NULL,
    "justificativa" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "distribuicao_recurso_aditamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_aditamento" ADD CONSTRAINT "distribuicao_recurso_aditamento_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_aditamento" ADD CONSTRAINT "distribuicao_recurso_aditamento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
