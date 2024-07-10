-- CreateTable
CREATE TABLE "grupo_responsavel_variavel_colaborador" (
    "id" SERIAL NOT NULL,
    "grupo_responsavel_variavel_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "grupo_responsavel_variavel_colaborador_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_colaborador" ADD CONSTRAINT "grupo_responsavel_variavel_colaborador_grupo_responsavel_v_fkey" FOREIGN KEY ("grupo_responsavel_variavel_id") REFERENCES "grupo_responsavel_variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_colaborador" ADD CONSTRAINT "grupo_responsavel_variavel_colaborador_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo_responsavel_variavel_colaborador" ADD CONSTRAINT "grupo_responsavel_variavel_colaborador_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
