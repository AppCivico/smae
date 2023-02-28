/*
  Warnings:

  - You are about to drop the `tarefa_recurso` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `descricao` to the `Tarefa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recursos` to the `Tarefa` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tarefa` to the `Tarefa` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "tarefa_recurso" DROP CONSTRAINT "tarefa_recurso_tarefa_id_fkey";

-- AlterTable
ALTER TABLE "Tarefa" ADD COLUMN     "descricao" TEXT NOT NULL,
ADD COLUMN     "recursos" TEXT NOT NULL,
ADD COLUMN     "tarefa" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "portfolio" ADD COLUMN     "nivel_maximo_tarefa" SMALLINT NOT NULL DEFAULT 5;

-- DropTable
DROP TABLE "tarefa_recurso";
