BEGIN;

-- AlterTable
ALTER TABLE "indicador_variavel"
    ADD COLUMN "indicador_origem_id" INTEGER;

-- AddForeignKey
ALTER TABLE "indicador_variavel"
    ADD CONSTRAINT "indicador_variavel_indicador_origem_id_fkey" FOREIGN KEY ("indicador_origem_id") REFERENCES "indicador" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO indicador_variavel (indicador_id, variavel_id, indicador_origem_id)
WITH r AS (
    SELECT
        a.iniciativa_id,
        iv.variavel_id,
        b.id AS indicador_origem_id
    FROM
        atividade a
        JOIN indicador b on b.atividade_id = a.id AND b.removido_em is null
        JOIN indicador_variavel iv ON iv.desativado_em IS NULL
            AND iv.indicador_id = b.id
    WHERE
        a.compoe_indicador_iniciativa
        AND a.removido_em IS NULL
)
SELECT
    i.id AS indicador_id,
    r.variavel_id,
    r.indicador_origem_id
FROM
    r
    JOIN iniciativa m ON m.id = iniciativa_id
    JOIN indicador i ON i.meta_id = m.id
        AND i.removido_em IS NULL;


INSERT INTO indicador_variavel (indicador_id, variavel_id, indicador_origem_id)
WITH r AS (
    SELECT
        a.meta_id,
        iv.variavel_id,
        b.id AS indicador_origem_id
    FROM
        iniciativa a
        JOIN indicador b ON b.removido_em IS NULL
            AND b.iniciativa_id = a.id
        JOIN indicador_variavel iv ON iv.desativado_em IS NULL
            AND iv.indicador_id = b.id
    WHERE
        a.compoe_indicador_meta
        AND a.removido_em IS NULL
)
SELECT
    i.id AS indicador_id,
    r.variavel_id,
    r.indicador_origem_id
FROM
    r
    JOIN meta m ON m.id = meta_id
    JOIN indicador i ON i.meta_id = m.id
        AND i.removido_em IS NULL;


COMMIT;

