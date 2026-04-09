/*
  Warnings:

  - You are about to drop the column `vetores_busca` on the `workflow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "assunto" DROP DEFAULT,
ALTER COLUMN "corpo" DROP DEFAULT;

-- AlterTable
ALTER TABLE "workflow" DROP COLUMN "vetores_busca";
