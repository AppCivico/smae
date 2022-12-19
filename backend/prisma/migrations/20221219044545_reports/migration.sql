-- CreateEnum
CREATE TYPE "TipoRelatorio" AS ENUM ('Consolidado', 'Analtico');

-- CreateEnum
CREATE TYPE "FonteRelatorio" AS ENUM ('OrcamentoExecutado', 'IndicadoresSemestral', 'IndicadoresAnual', 'MonitoramentoMensal');

-- CreateTable
CREATE TABLE "relatorio" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "pdm_id" INTEGER NOT NULL,
    "parametros" JSON NOT NULL DEFAULT '{}',
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER,
    "arquivo_id" INTEGER NOT NULL,
    "temporario" BOOLEAN NOT NULL,
    "tipo" "TipoRelatorio" NOT NULL,
    "fonte" "FonteRelatorio" NOT NULL,

    CONSTRAINT "relatorio_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
