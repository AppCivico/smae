/*
  Warnings:

  - You are about to drop the column `tipoTransferencia` on the `classificacao` table. All the data in the column will be lost.
  - You are about to drop the `_ClassificacaoToTransferenciaTipo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `transferencia_tipo_id` to the `classificacao` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_ClassificacaoToTransferenciaTipo" DROP CONSTRAINT "_ClassificacaoToTransferenciaTipo_A_fkey";

-- DropForeignKey
ALTER TABLE "_ClassificacaoToTransferenciaTipo" DROP CONSTRAINT "_ClassificacaoToTransferenciaTipo_B_fkey";

-- DropForeignKey
ALTER TABLE "classificacao" DROP CONSTRAINT "classificacao_tipoTransferencia_fkey";

-- AlterTable
ALTER TABLE "classificacao" DROP COLUMN "tipoTransferencia",
ADD COLUMN     "transferencia_tipo_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "transferencia" ADD COLUMN     "classificacao_id" INTEGER;

-- DropTable
DROP TABLE "_ClassificacaoToTransferenciaTipo";

-- AddForeignKey
ALTER TABLE "transferencia" ADD CONSTRAINT "transferencia_classificacao_id_fkey" FOREIGN KEY ("classificacao_id") REFERENCES "classificacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_transferencia_tipo_id_fkey" FOREIGN KEY ("transferencia_tipo_id") REFERENCES "transferencia_tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
