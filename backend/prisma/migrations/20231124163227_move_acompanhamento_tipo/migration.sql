/*
  Warnings:

  - You are about to drop the column `acompanhanmento_tipo_id` on the `projeto` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_acompanhanmento_tipo_id_fkey";

-- AlterTable
ALTER TABLE "acompanhamento_tipo" ADD COLUMN     "atualizado_em" TIMESTAMP(3),
ADD COLUMN     "atualizado_por" INTEGER;

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "acompanhanmento_tipo_id";

-- AlterTable
ALTER TABLE "projeto_acompanhamento" ADD COLUMN     "acompanhanmento_tipo_id" INTEGER;

-- AddForeignKey
ALTER TABLE "acompanhamento_tipo" ADD CONSTRAINT "acompanhamento_tipo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_acompanhamento" ADD CONSTRAINT "projeto_acompanhamento_acompanhanmento_tipo_id_fkey" FOREIGN KEY ("acompanhanmento_tipo_id") REFERENCES "acompanhamento_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
