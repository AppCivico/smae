/*
  Warnings:

  - Added the required column `nivel` to the `cronograma_etapa` table without a default value. This is not possible if the table is not empty.
  - Made the column `ordem` on table `cronograma_etapa` required. This step will fail if there are existing NULL values in that column.

*/

-- CreateEnum
CREATE TYPE "CronogramaEtapaNivel" AS ENUM ('Etapa', 'Fase', 'SubFase');

-- AlterTable
ALTER TABLE "cronograma_etapa" ADD COLUMN "nivel" "CronogramaEtapaNivel";

-- Calculando e atualizando valores de Nível
UPDATE "cronograma_etapa" ce SET nivel = sub.nivel::"CronogramaEtapaNivel"
FROM (
    SELECT
        ce.id,
        ce.etapa_id,
        (
            CASE 
            WHEN e.etapa_pai_id IS NULL THEN 'Etapa'
            WHEN e.etapa_pai_id IS NOT NULL AND EXISTS ( SELECT 1 FROM etapa WHERE id = e.etapa_pai_id AND etapa_pai_id IS NULL ) THEN 'Fase'
            WHEN e.etapa_pai_id IS NOT NULL AND EXISTS ( SELECT 1 FROM etapa WHERE id = e.etapa_pai_id AND etapa_pai_id IS NOT NULL ) THEN 'SubFase'
            END
        ) nivel
    FROM "etapa" e
    JOIN "cronograma_etapa" ce ON ce.etapa_id = e.id
) sub
WHERE ce.id = sub.id;

-- Calculando e atualizando valores de Ordem
UPDATE "cronograma_etapa" ce SET ordem = sub.ordem_calculada
FROM (
    SELECT *
    FROM (SELECT *, row_number() OVER(PARTITION BY cronograma_id, nivel order by cronograma_id asc, etapa_id asc) AS ordem_calculada FROM cronograma_etapa) x
) sub
WHERE ce.id = sub.id;

ALTER TABLE "cronograma_etapa"
  ALTER COLUMN "ordem" SET NOT NULL,
  ALTER COLUMN "nivel" SET NOT NULL;

