-- CreateTable
CREATE TABLE "pessoa_acesso_pdm" (
    "id" SERIAL NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "metas_cronograma" INTEGER[],
    "metas_variaveis" INTEGER[],
    "variaveis" INTEGER[],
    "cronogramas_etapas" INTEGER[],
    "data_ciclo" DATE,
    "perfil" TEXT NOT NULL,
    "congelado" BOOLEAN NOT NULL,

    CONSTRAINT "pessoa_acesso_pdm_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pessoa_acesso_pdm" ADD CONSTRAINT "pessoa_acesso_pdm_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
