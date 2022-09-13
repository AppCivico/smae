-- CreateEnum
CREATE TYPE "Polaridade" AS ENUM ('Neutra', 'Positiva', 'Negativa');

-- CreateEnum
CREATE TYPE "Periodicidade" AS ENUM ('Diario', 'Semanal', 'Mensal', 'Bimestral', 'Trimestral', 'Quadrimestral', 'Semestral', 'Anual', 'Quinquenal', 'Secular');

-- CreateTable
CREATE TABLE "agregador" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,

    CONSTRAINT "agregador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indicador" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "agregador_id" INTEGER NOT NULL,
    "janela_agregador" INTEGER,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "periodicidade" "Periodicidade" NOT NULL,
    "polaridade" "Polaridade" NOT NULL DEFAULT 'Neutra',
    "regionalizavel" BOOLEAN NOT NULL DEFAULT false,
    "inicio_medicao" DATE NOT NULL,
    "fim_medicao" DATE NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "indicador_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "agregador_codigo_key" ON "agregador"("codigo");

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_agregador_id_fkey" FOREIGN KEY ("agregador_id") REFERENCES "agregador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
