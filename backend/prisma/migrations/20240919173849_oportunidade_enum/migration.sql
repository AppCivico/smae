/*
  Warnings:

  - The values [Inadequada] on the enum `TransfereGovOportunidadeAvaliacao` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;

UPDATE "transfere_gov_oportunidade" SET "avaliacao" = null WHERE "avaliacao" = 'Inadequada';

CREATE TYPE "TransfereGovOportunidadeAvaliacao_new" AS ENUM ('NaoSeAplica', 'Selecionada');
ALTER TABLE "transfere_gov_oportunidade" ALTER COLUMN "avaliacao" TYPE "TransfereGovOportunidadeAvaliacao_new" USING ("avaliacao"::text::"TransfereGovOportunidadeAvaliacao_new");
ALTER TYPE "TransfereGovOportunidadeAvaliacao" RENAME TO "TransfereGovOportunidadeAvaliacao_old";
ALTER TYPE "TransfereGovOportunidadeAvaliacao_new" RENAME TO "TransfereGovOportunidadeAvaliacao";
DROP TYPE "TransfereGovOportunidadeAvaliacao_old";
COMMIT;
