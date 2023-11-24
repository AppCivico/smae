-- CreateTable
CREATE TABLE "indicador_formula_composta_em_uso" (
    "id" SERIAL NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,

    CONSTRAINT "indicador_formula_composta_em_uso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_composta" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "formula_compilada" TEXT,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "formula_composta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formula_composta_variavel" (
    "id" SERIAL NOT NULL,
    "referencia" TEXT NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "janela" INTEGER NOT NULL,
    "usar_serie_acumulada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "formula_composta_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador_formula_composta" (
    "id" SERIAL NOT NULL,
    "indicador_id" INTEGER NOT NULL,
    "formula_composta_id" INTEGER NOT NULL,
    "indicador_origem_id" INTEGER,
    "desativado" BOOLEAN NOT NULL DEFAULT false,
    "desativado_em" TIMESTAMP(3),
    "desativado_por" INTEGER,

    CONSTRAINT "indicador_formula_composta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "indicador_formula_composta_em_uso_formula_composta_id_idx" ON "indicador_formula_composta_em_uso"("formula_composta_id");

-- CreateIndex
CREATE UNIQUE INDEX "formula_composta_variavel_formula_composta_id_referencia_key" ON "formula_composta_variavel"("formula_composta_id", "referencia");

-- CreateIndex
CREATE INDEX "idx_indicador_fc_formula_composta_id" ON "indicador_formula_composta"("formula_composta_id");

-- CreateIndex
CREATE INDEX "idx_indicador_fc_indicador_id" ON "indicador_formula_composta"("indicador_id");

-- AddForeignKey
ALTER TABLE "indicador_formula_composta_em_uso" ADD CONSTRAINT "indicador_formula_composta_em_uso_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_composta_em_uso" ADD CONSTRAINT "indicador_formula_composta_em_uso_formula_composta_id_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_variavel" ADD CONSTRAINT "formula_composta_variavel_formula_composta_id_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formula_composta_variavel" ADD CONSTRAINT "formula_composta_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_composta" ADD CONSTRAINT "indicador_formula_composta_indicador_id_fkey" FOREIGN KEY ("indicador_id") REFERENCES "indicador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_composta" ADD CONSTRAINT "indicador_formula_composta_formula_composta_id_fkey" FOREIGN KEY ("formula_composta_id") REFERENCES "formula_composta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_composta" ADD CONSTRAINT "indicador_formula_composta_indicador_origem_id_fkey" FOREIGN KEY ("indicador_origem_id") REFERENCES "indicador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador_formula_composta" ADD CONSTRAINT "indicador_formula_composta_desativado_por_fkey" FOREIGN KEY ("desativado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
