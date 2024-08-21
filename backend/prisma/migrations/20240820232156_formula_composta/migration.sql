-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "autogerenciavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "calc_casas_decimais" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "calc_codigo" TEXT,
ADD COLUMN     "calc_fim_medicao" DATE,
ADD COLUMN     "calc_inicio_medicao" DATE,
ADD COLUMN     "calc_orgao_id" INTEGER,
ADD COLUMN     "calc_periodicidade" "Periodicidade",
ADD COLUMN     "calc_regionalizavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo_pdm" "TipoPdm" NOT NULL DEFAULT 'PDM';

-- CreateTable
CREATE TABLE "formula_composta_rel_variavel" (
    "id" SERIAL NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,

    CONSTRAINT "formula_composta_rel_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "formula_composta_rel_variavel_variavel_id_idx" ON "formula_composta_rel_variavel"("variavel_id");

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_calc_orgao_id_fkey" FOREIGN KEY ("calc_orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_rel_variavel" ADD CONSTRAINT "formula_composta_rel_variavel_formula_composta_id_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_rel_variavel" ADD CONSTRAINT "formula_composta_rel_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "calc_unidade_medida_id" INTEGER;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_calc_unidade_medida_id_fkey" FOREIGN KEY ("calc_unidade_medida_id") REFERENCES "unidade_medida"("id") ON DELETE SET NULL ON UPDATE CASCADE;


ALTER TABLE "formula_composta" ADD COLUMN     "atualizar_calc" BOOLEAN NOT NULL DEFAULT FALSE;
