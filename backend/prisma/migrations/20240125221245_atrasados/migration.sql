-- CreateTable
CREATE TABLE "meta_status_atraso_consolidado_mes" (
    "meta_id" INTEGER NOT NULL,
    "mes" DATE NOT NULL,
    "variaveis_atrasadas" INTEGER NOT NULL,
    "orcamento_atrasados" INTEGER NOT NULL,

    CONSTRAINT "meta_status_atraso_consolidado_mes_pkey" PRIMARY KEY ("meta_id","mes")
);

-- CreateTable
CREATE TABLE "meta_status_atraso_variavel" (
    "meta_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "meses_atrasados" DATE[],

    CONSTRAINT "meta_status_atraso_variavel_pkey" PRIMARY KEY ("meta_id","variavel_id")
);

-- AddForeignKey
ALTER TABLE "meta_status_atraso_consolidado_mes" ADD CONSTRAINT "meta_status_atraso_consolidado_mes_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_status_atraso_variavel" ADD CONSTRAINT "meta_status_atraso_variavel_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meta_status_atraso_variavel" ADD CONSTRAINT "meta_status_atraso_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
