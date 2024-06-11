/*
  Warnings:

  - You are about to drop the column `viewNotaComOrdemId` on the `aviso_email` table. All the data in the column will be lost.
  - You are about to drop the column `viewNotaComOrdemId` on the `nota_enderecamento` table. All the data in the column will be lost.
  - You are about to drop the column `viewNotaComOrdemId` on the `nota_enderecamento_resposta` table. All the data in the column will be lost.
  - You are about to drop the column `viewNotaComOrdemId` on the `nota_revisao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "aviso_email" DROP COLUMN "viewNotaComOrdemId";

-- AlterTable
ALTER TABLE "nota_enderecamento" DROP COLUMN "viewNotaComOrdemId";

-- AlterTable
ALTER TABLE "nota_enderecamento_resposta" DROP COLUMN "viewNotaComOrdemId";

-- AlterTable
ALTER TABLE "nota_revisao" DROP COLUMN "viewNotaComOrdemId";
