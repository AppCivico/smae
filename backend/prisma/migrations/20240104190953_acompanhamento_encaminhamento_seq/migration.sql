/*
  Warnings:

  - Added the required column `ordem` to the `projeto_acompanhamento` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numero_identificador` to the `projeto_acompanhamento_item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "projeto_acompanhamento" ADD COLUMN     "ordem" SMALLINT;

UPDATE "projeto_acompanhamento"
SET ordem = x.seq
FROM ( SELECT id, ROW_NUMBER() OVER ( PARTITION BY projeto_id ORDER BY id ) seq FROM "projeto_acompanhamento" ) x
WHERE "projeto_acompanhamento"."id" = x.id;

ALTER TABLE "projeto_acompanhamento" ALTER COLUMN "ordem" SET NOT NULL;

-- AlterTable
ALTER TABLE "projeto_acompanhamento_item" ADD COLUMN     "numero_identificador" TEXT;

UPDATE "projeto_acompanhamento_item" ai
SET numero_identificador = pa.ordem||'.'||ai.ordem
FROM ( SELECT id, ordem FROM projeto_acompanhamento ) pa
WHERE pa.id = ai.projeto_acompanhamento_id;

ALTER TABLE "projeto_acompanhamento_item" ALTER COLUMN "numero_identificador" SET NOT NULL;
