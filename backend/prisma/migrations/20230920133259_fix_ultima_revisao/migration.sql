BEGIN;
-- meta_ciclo_fisico_analise
WITH ranking AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY ciclo_fisico_id,
            meta_id ORDER BY criado_em DESC) AS rn
    FROM
        meta_ciclo_fisico_analise)
UPDATE
    meta_ciclo_fisico_analise
SET
    ultima_revisao = CASE WHEN ranking.rn = 1 THEN
        TRUE
    ELSE
        FALSE
    END
FROM
    ranking
WHERE
    meta_ciclo_fisico_analise.id = ranking.id;
-- meta_ciclo_fisico_fechamento
WITH ranking AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY ciclo_fisico_id,
            meta_id ORDER BY criado_em DESC) AS rn
    FROM
        meta_ciclo_fisico_fechamento)
UPDATE
    meta_ciclo_fisico_fechamento
SET
    ultima_revisao = CASE WHEN ranking.rn = 1 THEN
        TRUE
    ELSE
        FALSE
    END
FROM
    ranking
WHERE
    meta_ciclo_fisico_fechamento.id = ranking.id;
-- meta_ciclo_fisico_risco
WITH ranking AS (
    SELECT
        id,
        ROW_NUMBER() OVER (PARTITION BY ciclo_fisico_id,
            meta_id ORDER BY criado_em DESC) AS rn
    FROM
        meta_ciclo_fisico_risco)
UPDATE
    meta_ciclo_fisico_risco
SET
    ultima_revisao = CASE WHEN ranking.rn = 1 THEN
        TRUE
    ELSE
        FALSE
    END
FROM
    ranking
WHERE
    meta_ciclo_fisico_risco.id = ranking.id;
COMMIT;

