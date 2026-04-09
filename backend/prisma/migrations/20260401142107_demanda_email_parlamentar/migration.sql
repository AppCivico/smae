/*
  Warnings:

  - Made the column `assunto` on table `demanda_email_parlamentar` required. This step will fail if there are existing NULL values in that column.
  - Made the column `corpo` on table `demanda_email_parlamentar` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "assunto" SET DEFAULT '';
ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "corpo" SET DEFAULT '';

UPDATE "demanda_email_parlamentar" SET "assunto" = '' WHERE "assunto" IS NULL;
UPDATE "demanda_email_parlamentar" SET "corpo" = '' WHERE "corpo" IS NULL;

ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "assunto" SET NOT NULL;
ALTER TABLE "demanda_email_parlamentar" ALTER COLUMN "corpo" SET NOT NULL;

-- AlterTable
ALTER TABLE "workflow" ALTER COLUMN "vetores_busca" DROP DEFAULT;
