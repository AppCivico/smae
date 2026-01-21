/*
  Warnings:

  - A unique constraint covering the columns `[variavel_id,serie,ciclo_referencia]` on the table `variavel_suspensa_controle` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "variavel_suspensa_controle" DROP CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_base_id_fkey";

-- DropForeignKey
ALTER TABLE "variavel_suspensa_controle" DROP CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_corrente_id_fkey";

-- AlterTable
ALTER TABLE "variavel_suspensa_controle" ADD COLUMN     "ciclo_referencia" DATE,
ALTER COLUMN "ciclo_fisico_base_id" DROP NOT NULL,
ALTER COLUMN "ciclo_fisico_corrente_id" DROP NOT NULL,
ALTER COLUMN "processado_em" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "variavel_suspensa_controle_variavel_id_serie_ciclo_referenc_key" ON "variavel_suspensa_controle"("variavel_id", "serie", "ciclo_referencia")
where removido_em IS NULL;

-- AddForeignKey
ALTER TABLE "variavel_suspensa_controle" ADD CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_base_id_fkey" FOREIGN KEY ("ciclo_fisico_base_id") REFERENCES "ciclo_fisico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_suspensa_controle" ADD CONSTRAINT "variavel_suspensa_controle_ciclo_fisico_corrente_id_fkey" FOREIGN KEY ("ciclo_fisico_corrente_id") REFERENCES "ciclo_fisico"("id") ON DELETE SET NULL ON UPDATE CASCADE;
