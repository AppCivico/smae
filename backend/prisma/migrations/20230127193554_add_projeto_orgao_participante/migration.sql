/*
  Warnings:

  - You are about to drop the column `orgaos_participantes` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "orgaos_participantes";

-- CreateTable
CREATE TABLE "projeto_orgao_participante" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "projeto_orgao_participante_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_orgao_gestor_id_fkey" FOREIGN KEY ("orgao_gestor_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao_participante" ADD CONSTRAINT "projeto_orgao_participante_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao_participante" ADD CONSTRAINT "projeto_orgao_participante_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
