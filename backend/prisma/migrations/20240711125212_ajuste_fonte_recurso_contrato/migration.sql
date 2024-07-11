/*
  Warnings:

  - You are about to drop the `ContratoFonteRecurso` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContratoFonteRecurso" DROP CONSTRAINT "ContratoFonteRecurso_contrato_id_fkey";

-- DropForeignKey
ALTER TABLE "ContratoFonteRecurso" DROP CONSTRAINT "ContratoFonteRecurso_projeto_fonte_recurso_id_fkey";

-- DropTable
DROP TABLE "ContratoFonteRecurso";

-- CreateTable
CREATE TABLE "contrato_fonte_recurso" (
    "id" SERIAL NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "cod_sof" TEXT NOT NULL,

    CONSTRAINT "contrato_fonte_recurso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contrato_fonte_recurso" ADD CONSTRAINT "contrato_fonte_recurso_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
